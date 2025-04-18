"use server";

import { createClient } from "@/utils/supabase/server";
import { CreateUser } from "@/types";

export async function signUpWithEmail(email: string, password: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  return { userData: data, error };
}

export const signInWithEmail = async (email: string, password: string) => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { userData: data, error };
};

export async function createProfile(profile: CreateUser) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .insert(profile)
    .single();
  return { data, error };
}

