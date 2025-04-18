import { createClient } from "@/utils/supabase/client";
import { CreateMission } from "@/types";

const supabase = createClient();

export const mission = {
    getMission: async (id: string) => {
        const { data, error } = await supabase.from("missions").select("*").eq("id", id).single();
        return { data, error };
    },
    createMission: async (mission: CreateMission) => {
        const { data, error } = await supabase.from("missions").insert(mission);
        return { data, error };
    },
    updateMission: async (id: string, mission: CreateMission) => {
        const { data, error } = await supabase.from("missions").update(mission).eq("id", id);
        return { data, error };
    },
    deleteMission: async (id: string) => {
        const { data, error } = await supabase.from("missions").delete().eq("id", id);
        return { data, error };
    },
}

export async function getMissionTypes() {
    const supabase = createClient();
    const { data, error } = await supabase.rpc(
      "get_distinct_mission_types" as any
    );
    return { data, error };
}
