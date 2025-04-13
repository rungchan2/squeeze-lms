import { createClient } from "../supabase/client";
import { Role } from "@/types";
const supabase = createClient();

export const accessCode = {
  async getAllAccessCodes() {
    const { data, error } = await supabase.from("role_access_code").select("*");

    if (error) throw error;
    return data;
  },
  async createAccessCode(code: string, roleId: string) {
    const { data, error } = await supabase
      .from("role_access_code")
      .insert([{ code, role: roleId as Role }]);

    if (error) throw error;
    return data;
  },
  async deleteAccessCode(id: string) {
    const { error } = await supabase
      .from("role_access_code")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return true;
  },
  async confirmAccessCode(code: string, role: Role) {
    const trimedCode = code.trim();
    const { data, error } = await supabase
      .from("role_access_code")
      .select("*")
      .eq("code", trimedCode)
      .eq("role", role)
      .single();
    if (error) throw error;
    return { data, error };
  },
};
