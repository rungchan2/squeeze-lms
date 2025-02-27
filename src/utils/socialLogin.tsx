import { createClient } from "@/utils/supabase/client";
import Cookies from 'js-cookie'

const supabase = createClient();

export const socialLogin = async (provider: "google" | "github" | "apple" | "twitter" | "facebook") => {
  try {
    console.log('소셜 로그인 시도:', provider);
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        skipBrowserRedirect: false,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) {
      console.error('소셜 로그인 에러:', error);
      throw error;
    }

    console.log('소셜 로그인 데이터:', data);
    return { data, error };
  } catch (error) {
    console.error('소셜 로그인 예외:', error);
    return { data: null, error };
  }
};

export const socialLogout = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('소셜 로그아웃 에러:', error);
    throw error;
  }
  Cookies.remove("auth_data");
  Cookies.remove("authData");
  console.log("소셜 로그아웃 성공");
  return { error };
};
export const clearCookie = () => {
  Cookies.remove("auth_data");
  Cookies.remove("authData");
};

export const signUpNewUser = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  })
  if (error) {
    console.error('회원가입 에러:', error);
    throw error;
  }
  return data;
}
export const signInWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  if (error) {
    console.error('이메일 로그인 에러:', error);
    throw error;
  }
  return data;
}