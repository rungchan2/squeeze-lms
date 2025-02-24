import { supabase } from "@/lib/initSupabase";

export const socialLogin = async (provider: "google" | "github" | "apple" | "twitter" | "facebook") => {
  return await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${process.env.BASE_URL}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });
};

export const socialLogout = async () => {
  return await supabase.auth.signOut();
};
