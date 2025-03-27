import { createClient } from "@/utils/supabase/client";
import { CreateMission } from "@/types";

const supabase = createClient();

export const mission = {
    getMission: async (id: number) => {
        const { data, error } = await supabase.from("missions").select("*").eq("id", id).single();
        return { data, error };
    },
    createMission: async (mission: CreateMission) => {
        const { data, error } = await supabase.from("missions").insert(mission);
        return { data, error };
    },
    updateMission: async (id: number, mission: CreateMission) => {
        const { data, error } = await supabase.from("missions").update(mission).eq("id", id);
        return { data, error };
    },
    deleteMission: async (id: number) => {
        const { data, error } = await supabase.from("missions").delete().eq("id", id);
        return { data, error };
    },
}
