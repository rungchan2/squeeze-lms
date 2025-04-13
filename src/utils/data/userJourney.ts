"use server";

import { createClient } from "@/utils/supabase/server";
import { UserJourneyWithJourney } from "@/types";

export async function getJourney(userId: string) {
  if (!userId) {
    return [];
  }
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("user_journeys")
      .select("*, journeys(*)")
      .eq("user_id", userId);

    if (error) {
      throw new Error(error.message);
    }

    if (!data || data.length === 0) {
      return [];
    }

    return data
}


export async function createJourney(userId: string, journey: UserJourneyWithJourney) {
  const supabase = await createClient();
  const { data, error } = await supabase
      .from("user_journeys")
      .insert({ user_id: userId, journey_id: journey.journey_id });

    if (error) {
      throw new Error(error.message);
    }

    return data;
}
