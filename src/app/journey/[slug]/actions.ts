"use server";

import { createClient } from "@/utils/supabase/server";

export async function getJourneyByUuid(uuid: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("journeys")
    .select("*")
    .eq("id", uuid)
    .single();

    
  return { data, error };
}

export async function getMissionById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("missions")
    .select("*")
    .eq("id", id)
    .single();
  return { data, error };
}


export async function getJourneyWeeklyStats(journeyId: string) {
  try {
    const supabase = await createClient();

    // 1. 해당 Journey의 모든 주차 가져오기
    const { data: weeks, error: weeksError } = await supabase
      .from("journey_weeks")
      .select("id, name, week_number")
      .eq("journey_id", journeyId)
      .order("week_number");

    if (weeksError) throw weeksError;
    if (!weeks || weeks.length === 0) {
      return { data: [], error: null };
    }

    // 주차 ID 목록
    const weekIds = weeks.map((week) => week.id);

    // 2. 해당 Journey의 모든 참여 학생(user) ID 가져오기
    const { data: journeyParticipants, error: participantsError } = await supabase
      .from("user_journeys")
      .select("user_id")
      .eq("journey_id", journeyId)
      .eq("role_in_journey", "user");

    if (participantsError) throw participantsError;
    
    // 참여 학생 ID 목록
    const studentIds = (journeyParticipants || []).map(p => p.user_id).filter(Boolean);
    const totalStudents = studentIds.length;
    const effectiveStudentCount = Math.max(totalStudents, 1); // 최소 1명
    
    // 3. 학생들의 상세 정보 가져오기
    let students: { id: string; name: string }[] = [];
    
    if (studentIds.length > 0) {
      const { data: usersData, error: usersError } = await supabase
        .from("profiles")
        .select("id, first_name, last_name")
        .in("id", studentIds);
        
      if (usersError) {
        console.error("사용자 정보 조회 오류:", usersError);
      } else if (usersData) {
        students = usersData.map(user => ({
          id: user.id,
          name: `${user.last_name}${user.first_name}`.trim()
        }));
      }
    }


    // 4. 미션 정보 가져오기 (이름 포함)
    const { data: missions, error: missionsError } = await supabase
      .from("missions")
      .select("id, name");
      
    if (missionsError) {
      console.error("미션 정보 조회 오류:", missionsError);
      return { data: null, error: missionsError };
    }
    
    // 미션 ID -> 이름 매핑
    const missionNameMap: Record<string, string> = {};
    missions?.forEach(mission => {
      missionNameMap[mission.id] = mission.name || '이름 없는 미션';
    });

    // 5. 각 주차별 미션 인스턴스 가져오기 (미션 정보 포함)
    const { data: missionInstances, error: missionError } = await supabase
      .from("journey_mission_instances")
      .select("id, journey_week_id, mission_id")
      .in("journey_week_id", weekIds);

    if (missionError) throw missionError;
    
    if (!missionInstances || missionInstances.length === 0) {
      // 미션이 없는 경우 기본 통계 반환
      const emptyStats = weeks.map(week => ({
        id: week.id,
        name: week.name || `Week ${week.week_number}`,
        weekNumber: week.week_number || 0,
        totalMissions: 0,
        totalStudents: effectiveStudentCount,
        totalPossibleSubmissions: 0,
        submittedMissions: 0,
        submissionRate: 0,
        remainingRate: 100,
        incompleteUsers: students, // 모든 학생이 미완료
        incompleteMissionList: [] // 미완료 미션 리스트(비어있음)
      }));
      return { data: emptyStats, error: null };
    }
    
    // 미션 인스턴스 ID 목록
    const missionInstanceIds = missionInstances.map(mi => mi.id);
    
    // 미션 인스턴스 ID -> 미션 이름 매핑
    const missionInstanceToNameMap: Record<string, string> = {};
    missionInstances.forEach(mi => {
      missionInstanceToNameMap[mi.id] = missionNameMap[mi.mission_id] || '이름 없는 미션';
    });
    

    // 6. 주차별 미션 인스턴스 그룹화
    const missionInstancesByWeek: Record<string, any[]> = {};
    missionInstances.forEach(mi => {
      if (!missionInstancesByWeek[mi.journey_week_id]) {
        missionInstancesByWeek[mi.journey_week_id] = [];
      }
      missionInstancesByWeek[mi.journey_week_id].push({
        id: mi.id,
        mission_id: mi.mission_id,
        name: missionInstanceToNameMap[mi.id]
      });
    });

    // 7. 제출된 포스트 정보 가져오기
    let submittedPostsByWeek: Record<string, number> = {};
    // 미션 인스턴스별 제출한 사용자 목록
    let completedUsersByMission: Record<string, Set<string>> = {};
    
    if (missionInstanceIds.length > 0) {
      // 포스트 데이터 가져오기
      const { data: postsData, error: postsError } = await supabase
        .from("posts")
        .select("id, user_id, mission_instance_id")
        .in("mission_instance_id", missionInstanceIds)
        .not("mission_instance_id", "is", null);

      if (postsError) throw postsError;
      
      // 주차별로 제출된 포스트 수와 제출한 사용자 목록 계산
      if (postsData && postsData.length > 0) {
        // 미션 인스턴스별 주차 ID 매핑
        const missionToWeekMap: Record<string, string> = {};
        missionInstances.forEach(mi => {
          missionToWeekMap[mi.id] = mi.journey_week_id;
        });
        
        postsData.forEach(post => {
          if (post.mission_instance_id) {
            const weekId = missionToWeekMap[post.mission_instance_id];
            
            if (weekId) {
              // 포스트 수 집계
              submittedPostsByWeek[weekId] = (submittedPostsByWeek[weekId] || 0) + 1;
              
              // 미션별 제출한 사용자 목록 업데이트
              if (!completedUsersByMission[post.mission_instance_id]) {
                completedUsersByMission[post.mission_instance_id] = new Set();
              }
              if (post.user_id) {
                completedUsersByMission[post.mission_instance_id].add(post.user_id);
              }
            }
          }
        });
      }
      
    }

    // 8. 주차별 통계 계산
    const weeklyStats = weeks.map((week) => {
      // 해당 주차의 미션 인스턴스 목록
      const weekMissionInstances = missionInstancesByWeek[week.id] || [];
      
      // 전체 미션 수
      const totalMissions = weekMissionInstances.length;
      
      // 전체 가능한 제출 수: 전체 학생 수 x 미션 수
      const totalPossibleSubmissions = effectiveStudentCount * totalMissions;
      
      // 해당 주차에 제출된 포스트 수
      const submittedMissions = submittedPostsByWeek[week.id] || 0;
      
      // 미션별 미완료 학생 정보 계산
      const incompleteMissionList: {
        mission_name: string;
        user_name: string;
        user_id: string;
      }[] = [];
      
      // 각 미션별로 미완료 학생 계산
      weekMissionInstances.forEach(missionInstance => {
        const missionId = missionInstance.id;
        const missionName = missionInstance.name;
        
        // 해당 미션을 제출한 학생 ID 목록
        const completedUserIds = completedUsersByMission[missionId] 
          ? Array.from(completedUsersByMission[missionId])
          : [];
        
        // 해당 미션을 완료하지 않은 학생 계산
        const incompleteMissionStudents = students.filter(student => 
          !completedUserIds.includes(student.id)
        );
        
        // 결과 목록에 추가
        incompleteMissionStudents.forEach(student => {
          incompleteMissionList.push({
            mission_name: missionName,
            user_name: student.name,
            user_id: student.id
          });
        });
      });
      
      // 해당 주차의 미완료 학생 목록 (중복 제거)
      const incompleteUserIds = new Set(incompleteMissionList.map(item => item.user_id));
      const incompleteUsers = students.filter(student => incompleteUserIds.has(student.id));
      
      // 제출률 계산
      const submissionRate = totalPossibleSubmissions > 0
        ? Math.round((submittedMissions / totalPossibleSubmissions) * 100)
        : 0;

      return {
        id: week.id,
        name: week.name || `Week ${week.week_number}`,
        weekNumber: week.week_number || 0,
        totalMissions,
        totalStudents: effectiveStudentCount,
        totalPossibleSubmissions,
        submittedMissions,
        submissionRate,
        remainingRate: 100 - submissionRate,
        incompleteUsers, // 미션을 완료하지 않은 사용자 목록
        incompleteMissionList, // 미션별 미완료 정보 상세 목록
      };
    });

    // 주차 번호 기준 정렬 후 반환
    weeklyStats.sort((a, b) => a.weekNumber - b.weekNumber);

    return { data: weeklyStats, error: null };
  } catch (error) {
    console.error("주차별 통계 가져오기 오류:", error);
    return { data: null, error };
  }
}

