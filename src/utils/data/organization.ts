import { createClient } from "@/utils/supabase/client";

export async function getOrganizationById(organizationId: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", organizationId);
  return { data, error };
}
