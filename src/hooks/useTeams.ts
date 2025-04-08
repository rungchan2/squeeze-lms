import useSWR, { mutate as globalMutate } from "swr";
import { useAuth } from "@/components/AuthProvider";
import { useCallback, useMemo } from "react";
import { toaster } from "@/components/ui/toaster";
import { Team, TeamMember, TeamData, AllTeamData } from "@/types/teams";
import { team } from "@/utils/data/team";
import { posts } from "@/utils/data/posts";

/**
 * 팀 관련 기능을 제공하는 훅
 * @param journeyId 여정 ID
 * @returns 팀 데이터 및 팀 관련 함수들
 */
export function useTeams(journeyId?: number) {
  const { id: currentUserId } = useAuth();

  // 캐시 키 생성 - 현재 사용자 ID가 없으면 null을 반환하여 요청을 방지
  const cacheKey = useMemo(() => {
    if (!currentUserId || !journeyId) {
      console.log(
        "[useTeams] 캐시 키 생성 취소: currentUserId 또는 journeyId 없음",
        { currentUserId, journeyId }
      );
      return null;
    }
    const key = `teams-${currentUserId}-${journeyId}`;
    console.log("[useTeams] 캐시 키 생성:", key);
    return key;
  }, [currentUserId, journeyId]);

  // 모든 팀 조회용 캐시 키
  const allTeamsCacheKey = useMemo(() => {
    if (!journeyId) {
      console.log("[useTeams] 모든 팀 캐시 키 생성 취소: journeyId 없음", {
        journeyId,
      });
      return null;
    }
    const key = `all-teams-${journeyId}`;
    console.log("[useTeams] 모든 팀 캐시 키 생성:", key);
    return key;
  }, [journeyId]);

  // 팀 데이터 fetcher 함수
  const fetchTeamData = async (): Promise<TeamData> => {
    console.log("[useTeams] fetchTeamData 실행: journeyId =", journeyId);
    if (!currentUserId || !journeyId) return { team: null, members: [] };

    try {
      const teamResponse = await team.getCurrentUserTeam(currentUserId, journeyId);
      // 팀이 존재하는 경우
      if (teamResponse) {
        const teamId = teamResponse.team_id;
        const teamData = await team.getTeam(teamId);

        try {
          const teamMembers = await team.getTeamMembers([teamId]);

          const result = {
            team: teamData,
            members: teamMembers || [],
          };
          return result;
        } catch (error) {
          console.error("팀 데이터 조회 중 예외 발생:", error);
          return { team: null, members: [] };
        }
      }

      return { team: null, members: [] };
    } catch (error) {
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
  } = useSWR<TeamData>(cacheKey, fetchTeamData, {
    revalidateOnMount: true,
    onSuccess: (data) => {
      console.log("[useTeams] 데이터 로드 성공:", {
        key: cacheKey,
        hasTeam: !!data.team,
        membersCount: data.members.length,
        timestamp: new Date().toISOString(),
      });
    },
    onError: (err) => {
      console.error("[useTeams] 데이터 로드 중 오류:", err);
    },
  });

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
        const existingTeam = await team.getTeamByName(journeyId, teamName);

        if (existingTeam) {
          toaster.create({
            title: "중복된 팀 이름",
            description:
              "이미 사용 중인 팀 이름입니다. 다른 이름을 사용해주세요.",
            type: "warning",
          });
          return null;
        }

        // 현재 사용자가 속한 팀 조회
        const teamMembers = await team.getTeamMembers([currentUserId]);

        // 이미 다른 팀에 속해 있는 경우
        if (teamMembers && teamMembers.length > 0) {
          // 해당 팀이 현재 여정에 속하는지 확인
          const teamId = teamMembers[0].team_id;

          const existingTeam = await team.getTeam(teamId);

          if (existingTeam) {
            toaster.create({
              title: "이미 팀에 속해 있습니다.",
              description: "새 팀을 생성하기 전에 기존 팀에서 나가야 합니다.",
              type: "warning",
            });
            mutate();

            return existingTeam;
          }
        }

        // 팀 생성
        const newTeam = await team.createTeam({
          journey_id: journeyId,
          name: teamName,
          description: teamDescription,
        });

        // 팀 멤버 추가 (현재 사용자)
        const addMemberError = await team.addTeamMember(
          newTeam.id,
          currentUserId
        );
        if (addMemberError) {
          throw addMemberError;
        } else {
          toaster.create({
            title: "팀이 성공적으로 생성되었습니다.",
            type: "success",
          });
        }

        mutate();

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
    [journeyId, currentUserId, mutate, data]
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

        // 첫 번째 mutate 호출 (즉시 UI 업데이트)
        mutate(
          async (prevData: TeamData | undefined) => {
            if (!prevData) return { team: null, members: [] };
            
            const updatedMembers = prevData.members.filter(
              member => !removedMembers.includes(member.user_id)
            );
            
            return {
              ...prevData,
              members: updatedMembers,
            };
          },
          { revalidate: false }
        );

        // 추가된 멤버 처리
        for (const userId of addedMembers) {
          const isCurrentUser = userId === currentUserId;

          if (isCurrentUser) {
            // 현재 사용자가 자신을 팀에 추가하는 경우, joinTeam 사용
            const joinSuccess = await joinTeam(data.team.id);
            if (!joinSuccess) return false;
          } else {
            // 다른 사용자를 추가하는 경우
            try {
              const addMemberError = await team.addTeamMember(data.team.id, userId);
              if (addMemberError) {
                console.error("팀원 추가 중 오류:", addMemberError);
                return false;
              }
            } catch (error) {
              console.error(`사용자(${userId})를 팀(${data.team.id})에 추가하는 중 예외 발생:`, error);
              return false;
            }
          }
        }

        // 멤버 제거 (현재 사용자가 자신을 제거하는 경우 제외 - 이미 leaveTeam으로 처리됨)
        for (const userId of removedMembers) {
          if (userId === currentUserId && data.team.id === currentUserId) continue;

          try {
            const removeMemberError = await team.removeTeamMember(data.team.id, userId);
            if (removeMemberError) {
              console.error("팀원 제거 중 오류:", removeMemberError);
              return false;
            }
          } catch (error) {
            console.error(`사용자(${userId})를 팀(${data.team.id})에서 제거하는 중 예외 발생:`, error);
            return false;
          }
        }
        
        // 두 번째 mutate 호출 (서버에서 최신 데이터 가져오기)
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
    [data, currentUserId, mutate]
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
        await team.updateTeam(data.team.id, teamData);

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
    [data, mutate]
  );

  /**
   * 팀 삭제 함수 (리더만 가능)
   * @returns 성공 여부
   */
  const deleteTeam = useCallback(
    async (teamId: number): Promise<boolean> => {
      if (!teamId || !currentUserId) return false;

      try {
        // 팀 삭제
        await team.deleteTeam(teamId);

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
    },
    [data, currentUserId, mutate]
  );

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
        await posts.updateTeamPost(postId, {
          team_id: data.team.id,
          is_team_submission: true,
          team_points: missionPoints,
        });

        // 캐시 업데이트
        mutate();

        return true;
      } catch (error) {
        console.error("팀 제출 처리 중 오류:", error);
        return false;
      }
    },
    [data, mutate]
  );

  /**
   * 여정의 모든 팀 목록 가져오기
   * @returns 모든 팀 목록 및 해당 팀원 목록
   */
  const getAllTeams = useCallback(async (): Promise<AllTeamData> => {
    if (!journeyId) {
      return { teams: [], teamMembers: {} };
    }

    try {
      // 여정의 모든 팀 조회
      let teamsResponse;
      teamsResponse = await team.getAllTeams(journeyId);

      if (!teamsResponse || teamsResponse.length === 0) {
        console.log("[getAllTeams] 팀이 없거나 빈 배열");
        return { teams: [], teamMembers: {} };
      }

      const teamIds = teamsResponse.map((team) => team.id);
      const allMembers = await team.getTeamMembers(teamIds);

      console.log("[getAllTeams] 모든 팀의 멤버 조회 완료", {
        allMembersCount: allMembers?.length,
      });

      // 팀별로 멤버 분류
      const teamMembers: Record<number, TeamMember[]> = {};

      // 팀 ID 별로 배열 초기화
      teamIds.forEach((id) => {
        teamMembers[id] = [];
      });

      // 각 멤버를 해당 팀에 할당
      if (allMembers) {
        allMembers.forEach((member) => {
          if (teamMembers[member.team_id]) {
            teamMembers[member.team_id].push(member);
          }
        });
      }

      const result = {
        teams: teamsResponse,
        teamMembers,
      };

      console.log("[getAllTeams] 성공적으로 완료", {
        teamsCount: result.teams.length,
        teamMembersKeys: Object.keys(result.teamMembers).length,
      });

      return result;
    } catch (error) {
      console.error("[getAllTeams] 모든 팀 목록 조회 중 오류:", error);
      return { teams: [], teamMembers: {} };
    }
  }, [journeyId]);

  // 여정의 모든 팀 가져오기
  const {
    data: allTeams = { teams: [], teamMembers: {} },
    error: allTeamsError,
    mutate: mutateAllTeams,
    isLoading: isLoadingAllTeams,
  } = useSWR<AllTeamData>(allTeamsCacheKey, getAllTeams, {
    revalidateOnFocus: false,
    revalidateIfStale: false,
    revalidateOnReconnect: false,
    fallbackData: { teams: [], teamMembers: {} },
    suspense: false,
    revalidateOnMount: true,
    refreshInterval: 0, // 자동 새로고침 하지 않음
    shouldRetryOnError: true,
    errorRetryCount: 2,
    errorRetryInterval: 2000,
    onLoadingSlow: () => {
      console.log(
        "[useTeams/allTeams] 로딩이 느려지고 있습니다 - 네트워크 상태를 확인하세요"
      );
    },
    onErrorRetry: (error, key, config, revalidate, { retryCount }) => {
      console.log(
        `[useTeams/allTeams] 오류 발생 후 재시도 (${retryCount}/2): 키=${key}`,
        error
      );
    },
    onSuccess: (data) => {
      console.log("[useTeams/allTeams] 데이터 로드 성공:", {
        key: allTeamsCacheKey,
        teamsCount: data.teams.length,
        teamMembersKeys: Object.keys(data.teamMembers).length,
        timestamp: new Date().toISOString(),
      });
    },
    onError: (err) => {
      console.error("[useTeams/allTeams] 데이터 로드 중 오류:", err);
    },
    onDiscarded: () => {
      console.log("[useTeams/allTeams] 요청이 중복으로 취소됨");
    },
  });

  /**
   * 특정 팀에 참여하는 함수
   * @param teamId 참여할 팀 ID
   * @returns 성공 여부
   */
  const joinTeam = useCallback(
    async (teamId: number): Promise<boolean> => {
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
          await team.removeTeamMember(data.team.id, currentUserId);
        }

        // 새 팀에 참여
        await team.addTeamMember(teamId, currentUserId);

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
    },
    [journeyId, currentUserId, data, mutate, mutateAllTeams]
  );

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
          description:
            "팀을 나가기 전에 리더 권한을 다른 팀원에게 넘기거나 팀을 삭제해야 합니다.",
          type: "warning",
        });
        return false;
      }

      // 팀 멤버 삭제
      await team.removeTeamMember(data.team.id, currentUserId);

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
  }, [data, currentUserId, mutate, mutateAllTeams]);

  /**
   * 사용자가 이미 팀에 속해 있는지 확인하는 함수
   * @param userId 확인할 사용자 ID
   * @returns {Promise<number | null>} 사용자가 속한 팀 ID 또는 null
   */
  const checkUserTeam = useCallback(
    async (userId: number): Promise<number | null> => {
      if (!journeyId) return null;
      
      try {
        // 사용자의 팀 조회
        const userTeam = await team.getCurrentUserTeam(userId, journeyId);
        return userTeam ? userTeam.team_id : null;
      } catch (error) {
        console.error("사용자의 팀 확인 중 오류:", error);
        return null;
      }
    }, 
    [journeyId]
  );
  
  /**
   * 팀에 속한 모든 사용자 ID 목록 조회
   * @returns {Promise<Record<number, number[]>>} 각 팀 ID를 키로 하는 사용자 ID 배열
   */
  const getAllTeamUserIds = useCallback(
    async (): Promise<Record<number, number[]>> => {
      if (!journeyId) return {};
      
      try {
        const teamsData = await getAllTeams();
        const result: Record<number, number[]> = {};
        
        Object.entries(teamsData.teamMembers).forEach(([teamId, members]) => {
          result[Number(teamId)] = members.map(member => member.user_id);
        });
        
        return result;
      } catch (error) {
        console.error("모든 팀 사용자 ID 조회 중 오류:", error);
        return {};
      }
    },
    [journeyId, getAllTeams]
  );
  
  /**
   * 특정 여정 내에서 이미 팀에 속한 사용자 ID 목록 조회
   * @returns {Promise<number[]>} 이미 팀에 속한 사용자 ID 배열
   */
  const getUsersWithTeam = useCallback(
    async (): Promise<number[]> => {
      if (!journeyId) return [];
      
      try {
        const teamsData = await getAllTeams();
        const usersWithTeam = new Set<number>();
        
        // 모든 팀 멤버를 순회하며 사용자 ID 수집
        Object.values(teamsData.teamMembers).forEach(members => {
          members.forEach(member => {
            usersWithTeam.add(member.user_id);
          });
        });
        
        return Array.from(usersWithTeam);
      } catch (error) {
        console.error("팀에 속한 사용자 ID 조회 중 오류:", error);
        return [];
      }
    },
    [journeyId, getAllTeams]
  );

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
    checkUserTeam,
    getAllTeamUserIds,
    getUsersWithTeam
  };
}
