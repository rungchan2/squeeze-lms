import { createClient } from "@/utils/supabase/client";
import { CreateUser, SignupPage, User } from "@/types";

// null 값을 undefined로 변환하는 헬퍼 함수
function nullToUndefined<T extends object>(obj: T): any {
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [key, value === null ? undefined : value])
  );
}
export async function getSession() {
  const supabase = createClient();
  const {
    data: { session },
    error,  
  } = await supabase.auth.getSession();
  return { session, error };
}

export async function getUser() {
  const supabase = createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  return { user, error };
}

export async function getOrganizationUsersByPage(
  organizationId: string,
  page: number,
  pageSize: number
) {
  const supabase = createClient();
  const from = page * pageSize;
  const to = from + pageSize - 1;
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("organization_id", organizationId)
    .range(from, to);

  if (error) throw error;
  return { data: (data as User[]) || [], count: data?.length || 0 };
}

export async function getAllUsersByPage(page: number, pageSize: number) {
  const supabase = createClient();

  const from = page * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await supabase
    .from("profiles")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) throw error;

  return {
    data: (data as User[]) || [],
    count: count || 0,
  };
}

export async function getUserById(id: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data as User;
}

export async function getUserProfile() {
  const supabase = createClient();
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();
  if (!session || error) {
    throw new Error("사용자 정보를 찾을 수 없습니다.");
  }
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", session.user.id || "")
    .single();
  if (profileError) {
    throw new Error("사용자 프로필을 찾을 수 없습니다.");
  }
  return { profile, error: profileError };
}

export async function deleteProfile(uid: string) {
  const supabase = createClient();
  const { error } = await supabase.from("profiles").delete().eq("uid", uid);
  return { error };
}

export async function deleteUser(uid: string) {
  const supabase = createClient();
  const { error } = await supabase.auth.admin.deleteUser(uid);
  return { error };
}

export async function updateProfile(id: string, data: any) {
  const supabase = createClient();
  const { error } = await supabase.from("profiles").update(data).eq("id", id);
  return { error };
}
export async function updatePassword(new_password: string) {
  const supabase = createClient();
  const { error } = await supabase.auth.updateUser({
    password: new_password,
  });
  return { error };
}

export async function createProfile(data: SignupPage) {
  const supabase = createClient();
  const profileData = {
    email: data.email,
    first_name: data.first_name,
    last_name: data.last_name,
    phone: data.phone,
    role: data.role,
    organization_id: data.organization_id,
    profile_image: data.profile_image || "",
    marketing_opt_in: data.marketing_opt_in,
    privacy_agreed: data.privacy_agreed,
  };
  
  const { error } = await supabase.from("profiles").insert(profileData as any);
  return { error };
}

export async function getProfileImage(id: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("profile_image")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data?.profile_image;
}

export async function getMarketingOptIn(id: string): Promise<boolean | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("marketing_opt_in")
    .eq("id", id)
    .single();

  if (error) throw error;

  return data?.marketing_opt_in;
}
