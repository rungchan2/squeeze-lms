import { createClient } from "@/utils/supabase/client";
import type { Database } from "@/types/database.types";
import type { CreateUser } from "@/types/users";
type User = Database['public']['Tables']['profiles']['Row'];

export const userApi = {

  createUser: async (user: CreateUser) => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("profiles")
        .insert(user)
        .select()
        .single();
      return { data, error };
    } catch (e) {
      console.error("Supabase createUser 오류:", e);
      return { data: null, error: e instanceof Error ? e.message : String(e) };
    } finally {
      console.log("Supabase createUser 완료");
    }
  },
  // 사용자 정보 가져오기
  getUser: async (userId: number) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return data;
  },

  // 사용자 목록 가져오기
  getUsers: async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('*');
    
    if (error) throw error;
    return data;
  },

  // 사용자 정보 업데이트
  updateUser: async (userId: number, updates: Partial<User>) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // 사용자 삭제
  deleteUser: async (userId: number) => {
    const supabase = createClient();
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);
    
    if (error) throw error;
  }
}; 