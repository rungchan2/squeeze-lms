import { createClient } from "@/utils/supabase/client";
import { CreateUser } from "@/types";

const supabase = createClient();

export const user = {
  async getUser() {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    return { user, error };
  },
  async deleteProfile(uid: string) {
    const { error } = await supabase.from("profiles").delete().eq("uid", uid);
    return { error };
  },
  async deleteUser(uid: string) {
    const { error } = await supabase.auth.admin.deleteUser(uid);
    return { error };
  },
  async updateProfile(uid: string, data: any) {
    const { error } = await supabase.from("profiles").update(data).eq("uid", uid);
    return { error };
  },
  async supabaseUser() {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    return { user, error };
  },
  async updatePassword(new_password: string) {
    const { error } = await supabase.auth.updateUser({ password: new_password });
    return { error };
  },
};
