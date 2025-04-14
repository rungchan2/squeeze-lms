"use server";

import { createClient } from "@/utils/supabase/server";

export async function getJourneyByUuid(uuid: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("journeys")
    .select("*")
    .eq("id", uuid)
    .single();

    
  return { data, error };
}
