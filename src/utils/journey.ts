"use server";

import { createClient } from "@/utils/supabase/server";
import { UserJourneyWithJourney } from "@/types/userJourneys";

export async function getJourney(userId: number) {
  if (userId === 0) {
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

export async function createJourney(userId: number, journey: UserJourneyWithJourney) {
  const supabase = await createClient();
  const { data, error } = await supabase
      .from("user_journeys")
      .insert({ user_id: userId, journey: journey });

    if (error) {
      throw new Error(error.message);
    }

    return data;
}
