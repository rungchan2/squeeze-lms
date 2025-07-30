import { useCallback, useMemo } from 'react';
import { 
  useSupabaseQuery, 
  createCacheKey,
  createMutation,
  getSupabaseClient 
} from '../base/useSupabaseQuery';
import { useSupabaseAuth } from '../useSupabaseAuth';
import { Team, TeamMember } from '@/types/teams';
import { toaster } from '@/components/ui/toaster';

interface TeamData {
  team: Team | null;
  members: TeamMember[];
}

interface AllTeamsData {
  teams: Team[];
  teamMembers: Record<string, TeamMember[]>;
}

// 현재 사용자의 팀 정보 조회
export function useCurrentUserTeamRefactored(journeyId: string | null) {
  const { id: currentUserId } = useSupabaseAuth();
  
  const cacheKey = useMemo(() => {
    if (!currentUserId || !journeyId) return null;
    return createCacheKey('user-team', { userId: currentUserId, journeyId });
  }, [currentUserId, journeyId]);

  const result = useSupabaseQuery<TeamData>(
    cacheKey,
    async (supabase) => {
      if (!currentUserId || !journeyId) {
        return { team: null, members: [] };
      }

      // 현재 사용자의 팀 조회
      const { data: teamMember, error: memberError } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', currentUserId)
        .eq('journey_id', journeyId)
        .maybeSingle();

      if (memberError) throw memberError;
      if (!teamMember) return { team: null, members: [] };

      // 팀 정보 조회
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .select('*')
        .eq('id', teamMember.team_id)
        .single();

      if (teamError) throw teamError;

      // 팀 멤버 조회
      const { data: members, error: membersError } = await supabase
        .from('team_members')
        .select(`
          *,
          profiles (
            id,
            email,
            first_name,
            last_name,
            profile_image
          )
        `)
        .eq('team_id', teamMember.team_id);

      if (membersError) throw membersError;

      return {
        team: team as Team,
        members: (members || []) as TeamMember[],
      };
    }
  );

  return {
    teamData: result.data || { team: null, members: [] },
    isLoading: result.isLoading,
    error: result.error,
    mutate: result.refetch,
  };
}

// 여정의 모든 팀 조회
export function useAllTeamsRefactored(journeyId: string | null) {
  const cacheKey = journeyId ? createCacheKey('all-teams', { journeyId }) : null;

  const result = useSupabaseQuery<AllTeamsData>(
    cacheKey,
    async (supabase) => {
      if (!journeyId) return { teams: [], teamMembers: {} };

      // 모든 팀 조회
      const { data: teams, error: teamsError } = await supabase
        .from('teams')
        .select('*')
        .eq('journey_id', journeyId)
        .order('created_at', { ascending: true });

      if (teamsError) throw teamsError;
      if (!teams || teams.length === 0) {
        return { teams: [], teamMembers: {} };
      }

      // 모든 팀의 멤버 조회
      const teamIds = teams.map(team => team.id);
      const { data: allMembers, error: membersError } = await supabase
        .from('team_members')
        .select(`
          *,
          profiles (
            id,
            email,
            first_name,
            last_name,
            profile_image
          )
        `)
        .in('team_id', teamIds);

      if (membersError) throw membersError;

      // 팀별로 멤버 분류
      const teamMembers: Record<string, TeamMember[]> = {};
      teamIds.forEach(id => {
        teamMembers[id] = [];
      });

      (allMembers || []).forEach(member => {
        if (teamMembers[member.team_id]) {
          teamMembers[member.team_id].push(member as TeamMember);
        }
      });

      return {
        teams: teams as Team[],
        teamMembers,
      };
    }
  );

  return {
    allTeamsData: result.data || { teams: [], teamMembers: {} },
    isLoadingAllTeams: result.isLoading,
    allTeamsError: result.error,
    mutateAllTeams: result.refetch,
  };
}

