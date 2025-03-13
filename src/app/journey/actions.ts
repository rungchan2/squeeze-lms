"use server";

import { createClient } from "@/utils/supabase/server";

export async function getJourney(uuid: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("journeys").select("*").eq("uuid", uuid);
  return {data, error};
}

export async function getJourneyWeeks(journeyId: number) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("journey_weeks").select("*").eq("journey_id", journeyId);
  return {data, error};
}