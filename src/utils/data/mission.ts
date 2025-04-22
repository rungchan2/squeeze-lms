import { createClient } from "@/utils/supabase/client";
import { CreateMission } from "@/types";

export async function getMissionById(id: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("missions")
    .select("*")
    .eq("id", id)
    .single();
  return { data, error };
}

export async function createMission(mission: CreateMission) {
  const supabase = createClient();
  const { data, error } = await supabase.from("missions").insert(mission);
  return { data, error };
}

export async function updateMission(id: string, mission: CreateMission) {
  const supabase = createClient();
  const { data, error } = await supabase.from("missions").update(mission).eq("id", id);
  return { data, error };
}

export async function deleteMission(id: string) {
  const supabase = createClient();
  const { data, error } = await supabase.from("missions").delete().eq("id", id);
  return { data, error };
}

export async function getMissionTypes() {
  const supabase = createClient();
  const { data, error } = await supabase.rpc(
    "get_distinct_mission_types" as any
  );
  return { data, error };
}
