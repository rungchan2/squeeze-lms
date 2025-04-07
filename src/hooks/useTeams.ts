import useSWR, { mutate as globalMutate } from "swr";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { useCallback, useMemo } from "react";
import { toaster } from "@/components/ui/toaster";

// 팀 타입 정의
export interface Team {
  id: number;
  journey_id: number;
  name: string;
  description: string | null;
  created_at: string | null;
  updated_at: string | null;
}

// 팀 멤버 타입 정의
export interface TeamMember {
  id: number;
  team_id: number;
  user_id: number;
  is_leader: boolean | null;
  joined_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  profiles?: {
    id: number;
    first_name: string | null;
    last_name: string | null;
  };
}

// 팀 포스트 타입 정의 (PostCard 컴포넌트와 호환되도록 수정)
export interface TeamPost {
  id: number;
  team_id: number | null;
  is_team_submission: boolean | null;
  content: string | null;
  title: string | null;
  created_at: string | null;
  updated_at: string | null;
  user_id: number;
  mission_instance_id: number | null;
  score: number | null;
  view_count: number;
  is_hidden: boolean;
  profiles: {
    id: number;
    first_name: string | null;
    last_name: string | null;
    profile_image: string | null;
    organizations: {
      id: number;
      name: string;
    } | null;
  };
  // 추가적인 속성들 - 타입 검사를 위해
  mission_id?: number | null;
  journey_id?: number | null;
  team_points?: number | null;
  achieved?: boolean | null;
  points?: number | null;
}

// 팀 데이터 타입 정의
export interface TeamData {
  team: Team | null;
  members: TeamMember[];
}

// 모든 팀 목록 타입 정의
export interface AllTeamData {
  teams: Team[];
  teamMembers: Record<number, TeamMember[]>; // 팀 ID를 키로 하는 팀원 맵
}

/**
 * 팀 관련 기능을 제공하는 훅
 * @param journeyId 여정 ID
 * @returns 팀 데이터 및 팀 관련 함수들
 */
