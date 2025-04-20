import { CreateJourney } from "@/types";
import { createClient } from "@/utils/supabase/client";

export const journey = {
  getJourney: async (journeyId: string) => {
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
      .eq("id", journeyUuid);
    if (error) {
      throw error;
    }
    return data as { id: string }[];
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

export async function deleteJourney(id: string) {
  const supabase =  createClient();
  const { data, error } = await supabase.from("journeys").delete().eq("id", id);
  return { data, error };
}

export async function updateJourney(id: string, journey: CreateJourney) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("journeys")
    .update(journey)
    .eq("id", id);
  return { data, error };
}
export async function createJourney(journey: CreateJourney) {
  const supabase = createClient();
  const { data, error } = await supabase.from("journeys").insert(journey);
  return { data, error };
}