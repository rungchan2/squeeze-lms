import { Team, TeamMember } from "@/types";
import { createClient } from "@/utils/supabase/client";

export async function getAllTeams(journeyId: string): Promise<Team[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("teams")
    .select("*")
    .eq("journey_id", journeyId);

  if (error) {
    throw error;
  }

  return data;
}

export async function getTeamData(journeyId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("teams")
    .select("*")
    .eq("journey_id", journeyId);

  if (error) {
    throw error;
  }

  return data;
}

export async function getCurrentUserTeam(
  currentUserId: string,
  journeyId: string
): Promise<{ team_id: string; team_name: string; members: string[] } | null> {
  const supabase = createClient();
  try {
    // 먼저 single() 없이 조회해서 여러 결과가 있는지 확인
    const { data: initialData, error: initialError } = await supabase
      .from("team_members")
      .select(
        "team_id, teams!inner(journey_id), profiles!inner(first_name, last_name)"
      )
      .eq("user_id", currentUserId)
      .eq("teams.journey_id", journeyId);

    // 결과가 없는 경우
    if (initialError || !initialData || initialData.length === 0) {
      return null;
    }

    // 여러 결과가 있는 경우 첫 번째 결과 반환
    if (initialData.length > 1) {
      return {
        team_id: initialData[0].team_id,
        team_name: initialData[0].profiles?.first_name || "",
        members: initialData.map((member) => member.profiles?.first_name || ""),
      };
    }

    // 단일 결과인 경우
    return {
      team_id: initialData[0].team_id,
      team_name: initialData[0].profiles?.first_name || "",
      members: initialData.map((member) => member.profiles?.first_name || ""),
    };
  } catch (error) {
    console.error("getCurrentUserTeam 예외 발생:", error);
    return null;
  }
}

export async function getTeam(teamId: string): Promise<Team | null> {
  const supabase = createClient();
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
}

export async function getTeamMembers(teamIds: string[]): Promise<TeamMember[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("team_members")
    .select("*, profiles:user_id(id, first_name, last_name)")
    .in("team_id", teamIds);

  if (error) {
    throw error;
  }

  return data;
}

export async function getTeamByName(
  journeyId: string,
  teamName: string
): Promise<Team | null> {
  const supabase = createClient();
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
}

export async function deleteTeam(teamId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("teams").delete().eq("id", teamId);

  if (error) {
    throw error;
  }
}
export async function createTeam(
  team: Omit<Team, "id" | "created_at" | "updated_at">
): Promise<Team> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("teams")
    .insert(team)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function addTeamMember(
  teamId: string,
  userId: string
): Promise<Error | null> {
  const supabase = createClient();
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
      if (error.code === "23505") {
        console.log(`중복 키 오류 무시: teamId=${teamId}, userId=${userId}`);
        return null;
      }
      throw error;
    }

    return error;
  } catch (error) {
    console.error(
      `팀원 추가 중 오류 발생: teamId=${teamId}, userId=${userId}`,
      error
    );
    return error as Error;
  }
}

export async function removeTeamMember(
  teamId: string,
  userId: string
): Promise<Error | null> {
  const supabase = createClient();
  const { error } = await supabase
    .from("team_members")
    .delete()
    .eq("team_id", teamId)
    .eq("user_id", userId);

  if (error) {
    throw error;
  }

  return error;
}

export async function updateTeam(
  teamId: string,
  teamData: Partial<Team>
): Promise<Error | null> {
  const supabase = createClient();
  const { error } = await supabase
    .from("teams")
    .update(teamData)
    .eq("id", teamId);

  if (error) {
    throw error;
  }

  return error;
}