// 팀 관련 작업 훅
export function useTeamActionsRefactored(journeyId: string | null) {
  const { id: currentUserId } = useSupabaseAuth();
  const { teamData, mutate } = useCurrentUserTeamRefactored(journeyId);
  const { mutateAllTeams } = useAllTeamsRefactored(journeyId);

  // 팀 생성
  const createTeam = createMutation<Team, { name: string; description?: string }>(
    async (supabase, { name, description }) => {
      if (!journeyId || !currentUserId) {
        throw new Error('Journey ID and user ID are required');
      }

      // 이미 팀이 있는지 확인
      if (teamData.team) {
        throw new Error('이미 팀에 속해 있습니다');
      }

      // 팀 이름 중복 확인
      const { data: existingTeam } = await supabase
        .from('teams')
        .select('id')
        .eq('journey_id', journeyId)
        .eq('name', name)
        .maybeSingle();

      if (existingTeam) {
        throw new Error('이미 사용 중인 팀 이름입니다');
      }

      // 팀 생성
      const { data: newTeam, error: teamError } = await supabase
        .from('teams')
        .insert({
          journey_id: journeyId,
          name,
          description: description || '새로 생성된 팀입니다.',
        })
        .select()
        .single();

      if (teamError) throw teamError;

      // 팀 멤버 추가
      const { error: memberError } = await supabase
        .from('team_members')
        .insert({
          team_id: newTeam.id,
          user_id: currentUserId,
          journey_id: journeyId,
          is_leader: true,
        });

      if (memberError) throw memberError;

      return newTeam as Team;
    },
    {
      onSuccess: () => {
        toaster.create({
          title: '팀이 성공적으로 생성되었습니다.',
          type: 'success',
        });
        mutate();
        mutateAllTeams();
      },
      onError: (error) => {
        toaster.create({
          title: error.message || '팀 생성 중 오류가 발생했습니다.',
          type: 'error',
        });
      },
    }
  );

  // 팀 참여
  const joinTeam = createMutation<boolean, string>(
    async (supabase, teamId) => {
      if (!journeyId || !currentUserId) {
        throw new Error('Journey ID and user ID are required');
      }

      // 기존 팀에서 나가기
      if (teamData.team && teamData.team.id !== teamId) {
        await supabase
          .from('team_members')
          .delete()
          .eq('user_id', currentUserId)
          .eq('team_id', teamData.team.id);
      }

      // 새 팀 참여
      const { error } = await supabase
        .from('team_members')
        .insert({
          team_id: teamId,
          user_id: currentUserId,
          journey_id: journeyId,
          is_leader: false,
        });

      if (error) throw error;
      return true;
    },
    {
      onSuccess: () => {
        toaster.create({
          title: '팀에 성공적으로 참여했습니다.',
          type: 'success',
        });
        mutate();
        mutateAllTeams();
      },
      onError: (error) => {
        toaster.create({
          title: error.message || '팀 참여 중 오류가 발생했습니다.',
          type: 'error',
        });
      },
    }
  );

  // 팀 나가기
  const leaveTeam = createMutation<boolean, void>(
    async (supabase) => {
      if (!teamData.team || !currentUserId) {
        throw new Error('팀 정보가 없습니다');
      }

      // 리더인지 확인
      const isLeader = teamData.members.some(
        member => member.user_id === currentUserId && member.is_leader
      );

      if (isLeader && teamData.members.length > 1) {
        throw new Error('팀 리더는 팀을 나가기 전에 리더 권한을 다른 멤버에게 양도해야 합니다');
      }

      // 팀 나가기
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('user_id', currentUserId)
        .eq('team_id', teamData.team.id);

      if (error) throw error;

      // 마지막 멤버인 경우 팀 삭제
      if (teamData.members.length === 1) {
        await supabase
          .from('teams')
          .delete()
          .eq('id', teamData.team.id);
      }

      return true;
    },
    {
      onSuccess: () => {
        toaster.create({
          title: '팀에서 나왔습니다.',
          type: 'success',
        });
        mutate();
        mutateAllTeams();
      },
      onError: (error) => {
        toaster.create({
          title: error.message || '팀 나가기 중 오류가 발생했습니다.',
          type: 'error',
        });
      },
    }
  );

  // 팀 정보 업데이트
  const updateTeam = createMutation<Team, Partial<Team>>(
    async (supabase, updates) => {
      if (!teamData.team) {
        throw new Error('팀 정보가 없습니다');
      }

      const { data, error } = await supabase
        .from('teams')
        .update(updates)
        .eq('id', teamData.team.id)
        .select()
        .single();

      if (error) throw error;
      return data as Team;
    },
    {
      onSuccess: () => {
        toaster.create({
          title: '팀 정보가 업데이트되었습니다.',
          type: 'success',
        });
        mutate();
        mutateAllTeams();
      },
      onError: (error) => {
        toaster.create({
          title: error.message || '팀 정보 업데이트 중 오류가 발생했습니다.',
          type: 'error',
        });
      },
    }
  );

  // 팀원 관리
  const updateTeamMembers = useCallback(
    async (newMemberIds: string[]) => {
      if (!teamData.team || !currentUserId) return false;

      const supabase = getSupabaseClient();
      const currentMemberIds = teamData.members.map(m => m.user_id);
      
      const toAdd = newMemberIds.filter(id => !currentMemberIds.includes(id));
      const toRemove = currentMemberIds.filter(id => !newMemberIds.includes(id));

      // 자신을 제거하려는 경우 방지
      if (toRemove.includes(currentUserId)) {
        toaster.create({
          title: '자신을 팀에서 제거할 수 없습니다',
          type: 'error',
        });
        return false;
      }

      try {
        // 멤버 추가
        if (toAdd.length > 0) {
          const { error } = await supabase
            .from('team_members')
            .insert(
              toAdd.map(userId => ({
                team_id: teamData.team!.id,
                user_id: userId,
                journey_id: journeyId!,
                is_leader: false,
              }))
            );
          if (error) throw error;
        }

        // 멤버 제거
        if (toRemove.length > 0) {
          const { error } = await supabase
            .from('team_members')
            .delete()
            .eq('team_id', teamData.team.id)
            .in('user_id', toRemove);
          if (error) throw error;
        }

        toaster.create({
          title: '팀원이 업데이트되었습니다',
          type: 'success',
        });
        
        mutate();
        mutateAllTeams();
        return true;
      } catch (error: any) {
        toaster.create({
          title: error.message || '팀원 업데이트 중 오류가 발생했습니다',
          type: 'error',
        });
        return false;
      }
    },
    [teamData, currentUserId, journeyId, mutate, mutateAllTeams]
  );

  return {
    createTeam,
    joinTeam,
    leaveTeam,
    updateTeam,
    updateTeamMembers,
  };
}