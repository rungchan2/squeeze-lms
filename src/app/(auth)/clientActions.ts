import { createClient } from "@/utils/supabase/client";
import { CreateUser } from "@/types";
const supabase = createClient();

export async function socialLogin(
  provider: "google" | "github" | "apple" | "twitter" | "facebook"
) {
  try {
    console.log("소셜 로그인 시도:", provider);
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
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
}
