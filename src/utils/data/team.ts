import { Team, TeamMember, TeamPost, TeamData, AllTeamData } from "@/types";
import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

export const team = {
  getAllTeams: async (journeyId: number): Promise<Team[]> => {
    const { data, error } = await supabase
      .from("teams")
      .select("*")
      .eq("journey_id", journeyId);

    if (error) {
      throw error;
    }

    return data;
  },
  getTeamData: async (journeyId: number): Promise<any> => {
    const { data, error } = await supabase
      .from("teams")
      .select("*")
      .eq("journey_id", journeyId);

    if (error) {
      throw error;
    }

    return data;
  },
  getCurrentUserTeam: async (
    currentUserId: number,
    journeyId: number
  ): Promise<{
    team_id: number;
  } | null> => {
    try {
      // 먼저 single() 없이 조회해서 여러 결과가 있는지 확인
      const { data: initialData, error: initialError } = await supabase
        .from("team_members")
        .select("team_id, teams!inner(journey_id)")
        .eq("user_id", currentUserId)
        .eq("teams.journey_id", journeyId);
      
      // 결과 확인 로그
      console.log("getCurrentUserTeam 조회 결과:", { 
        hasResults: !!initialData && initialData.length > 0,
        resultCount: initialData?.length || 0,
      });
      
      // 결과가 없는 경우
      if (initialError || !initialData || initialData.length === 0) {
        console.log("getCurrentUserTeam: 팀이 없습니다.", initialError);
        return null;
      }
      
      // 여러 결과가 있는 경우 첫 번째 결과 반환
      if (initialData.length > 1) {
        console.log("getCurrentUserTeam: 여러 팀이 존재합니다. 첫 번째 팀을 반환합니다.");
        return { team_id: initialData[0].team_id };
      }
      
      // 단일 결과인 경우
      return { team_id: initialData[0].team_id };
      
    } catch (error) {
      console.error("getCurrentUserTeam 예외 발생:", error);
      return null;
    }
  },
  getTeam: async (teamId: number): Promise<Team | null> => {
    const { data, error } = await supabase
      .from("teams")
      .select("*")
      .eq("id", teamId)
      .single();

    if (error) {
      console.log(error);
      throw error;
    }

    return data;
  },
  getTeamMembers: async (teamIds: number[]): Promise<TeamMember[]> => {
    const { data, error } = await supabase
      .from("team_members")
      .select("*, profiles:user_id(id, first_name, last_name)")
      .in("team_id", teamIds);

    if (error) {
      throw error;
    }

    return data;
  },
  getTeamByName: async (
    journeyId: number,
    teamName: string
  ): Promise<Team | null> => {
    const { data, error } = await supabase
      .from("teams")
      .select("*")
      .eq("journey_id", journeyId)
      .eq("name", teamName)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data;
  },
  deleteTeam: async (teamId: number): Promise<void> => {
    const { error } = await supabase.from("teams").delete().eq("id", teamId);

    if (error) {
      throw error;
    }
  },
  createTeam: async (
    team: Omit<Team, "id" | "created_at" | "updated_at">
  ): Promise<Team> => {
    const { data, error } = await supabase
      .from("teams")
      .insert(team)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  },
  addTeamMember: async (teamId: number, userId: number): Promise<Error | null> => {
    try {
      // 먼저 이미 존재하는지 확인
      const { data: existingMember } = await supabase
        .from("team_members")
        .select("*")
        .eq("team_id", teamId)
        .eq("user_id", userId)
        .maybeSingle();
      
      // 이미 존재하는 경우 성공으로 처리
      if (existingMember) {
        console.log(`팀원이 이미 존재합니다. teamId=${teamId}, userId=${userId}`);
        return null;
      }
      
      // 존재하지 않는 경우 추가
      const { error } = await supabase
        .from("team_members")
        .insert({ team_id: teamId, user_id: userId });

      if (error) {
        // 중복 키 오류 (동시 요청으로 인해 발생할 수 있음)
        if (error.code === '23505') {
          console.log(`중복 키 오류 무시: teamId=${teamId}, userId=${userId}`);
          return null;
        }
        throw error;
      }

      return error;
    } catch (error) {
      console.error(`팀원 추가 중 오류 발생: teamId=${teamId}, userId=${userId}`, error);
      return error as Error;
    }
  },
  removeTeamMember: async (teamId: number, userId: number): Promise<Error | null> => {
    const { error } = await supabase
      .from("team_members")
      .delete()
      .eq("team_id", teamId)
      .eq("user_id", userId);

    if (error) {
      throw error;
    }

    return error;
  },
  updateTeam: async (teamId: number, teamData: Partial<Team>): Promise<Error | null> => {
    const { error } = await supabase
      .from("teams")
      .update(teamData)
      .eq("id", teamId);

    if (error) {
      throw error;
    }

    return error;
  },
};