export async function getUserPointsByJourneyId(journeyId: string | null) {
  if (!journeyId) {
    return { data: [], error: null };
  }

  try {
    const supabase = await createClient();

    // 1. 먼저 해당 저니의 주차 ID들을 찾기
    const { data: journeyWeeks, error: weeksError } = await supabase
      .from("journey_weeks")
      .select("id")
      .eq("journey_id", journeyId);

    if (weeksError) {
      console.error("[getUserPointsByJourneyId] 주차 조회 오류:", weeksError);
      return { data: [], error: weeksError };
    }

    if (!journeyWeeks || journeyWeeks.length === 0) {
      return { data: [], error: null };
    }

    // 주차 ID 목록
    const weekIds = journeyWeeks.map((week) => week.id);

    // 2. 해당 주차들의 미션 인스턴스 ID들을 찾기
    const { data: journeyMissionInstances, error: missionError } =
      await supabase
        .from("journey_mission_instances")
        .select("id, mission_id")
        .in("journey_week_id", weekIds);

    if (missionError) {
      console.error(
        "[getUserPointsByJourneyId] 미션 인스턴스 조회 오류:",
        missionError
      );
      return { data: [], error: missionError };
    }

    if (!journeyMissionInstances || journeyMissionInstances.length === 0) {
      return { data: [], error: null };
    }

    // 미션 인스턴스 ID 목록
    const missionInstanceIds = journeyMissionInstances.map(
      (instance) => instance.id
    );


    // 3. 해당 미션 인스턴스와 연결된 포인트 찾기
    const { data: userPoints, error } = await supabase
      .from("user_points")
      .select("*")
      .in("mission_instance_id", missionInstanceIds);

    if (error) {
      console.error("[getUserPointsByJourneyId] 포인트 조회 오류:", error);
      return { data: [], error };
    }


    return { data: userPoints, error: null };
  } catch (error) {
    console.error("[getUserPointsByJourneyId] 예외 발생:", error);
    return { data: [], error };
  }
}

