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
  
  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { data: null, error: authError || new Error("User not authenticated") };
  }

  // Ensure the profile ID matches the authenticated user
  const profileData = {
    ...profile,
    id: user.id,
    email: profile.email || user.email,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Check if profile already exists
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .single();

  if (existingProfile) {
    return { 
      data: null, 
      error: new Error("Profile already exists for this user") 
    };
  }

  // Create the profile
  const { data, error } = await supabase
    .from("profiles")
    .insert(profileData)
    .select()
    .single();

  return { data, error };
}

