"use server";

import { createClient } from "@/utils/supabase/server";
import { CreateUser, Role } from "@/types";
import Cookies from "js-cookie";

export async function getUser() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  } catch (error) {
    console.error("getUser 에러:", error);
    return null;
  }
}

export async function getPorfile(id: string) {
  const supabase = await createClient();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();
  return { profile, error };
}

export async function getUserProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user?.id || "")
    .single();
  return { profile, error };
}

export async function logout() {
  console.log("logout");
  const supabase = await createClient();
  await supabase.auth.signOut();
  Cookies.remove("sb-");
  Cookies.remove("auth-token");
  Cookies.remove("auth_data");
}

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
  console.log("signInWithEmail",data, error);
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

export async function getAdmin() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "admin");
  return { data, error };
}

export async function getTeacher() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "teacher");
  return { data, error };
}

