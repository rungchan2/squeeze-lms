import { CreatePost, CreateJourney, UpdatePost } from "@/types";
import { createClient } from "@/utils/supabase/client";


export async function createPost(post: CreatePost) {
  const supabase = createClient();
  const insertData: CreatePost = {
    content: post.content,
    user_id: post.user_id,
    mission_instance_id: post.mission_instance_id,
    title: post.title,
    score: post.score,
  };
  const { data, error } = await supabase
    .from("posts")
    .insert(insertData)
    .select("id")
    .single();
  return { data, error, id: data?.id };
}

export async function updatePost(post: UpdatePost, id: number) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("posts")
    .update(post)
    .eq("id", id);
  return { data, error };
}

export async function createJourney(journey: CreateJourney) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("journeys").insert(journey);
  return { data, error };
}

export async function updateJourney(id: number, journey: CreateJourney) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("journeys")
    .update(journey)
    .eq("id", id);
  return { data, error };
}

export async function deleteJourney(id: number) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("journeys").delete().eq("id", id);
  return { data, error };
}

export async function getUserPointsByJourneyId(journeyId: number | null) {
  if (!journeyId) {
    console.log("[getUserPointsByJourneyId] journeyId가 제공되지 않음");
    return { data: [], error: null };
  }
  
  try {
    console.log("[getUserPointsByJourneyId] journeyId:", journeyId);
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
      console.log("[getUserPointsByJourneyId] 해당 여정에 주차가 없음:", journeyId);
      return { data: [], error: null };
    }
    
    // 주차 ID 목록
    const weekIds = journeyWeeks.map(week => week.id);
    
    // 2. 해당 주차들의 미션 인스턴스 ID들을 찾기
    const { data: journeyMissionInstances, error: missionError } = await supabase
      .from("journey_mission_instances")
      .select("id, mission_id")
      .in("journey_week_id", weekIds);
    
    if (missionError) {
      console.error("[getUserPointsByJourneyId] 미션 인스턴스 조회 오류:", missionError);
      return { data: [], error: missionError };
    }
    
    if (!journeyMissionInstances || journeyMissionInstances.length === 0) {
      return { data: [], error: null };
    }
    
    // 미션 인스턴스 ID 목록
    const missionInstanceIds = journeyMissionInstances.map(instance => instance.id);
    console.log("[getUserPointsByJourneyId] 미션 인스턴스 ID:", missionInstanceIds);
    
    // 3. 해당 미션 인스턴스와 연결된 포인트 찾기
    const { data: userPoints, error } = await supabase
      .from("user_points")
      .select("*")
      .in("mission_instance_id", missionInstanceIds);
    
    if (error) {
      console.error("[getUserPointsByJourneyId] 포인트 조회 오류:", error);
      return { data: [], error };
    }
    
    console.log("[getUserPointsByJourneyId] 필터링된 포인트 수:", userPoints?.length || 0);
    
    return { data: userPoints, error: null };
  } catch (error) {
    console.error("[getUserPointsByJourneyId] 예외 발생:", error);
    return { data: [], error };
  }
}


export async function deleteUserFromJourney(journeyId: number, userId: number) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_journeys")
    .delete()
    .eq("journey_id", journeyId)
    .eq("user_id", userId);
  return { data, error };
}


export async function getMission(id: number) {
  const supabase = createClient();
  const { data, error } = await supabase.from("missions").select("*").eq("id", id).single();
  return { data, error };
}

export async function getJourneyWeeklyStats(journeyId: number | string) {
  try {
    const supabase = createClient();
    
    const journeyIdNumber = typeof journeyId === 'string' ? parseInt(journeyId, 10) : journeyId;
    
    // 1. 해당 Journey의 모든 주차 가져오기
    const { data: weeks, error: weeksError } = await supabase
      .from("journey_weeks")
      .select("id, name, week_number")
      .eq("journey_id", journeyIdNumber)
      .order("week_number");

    if (weeksError) throw weeksError;
    if (!weeks || weeks.length === 0) {
      return { data: [], error: null };
    }
    
    
    // 주차 ID 목록
    const weekIds = weeks.map(week => week.id);

    // 2. 각 주차별 미션 인스턴스 가져오기
    const { data: missionInstances, error: missionError } = await supabase
      .from("journey_mission_instances")
      .select(`
        id, 
        journey_week_id,
        mission_id
      `)
      .in("journey_week_id", weekIds);

    if (missionError) throw missionError;

    // 3. posts 테이블에서 모든 제출 데이터 가져오기
    const { data: posts, error: postsError } = await supabase
      .from("posts")
      .select(`
        id,
        user_id,
        mission_instance_id
      `)
      .not("mission_instance_id", "is", null);

    if (postsError) throw postsError;

    // 4. 각 미션 인스턴스에 대한 사용자 포인트 데이터 가져오기
    const { data: userPoints, error: pointsError } = await supabase
      .from("user_points")
      .select(`
        id,
        profile_id,
        mission_instance_id,
        total_points
      `)
      .not("mission_instance_id", "is", null);

    if (pointsError) throw pointsError;

    // 5. 해당 Journey의 모든 참여 학생 수 계산
    const { data: journeyParticipants, error: participantsError } = await supabase
      .from("user_journeys")
      .select("user_id, role_in_journey")
      .eq("journey_id", journeyIdNumber)
      .eq("role_in_journey", "student");

    if (participantsError) throw participantsError;
    const totalStudents = journeyParticipants?.length || 0;

    // 학생이 없으면 계산할 수 없으므로, 최소한 1명으로 설정
    const effectiveStudentCount = Math.max(totalStudents, 1);
    
    // 제출된 미션 인스턴스 ID 목록 (posts 테이블 기준)
    const submittedMissionInstanceIds = new Set(
      posts?.filter(post => post.mission_instance_id !== null)
           .map(post => post.mission_instance_id) || []
    );
    
    // 포인트가 있는 미션 인스턴스 ID 목록 (user_points 테이블 기준)
    const pointsMissionInstanceIds = new Set(
      userPoints?.filter(point => point.mission_instance_id !== null)
              .map(point => point.mission_instance_id) || []
    );
    
    // 두 소스를 합쳐서 모든 완료된 미션 인스턴스 ID 모음
    const completedMissionInstanceIds = new Set([
      ...Array.from(submittedMissionInstanceIds),
      ...Array.from(pointsMissionInstanceIds)
    ]);

    // 6. 주차별 통계 계산
    const weeklyStats = weeks.map((week) => {
      // 해당 주차의 미션 인스턴스 ID 목록
      const weekMissionIds = missionInstances
        ?.filter((mi) => mi.journey_week_id === week.id)
        .map((mi) => mi.id) || [];
      
      // 전체 미션 수
      const totalMissions = weekMissionIds.length;
      
      // 전체 가능한 제출 수: 전체 학생 수 x 미션 수
      const totalPossibleSubmissions = effectiveStudentCount * totalMissions;
      
      // 해당 주차의 완료된 미션 수 (두 소스 결합)
      const submittedMissions = weekMissionIds
        .filter(id => completedMissionInstanceIds.has(id))
        .length;
            
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

export async function getMissionTypes() {
  const supabase = createClient();
  const { data, error } = await supabase.rpc(
    "get_distinct_mission_types" as any
  );
  return { data, error };
}


