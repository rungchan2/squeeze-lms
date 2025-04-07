import { createClient } from "@/utils/supabase/client";
import { SignupPage } from "@/types";

export const user = {
  async getUser() {
    const supabase = createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    return { user, error };
  },
  async getUserProfile() {
    const supabase = createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (!user || error) {
      throw new Error("사용자 정보를 찾을 수 없습니다.");
    }
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("uid", user?.id || "")
      .single();
    return { profile, error: profileError };
  },
  async deleteProfile(uid: string) {
    const supabase = createClient();
    const { error } = await supabase.from("profiles").delete().eq("uid", uid);
    return { error };
  },
  async deleteUser(uid: string) {
    const supabase = createClient();
    const { error } = await supabase.auth.admin.deleteUser(uid);
    return { error };
  },
  async updateProfile(uid: string, data: any) {
    const supabase = createClient();
    const { error } = await supabase.from("profiles").update(data).eq("uid", uid);
    return { error };
  },
  async supabaseUser() {
    const supabase = createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    return { user, error };
  },
  async updatePassword(new_password: string) {
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: new_password });
    return { error };
  },
  async createProfile(data: SignupPage) {
    const supabase = createClient();
    
    // uid가 있는지 확인
    if (!data.uid) {
      return { error: new Error("사용자 ID가 필요합니다.") };
    }
    
    // 프로필 데이터 구성
    const profileData = {
      uid: data.uid,
      email: data.email,
      first_name: data.first_name,
      last_name: data.last_name,
      phone: data.phone,
      role: data.role,
      organization_id: data.organization_id,
      profile_image: data.profile_image || "",
      marketing_opt_in: data.marketing_opt_in,
      privacy_agreed: data.privacy_agreed
    };
    
    // 프로필 생성
    const { error } = await supabase.from("profiles").insert(profileData);
    return { error };
  },
};
