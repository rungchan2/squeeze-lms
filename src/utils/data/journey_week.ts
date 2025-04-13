import { createClient } from "@/utils/supabase/client";
import { JourneyWeek } from "@/types";

export const week = {
  getWeek: async (journeyId: string) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("journey_weeks")
      .select("*")
      .eq("journey_id", journeyId);

    if (error) {
      throw error;
    }

    return data;
  },
  updateWeek: async (weekId: string, data: Partial<JourneyWeek>) => {
    const supabase = createClient();
    const { data: updatedData, error } = await supabase
      .from("journey_weeks")
      .update(data)
      .eq("id", weekId);

    if (error) {
      throw error;
    }

    return { data: updatedData, error };
  },
  deleteWeek: async (weekId: string) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("journey_weeks")
      .delete()
      .eq("id", weekId);

    if (error) {
      throw error;
    }

    return data;
  },
};
