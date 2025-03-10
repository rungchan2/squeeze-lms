import { CreateUser } from "@/types";
import { createClient } from "@/utils/supabase/client";
import Cookies from "js-cookie";


export async function checkUser() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

export async function getUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getUserProfile() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const { data: profile } = await supabase.from("profiles").select("*").eq("uid", session?.user?.id || "").single();
  return profile;
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  Cookies.remove("sb-");
  Cookies.remove("auth-token");
}

export const signUpWithEmail = async (email: string, password: string) => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  return { userData: data, error };
};
  export const signInWithEmail = async (email: string, password: string) => {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { userData: data, error };
  };

export const socialLogin = async (
  provider: "google" | "github" | "apple" | "twitter" | "facebook",
) => {
  const supabase = await createClient();
  try {
    console.log("소셜 로그인 시도:", provider);
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          skipBrowserRedirect: false,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });
  
      if (error) {
        console.error("소셜 로그인 에러:", error);
        throw error;
      }
  
      console.log("소셜 로그인 데이터:", data);
      return { data, error };
    } catch (error) {
      console.error("소셜 로그인 예외:", error);
      return { data: null, error };
    }
  };

export const createProfile = async (profile: CreateUser) => {
  const supabase = await createClient();
  const { data, error } = await supabase.from("profiles").insert(profile);
  return { data, error };
};
