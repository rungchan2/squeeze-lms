import { createClient } from "@/utils/supabase/client";
import { Organization } from "@/types";

export async function getOrganizations() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("organizations")
    .select("*")
    .order("name", { ascending: true });
  return { data, error };
}

export async function getOrganizationById(organizationId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", organizationId)
    .single();
  return { data, error };
}

export async function getPublicOrganizations() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("organizations")
    .select("*")
    .neq("name", "스퀴즈") // 내부 조직 제외
    .order("name", { ascending: true });
  return { data, error };
}

export async function createOrganization(organizationData: {
  name: string;
  description?: string;
  logo_url?: string;
}) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("organizations")
    .insert([organizationData])
    .select("*")
    .single();
  return { data, error };
}

export async function updateOrganization(id: string, updates: {
  name?: string;
  description?: string;
  logo_url?: string;
}) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("organizations")
    .update(updates)
    .eq("id", id)
    .select("*")
    .single();
  return { data, error };
}

export async function deleteOrganization(id: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("organizations")
    .delete()
    .eq("id", id);
  return { data: null, error };
}
