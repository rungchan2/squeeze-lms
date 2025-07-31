import { createClient } from "../supabase/client";
import { Role } from "@/types";

export async function getAllAccessCodes() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("role_access_code")
    .select("*")
    .order('created_at', { ascending: false });
  
  return { data, error };
}

export async function getAccessCode(id: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("role_access_code")
    .select("*")
    .eq("id", id)
    .single();
  
  return { data, error };
}

export async function createAccessCode(accessCodeData: {
  code: string;
  role: Role;
  expiry_date?: string;
}) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("role_access_code")
    .insert([accessCodeData])
    .select("*")
    .single();
  
  return { data, error };
}

export async function updateAccessCode(id: string, updates: {
  code?: string;
  role?: Role;
  expiry_date?: string;
}) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("role_access_code")
    .update(updates)
    .eq("id", id)
    .select("*")
    .single();
  
  return { data, error };
}

export async function deleteAccessCode(id: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("role_access_code")
    .delete()
    .eq("id", id);
  
  return { data: null, error };
}

export async function confirmAccessCode(code: string, role?: Role) {
  const supabase = createClient();
  const trimmedCode = code.trim();
  
  let query = supabase
    .from("role_access_code")
    .select("*")
    .eq("code", trimmedCode);
  
  if (role) {
    query = query.eq("role", role);
  }
  
  const { data, error } = await query.single();
  
  if (error) {
    return { isValid: false, accessCode: undefined, error };
  }
  
  return { isValid: true, accessCode: data, error: null };
}

export async function toggleAccessCodeExpiry(id: string, expiryDate: string | null) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("role_access_code")
    .update({ expiry_date: expiryDate })
    .eq("id", id)
    .select("*")
    .single();
  
  return { data, error };
}

export async function getAccessCodeByCode(code: string) {
  const supabase = createClient();
  const trimmedCode = code.trim();
  const { data, error } = await supabase
    .from("role_access_code")
    .select("*")
    .eq("code", trimmedCode)
    .single();
  
  return { data, error };
}

// 기존 호환성을 위한 레거시 익스포트
export const accessCode = {
  getAllAccessCodes,
  createAccessCode: (code: string, roleId: string) => 
    createAccessCode({ code, role: roleId as Role }),
  deleteAccessCode,
  confirmAccessCode
};