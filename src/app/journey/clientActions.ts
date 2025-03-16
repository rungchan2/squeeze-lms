import { createClient } from "@/utils/supabase/client";

export async function getJourney(uuid: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("journeys")
    .select("*")
    .eq("uuid", uuid)
    .single();
  return { data, error };
}
