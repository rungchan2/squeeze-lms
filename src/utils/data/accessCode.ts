import { createClient } from "../supabase/client";
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
      .insert([{ code, role_id: roleId }]);

    if (error) throw error;
    return data;
  },
  async deleteAccessCode(id: string) {
    const { error } = await supabase
      .from("role_access_code")
      .delete()
      .eq("id", parseInt(id));

    if (error) throw error;
    return true;
  },
};
