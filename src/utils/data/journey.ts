import { createClient } from "@/utils/supabase/client";

export const journey = {
  getJourney: async (journeyId: number) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("journeys")
      .select("*")
      .eq("id", journeyId);
    if (error) {
      throw error;
    }
    return data;
  },
  getJourneyByUuidRetrieveId: async (journeyUuid: string) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("journeys")
      .select("id")
      .eq("uuid", journeyUuid);
    if (error) {
      throw error;
    }
    return data as { id: number }[];
  },
  getJourneyBySlug: async (slug: string) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("journeys")
      .select("*")
      .eq("slug", slug)
      .single();
    if (error) {
      throw error;
    }
    return data;
  },
};
