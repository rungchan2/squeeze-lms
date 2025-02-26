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