export function useTeams(journeyId?: number) {
  const { id: currentUserId } = useAuth();
  const supabase = createClient();

  // 캐시 키 생성 - 현재 사용자 ID가 없으면 null을 반환하여 요청을 방지
  const cacheKey = useMemo(() => {
    if (!currentUserId || !journeyId) {
      console.log('[useTeams] 캐시 키 생성 취소: currentUserId 또는 journeyId 없음', { currentUserId, journeyId });
      return null;
    }
    const key = `teams-${currentUserId}-${journeyId}`;
    console.log('[useTeams] 캐시 키 생성:', key);
    return key;
  }, [currentUserId, journeyId]);

  // 모든 팀 조회용 캐시 키
  const allTeamsCacheKey = useMemo(() => {
    if (!journeyId) {
      console.log('[useTeams] 모든 팀 캐시 키 생성 취소: journeyId 없음', { journeyId });
      return null;
    }
    const key = `all-teams-${journeyId}`;
    console.log('[useTeams] 모든 팀 캐시 키 생성:', key);
    return key;
  }, [journeyId]);

  // 팀 데이터 fetcher 함수
  const fetchTeamData = async (): Promise<TeamData> => {
    console.log(`[fetchTeamData] 호출 시작 - journeyId: ${journeyId}, userId: ${currentUserId}, 시간: ${new Date().toISOString()}`);
    
    if (!journeyId || !currentUserId) {
      console.log('[fetchTeamData] 필수 데이터 누락 (journeyId 또는 userId)');
      return { team: null, members: [] };
    }

    try {
      // 캐시 키 기반 강제 무효화 - 캐시 우회를 위해 캐시 타임스탬프 추가
      const timestamp = new Date().getTime();
      console.log(`[fetchTeamData] 캐시 타임스탬프: ${timestamp}`);
      
      console.log('[fetchTeamData] 팀 멤버 조회 시작');
      // 현재 사용자가 속한 팀 조회
      let teamMembersResponse;
      try {
        teamMembersResponse = await supabase
          .from("team_members")
          .select("team_id")
          .eq("user_id", currentUserId);
      } catch (err) {
        console.error('[fetchTeamData] 팀 멤버 조회 중 예외 발생:', err);
        throw new Error('팀 멤버 조회 중 네트워크 오류 발생');
      }
      
      const { data: teamMembers, error: teamMemberError } = teamMembersResponse;
      console.log('[fetchTeamData] 팀 멤버 조회 완료', { 
        teamMembers, 
        error: teamMemberError?.message, 
        status: teamMemberError?.code
      });

      if (teamMemberError) {
        console.log("팀 멤버 조회 중 오류:", teamMemberError);
        return { team: null, members: [] };
      }

      // 팀이 존재하는 경우
      if (teamMembers && teamMembers.length > 0) {
        const teamId = teamMembers[0].team_id;
        console.log(`[fetchTeamData] 팀 발견 - teamId: ${teamId}`);

        try {
          console.log(`[fetchTeamData] 팀 정보 조회 시작 - teamId: ${teamId}, journeyId: ${journeyId}`);
          // 팀 정보 조회 - single() 대신 maybeSingle() 사용
          const { data: team, error: teamError } = await supabase
            .from("teams")
            .select("*")
            .eq("id", teamId)
            .eq("journey_id", journeyId)
            .maybeSingle();
          console.log('[fetchTeamData] 팀 정보 조회 완료', { team, error: teamError?.message });

          // 팀이 없거나 에러가 발생한 경우 빈 데이터 반환
          if (teamError) {
            console.log("팀 조회 중 오류:", teamError);
            return { team: null, members: [] };
          }
          
          // 팀이 없는 경우
          if (!team) {
            console.log("해당 여정에 속한 팀을 찾을 수 없습니다.");
            return { team: null, members: [] };
          }

          console.log(`[fetchTeamData] 팀 멤버 목록 조회 시작 - teamId: ${teamId}`);
          // 팀 멤버 조회
          const { data: members, error: membersError } = await supabase
            .from("team_members")
            .select(`
              *,
              profiles:user_id (id, first_name, last_name)
            `)
            .eq("team_id", teamId);
          console.log('[fetchTeamData] 팀 멤버 목록 조회 완료', { membersCount: members?.length, error: membersError?.message });

          if (membersError) {
            console.log("팀 멤버 조회 중 오류:", membersError);
            return { team, members: [] };
          }

          const result = {
            team,
            members: members || [],
          };
          console.log('[fetchTeamData] 성공적으로 완료', { 
            hasTeam: !!result.team,
            membersCount: result.members.length
          });
          
          return result;
        } catch (error) {
          console.error("팀 데이터 조회 중 예외 발생:", error);
          return { team: null, members: [] };
        }
      }

      console.log('[fetchTeamData] 사용자가 속한 팀 없음');
      // 팀이 없는 경우 빈 데이터 반환
      return { team: null, members: [] };
    } catch (error) {
      // 에러가 발생해도 콘솔에 로그만 남기고 빈 데이터 반환
      console.error("팀 데이터 로딩 중 오류:", error);
      return { team: null, members: [] };
    }
  };

  // 사용자의 팀 및 멤버 데이터 가져오기
  const {
    data = { team: null, members: [] },
    error,
    mutate,
    isLoading,
    isValidating,
  } = useSWR<TeamData>(
    cacheKey,
    fetchTeamData,
    {
      revalidateOnMount: true,
      onSuccess: (data) => {
        console.log('[useTeams] 데이터 로드 성공:', {
          key: cacheKey,
          hasTeam: !!data.team,
          membersCount: data.members.length,
          timestamp: new Date().toISOString()
        });
      },
      onError: (err) => {
        console.error("[useTeams] 데이터 로드 중 오류:", err);
      },
      onDiscarded: () => {
        console.log('[useTeams] 요청이 중복으로 취소됨');
      }
    }
  );

  /**
   * 팀 생성 함수
   * @param name 팀 이름
   * @param description 팀 설명
   * @returns 생성된 팀 정보
   */
  const createTeam = useCallback(
    async (name?: string, description?: string): Promise<Team | null> => {
      if (!journeyId || !currentUserId) return null;

      try {
        // 이미 팀이 존재하는지 확인
        if (data?.team) {
          toaster.create({
            title: "이미 팀에 속해 있습니다.",
            description: "새 팀을 생성하기 전에 기존 팀에서 나가야 합니다.",
            type: "warning",
          });
          return data.team;
        }

        // 디폴트 팀 이름 설정
        const teamName = name || "새로운 팀";
        const teamDescription = description || "새로 생성된 팀입니다.";
        
        // 동일한 여정 내에 이미 같은 이름의 팀이 있는지 확인
        const { data: existingTeam, error: nameCheckError } = await supabase
          .from("teams")
          .select("*")
          .eq("journey_id", journeyId)
          .eq("name", teamName)
          .maybeSingle();
          
        if (nameCheckError) {
          console.log("팀 이름 중복 확인 중 오류:", nameCheckError);
        }
        
        if (existingTeam) {
          toaster.create({
            title: "중복된 팀 이름",
            description: "이미 사용 중인 팀 이름입니다. 다른 이름을 사용해주세요.",
            type: "warning",
          });
          return null;
        }

        // 현재 사용자가 속한 팀 조회
        const { data: teamMembers, error: teamMemberError } = await supabase
          .from("team_members")
          .select("team_id")
          .eq("user_id", currentUserId);

        if (teamMemberError) throw teamMemberError;
        
        // 이미 다른 팀에 속해 있는 경우
        if (teamMembers && teamMembers.length > 0) {
          // 해당 팀이 현재 여정에 속하는지 확인
          const teamId = teamMembers[0].team_id;
          
          const { data: existingTeam, error: teamError } = await supabase
            .from("teams")
            .select("*")
            .eq("id", teamId)
            .eq("journey_id", journeyId)
            .maybeSingle(); // single() 대신 maybeSingle() 사용
            
          if (teamError) {
            console.log("기존 팀 조회 중 오류:", teamError);
          }
          
          if (existingTeam) {
            toaster.create({
              title: "이미 팀에 속해 있습니다.",
              description: "새 팀을 생성하기 전에 기존 팀에서 나가야 합니다.",
              type: "warning",
            });
            
            // 캐시 업데이트
            mutate();
            
            return existingTeam;
          }
        }

        // 팀 생성
        const { data: newTeam, error: createTeamError } = await supabase
          .from("teams")
          .insert({
            journey_id: journeyId,
            name: teamName,
            description: teamDescription,
          })
          .select()
          .single();

        if (createTeamError) throw createTeamError;

        // 팀 멤버 추가 (현재 사용자)
        const { error: addMemberError } = await supabase
          .from("team_members")
          .insert({
            team_id: newTeam.id,
            user_id: currentUserId,
            is_leader: true,
          });

        if (addMemberError) throw addMemberError;

        // 캐시 업데이트
        mutate();

        toaster.create({
          title: "팀이 성공적으로 생성되었습니다.",
          type: "success",
        });

        return newTeam;
      } catch (error) {
        console.error("팀 생성 중 오류:", error);
        toaster.create({
          title: "팀 생성 중 오류가 발생했습니다.",
          type: "error",
        });
        return null;
      }
    },
    [journeyId, currentUserId, supabase, mutate, data]
  );

  /**
   * 팀 멤버 추가/제거 함수
   * @param newMembers 새로운 팀원 목록
   * @returns 성공 여부
   */
  const updateTeamMembers = useCallback(
    async (newMembers: any[]): Promise<boolean> => {
      if (!data?.team || !currentUserId) return false;

      try {
        const newMemberIds = newMembers.map((member) => member.value);
        const currentMemberIds = data.members.map((member) => member.user_id);

        // 추가된 멤버
        const addedMembers = newMemberIds.filter(
          (id) => !currentMemberIds.includes(id)
        );

        // 제거된 멤버
        const removedMembers = currentMemberIds.filter(
          (id) => !newMemberIds.includes(id)
        );

        // 현재 사용자가 자신을 제거하려고 하는 경우
        if (removedMembers.includes(currentUserId)) {
          toaster.create({
            title: "자신을 팀에서 제거할 수 없습니다",
            type: "error",
          });
          return false;
        }

        // 추가된 멤버 처리
        for (const memberId of addedMembers) {
          const { error } = await supabase.from("team_members").insert({
            team_id: data.team.id,
            user_id: memberId,
            is_leader: false,
          });

          if (error) throw error;
        }

        // 제거된 멤버 처리
        for (const memberId of removedMembers) {
          const { error } = await supabase
            .from("team_members")
            .delete()
            .eq("team_id", data.team.id)
            .eq("user_id", memberId);

          if (error) throw error;
        }

        // 캐시 업데이트
        mutate();

        toaster.create({
          title: "팀원이 업데이트되었습니다",
          type: "success",
        });

        return true;
      } catch (error) {
        console.error("팀원 업데이트 중 오류:", error);
        toaster.create({
          title: "팀원 업데이트 중 오류가 발생했습니다",
          type: "error",
        });
        return false;
      }
    },
    [data, currentUserId, supabase, mutate]
  );

  /**
   * 팀 정보 업데이트 함수
   * @param teamData 업데이트할 팀 데이터
   * @returns 성공 여부
   */
  const updateTeam = useCallback(
    async (teamData: Partial<Team>): Promise<boolean> => {
      if (!data?.team?.id) return false;

      try {
        const { error } = await supabase
          .from("teams")
          .update(teamData)
          .eq("id", data.team.id);

        if (error) throw error;

        // 캐시 업데이트
        mutate();

        toaster.create({
          title: "팀 정보가 업데이트되었습니다",
          type: "success",
        });

        return true;
      } catch (error) {
        console.error("팀 정보 업데이트 중 오류:", error);
        toaster.create({
          title: "팀 정보 업데이트 중 오류가 발생했습니다",
          type: "error",
        });
        return false;
      }
    },
    [data, supabase, mutate]
  );

  /**
   * 팀 삭제 함수 (리더만 가능)
   * @returns 성공 여부
   */
  const deleteTeam = useCallback(async (teamId: number): Promise<boolean> => {
    if (!teamId || !currentUserId) return false;

    try {
      
      // 팀 삭제
      const { error: deleteTeamError } = await supabase
        .from("teams")
        .delete()
        .eq("id", teamId);

      if (deleteTeamError) throw deleteTeamError;

      // 캐시 업데이트
      mutate({ team: null, members: [] });
      mutateAllTeams();
      toaster.create({
        title: "팀이 삭제되었습니다",
        type: "success",
      });

      return true;
    } catch (error) {
      console.error("팀 삭제 중 오류:", error);
      toaster.create({
        title: "팀 삭제 중 오류가 발생했습니다",
        type: "error",
      });
      return false;
    }
  }, [data, currentUserId, supabase, mutate]);

  /**
   * 팀 제출로 포스트 설정
   * @param postId 포스트 ID
   * @param missionPoints 미션 포인트
   * @returns 성공 여부
   */
  const markPostAsTeamSubmission = useCallback(
    async (postId: number, missionPoints: number = 0): Promise<boolean> => {
      if (!data?.team?.id) return false;

      try {
        // post 테이블 업데이트
        const { error: updatePostError } = await supabase
          .from("posts")
          .update({
            team_id: data.team.id,
            is_team_submission: true,
            team_points: missionPoints,
          })
          .eq("id", postId);

        if (updatePostError) throw updatePostError;

        // 캐시 업데이트
        mutate();

        return true;
      } catch (error) {
        console.error("팀 제출 처리 중 오류:", error);
        return false;
      }
    },
    [data, supabase, mutate]
  );

  /**
   * 여정의 모든 팀 목록 가져오기
   * @returns 모든 팀 목록 및 해당 팀원 목록
   */
  const getAllTeams = useCallback(async (): Promise<AllTeamData> => {
    const supabase = createClient();
    console.log(`[getAllTeams] 호출 시작 - journeyId: ${journeyId}, 시간: ${new Date().toISOString()}`);
    
    if (!journeyId) {
      console.log('[getAllTeams] journeyId 없음');
      return { teams: [], teamMembers: {} };
    }

    try {
      // 캐시 키 기반 강제 무효화 - 캐시 우회를 위해 캐시 타임스탬프 추가
      const timestamp = new Date().getTime();
      console.log(`[getAllTeams] 캐시 타임스탬프: ${timestamp}`);
      
      console.log('[getAllTeams] 모든 팀 목록 조회 시작');
      // 여정의 모든 팀 조회
      let teamsResponse;
      try {
        teamsResponse = await supabase
          .from("teams")
          .select("*")
          .eq("journey_id", journeyId)
          .order("name");

        console.log('[getAllTeams] 팀 목록 조회 완료', {
          teamsCount: teamsResponse?.data?.length,
          error: teamsResponse?.error?.message
        });
      } catch (err) {
        console.error('[getAllTeams] 팀 목록 조회 중 예외 발생:', err);
        throw new Error('팀 목록 조회 중 네트워크 오류 발생');
      }
      
      const { data: teams, error: teamsError } = teamsResponse;
      console.log('[getAllTeams] 모든 팀 목록 조회 완료', { 
        teamsCount: teams?.length, 
        error: teamsError?.message,
        status: teamsError?.code 
      });

      if (teamsError) {
        console.log("팀 목록 조회 중 오류:", teamsError);
        return { teams: [], teamMembers: {} };
      }

      // 팀이 없는 경우
      if (!teams || teams.length === 0) {
        console.log('[getAllTeams] 팀이 없거나 빈 배열');
        return { teams: [], teamMembers: {} };
      }

      // 모든 팀의 ID 목록
      const teamIds = teams.map(team => team.id);
      console.log(`[getAllTeams] 조회된 팀 ID 목록:`, teamIds);
      
      console.log('[getAllTeams] 모든 팀의 멤버 조회 시작');
      // 한 번의 쿼리로 모든 팀의 멤버 조회
      const { data: allMembers, error: membersError } = await supabase
        .from("team_members")
        .select(`
          *,
          profiles:user_id (id, first_name, last_name)
        `)
        .in("team_id", teamIds);
      console.log('[getAllTeams] 모든 팀의 멤버 조회 완료', { 
        allMembersCount: allMembers?.length, 
        error: membersError?.message 
      });

      if (membersError) {
        console.log("팀 멤버 조회 중 오류:", membersError);
        return { teams, teamMembers: {} };
      }

      // 팀별로 멤버 분류
      const teamMembers: Record<number, TeamMember[]> = {};
      
      // 팀 ID 별로 배열 초기화
      teamIds.forEach(id => {
        teamMembers[id] = [];
      });
      
      // 각 멤버를 해당 팀에 할당
      if (allMembers) {
        allMembers.forEach(member => {
          if (teamMembers[member.team_id]) {
            teamMembers[member.team_id].push(member);
          }
        });
      }

      const result = {
        teams,
        teamMembers,
      };
      
      console.log('[getAllTeams] 성공적으로 완료', {
        teamsCount: result.teams.length,
        teamMembersKeys: Object.keys(result.teamMembers).length
      });
      
      return result;
    } catch (error) {
      console.error("[getAllTeams] 모든 팀 목록 조회 중 오류:", error);
      return { teams: [], teamMembers: {} };
    }
  }, [journeyId, supabase]);
  
  // 여정의 모든 팀 가져오기
  const {
    data: allTeams = { teams: [], teamMembers: {} },
    error: allTeamsError,
    mutate: mutateAllTeams,
    isLoading: isLoadingAllTeams,
  } = useSWR<AllTeamData>(
    allTeamsCacheKey,
    getAllTeams,
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
      revalidateOnReconnect: false,
      dedupingInterval: 1000, // 1초로 줄임 (더 자주 갱신 허용)
      fallbackData: { teams: [], teamMembers: {} },
      suspense: false,
      revalidateOnMount: true,
      refreshInterval: 0, // 자동 새로고침 하지 않음
      shouldRetryOnError: true,
      errorRetryCount: 2,
      errorRetryInterval: 2000,
      onLoadingSlow: () => {
        console.log('[useTeams/allTeams] 로딩이 느려지고 있습니다 - 네트워크 상태를 확인하세요');
      },
      onErrorRetry: (error, key, config, revalidate, { retryCount }) => {
        console.log(`[useTeams/allTeams] 오류 발생 후 재시도 (${retryCount}/2): 키=${key}`, error);
        // 2번 이상 시도하면 더 이상 재시도하지 않음
        if (retryCount >= 2) return;
        // 2초 후에 재시도
        setTimeout(() => revalidate({ retryCount }), 2000);
      },
      onSuccess: (data) => {
        console.log('[useTeams/allTeams] 데이터 로드 성공:', {
          key: allTeamsCacheKey,
          teamsCount: data.teams.length,
          teamMembersKeys: Object.keys(data.teamMembers).length,
          timestamp: new Date().toISOString()
        });
      },
      onError: (err) => {
        console.error("[useTeams/allTeams] 데이터 로드 중 오류:", err);
      },
      onDiscarded: () => {
        console.log('[useTeams/allTeams] 요청이 중복으로 취소됨');
      }
    }
  );

  /**
   * 특정 팀에 참여하는 함수
   * @param teamId 참여할 팀 ID
   * @returns 성공 여부
   */
  const joinTeam = useCallback(async (teamId: number): Promise<boolean> => {
    if (!journeyId || !currentUserId) return false;

    try {
      // 이미 다른 팀에 속해 있는지 확인
      if (data?.team) {
        // 이미 같은 팀인 경우
        if (data.team.id === teamId) {
          toaster.create({
            title: "이미 해당 팀에 속해 있습니다.",
            type: "info",
          });
          return true;
        }

        // 다른 팀에서 나가기
        const { error: leaveError } = await supabase
          .from("team_members")
          .delete()
          .eq("team_id", data.team.id)
          .eq("user_id", currentUserId);

        if (leaveError) {
          console.log("기존 팀에서 나가기 중 오류:", leaveError);
          toaster.create({
            title: "기존 팀에서 나가기 실패",
            description: "새 팀에 참여하기 전에 기존 팀에서 나가야 합니다.",
            type: "error",
          });
          return false;
        }
      }

      // 새 팀에 참여
      const { error: joinError } = await supabase
        .from("team_members")
        .insert({
          team_id: teamId,
          user_id: currentUserId,
          is_leader: false, // 참여자는 리더가 아님
        });

      if (joinError) {
        console.log("팀 참여 중 오류:", joinError);
        toaster.create({
          title: "팀 참여 중 오류가 발생했습니다.",
          type: "error",
        });
        return false;
      }

      // 캐시 업데이트
      mutate();
      mutateAllTeams();

      toaster.create({
        title: "팀에 성공적으로 참여했습니다.",
        type: "success",
      });

      return true;
    } catch (error) {
      console.error("팀 참여 중 오류:", error);
      toaster.create({
        title: "팀 참여 중 오류가 발생했습니다.",
        type: "error",
      });
      return false;
    }
  }, [journeyId, currentUserId, data, supabase, mutate, mutateAllTeams]);

  /**
   * 팀 나가기 함수
   * @returns 성공 여부
   */
  const leaveTeam = useCallback(async (): Promise<boolean> => {
    if (!data?.team?.id || !currentUserId) return false;

    try {
      // 현재 사용자가 팀 리더인지 확인
      const isLeader = data.members.some(
        (member) => member.user_id === currentUserId && member.is_leader
      );

      if (isLeader) {
        toaster.create({
          title: "팀 리더는 팀을 나갈 수 없습니다",
          description: "팀을 나가기 전에 리더 권한을 다른 팀원에게 넘기거나 팀을 삭제해야 합니다.",
          type: "warning",
        });
        return false;
      }

      // 팀 멤버 삭제
      const { error } = await supabase
        .from("team_members")
        .delete()
        .eq("team_id", data.team.id)
        .eq("user_id", currentUserId);

      if (error) throw error;

      // 캐시 업데이트
      mutate({ team: null, members: [] });
      mutateAllTeams();

      toaster.create({
        title: "팀에서 나왔습니다",
        type: "success",
      });

      return true;
    } catch (error) {
      console.error("팀 나가기 중 오류:", error);
      toaster.create({
        title: "팀 나가기 중 오류가 발생했습니다",
        type: "error",
      });
      return false;
    }
  }, [data, currentUserId, supabase, mutate, mutateAllTeams]);

  return {
    teamData: data || { team: null, members: [] },
    allTeamsData: allTeams || { teams: [], teamMembers: {} },
    isLoading,
    isLoadingAllTeams,
    isValidating,
    error,
    allTeamsError,
    createTeam,
    updateTeamMembers,
    updateTeam,
    deleteTeam,
    markPostAsTeamSubmission,
    joinTeam,
    leaveTeam,
    mutate,
    mutateAllTeams,
  };
} 