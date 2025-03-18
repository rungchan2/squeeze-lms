"use server";

import { createClient } from "@/utils/supabase/server";
import { CreateUser, Role } from "@/types";
import Cookies from "js-cookie";

export async function checkUser() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}

export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getSession() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}
export async function getPorfile(uid: string) {
  const supabase = await createClient();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("uid", uid)
    .single();
  return { profile, error };
}

export async function getUserProfile() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("uid", session?.user?.id || "")
    .single();
  return { profile, error };
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  Cookies.remove("sb-");
  Cookies.remove("auth-token");
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

export async function confirmRoleAccessCode(code: string, requestedRole: Role) {
  const supabase = await createClient();
  const trimedCode = code.trim();
  const { data, error } = await supabase
    .from("role_access_code")
    .select("*")
    .eq("code", trimedCode)
    .eq("role", requestedRole)
    .single();
  return { data, error };
}
