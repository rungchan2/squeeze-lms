"use server";

import { createClient } from "@/utils/supabase/server";

export async function getJourneyByUuid(uuid: string) {
  const supabase = await createClient();
  console.log("getJourneyByUuid 호출" , uuid);
  const { data, error } = await supabase
    .from("journeys")
    .select("*")
    .eq("uuid", uuid)
    .single();

  console.log("getJourneyByUuid 결과" , data, error);
    
  return { data, error };
}
