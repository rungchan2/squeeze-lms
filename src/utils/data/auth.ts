import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

export const auth = {
  getUser: async () => {
    const { data, error } = await supabase.auth.getUser();
    return { data, error };
  },
  userLogout: async () => {
    const { error } = await supabase.auth.signOut();
    return error;
  },
  signUpWithEmail: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    return { userData: data, error };
  },
  signInWithEmail: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { userData: data, error };
  },
  getUserProfileWithEmail: async (email: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("email", email)
      .single();
    return { profileData: data, error };
  },
};
