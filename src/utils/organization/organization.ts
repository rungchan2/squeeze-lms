import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

export const organization = {
  getOrganization: async (organizationId: number) => {
    const { data, error } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", organizationId);
    return { data, error };
  },
};
