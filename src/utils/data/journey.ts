import { CreateJourney } from "@/types";
import { createClient } from "@/utils/supabase/client";

export async function getAllJourneys() {
  const supabase = createClient();
  const { data, error } = await supabase.from("journeys").select("*");
  if (error) {
    throw new Error(error.message);
  }
  return data;
}
export async function getJourney(journeyId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("journeys")
    .select("*")
    .eq("id", journeyId);
  if (error) {
    throw new Error(error.message);
  }
  return data;
}

export async function getJourneyByUuidRetrieveId(journeyUuid: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("journeys")
    .select("id")
    .eq("id", journeyUuid);
  if (error) {
    throw error;
  }
  return data as { id: string }[];
}

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