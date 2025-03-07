import { supabase } from "@/utils/supabase/client";
import type { Database } from "@/types/database.types";

type User = Database['public']['Tables']['users']['Row'];

export const userApi = {
  // 사용자 정보 가져오기
  getUser: async (userId: number) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return data;
  },

  // 사용자 목록 가져오기
  getUsers: async () => {
    const { data, error } = await supabase
      .from('users')
      .select('*');
    
    if (error) throw error;
    return data;
  },

  // 사용자 정보 업데이트
  updateUser: async (userId: number, updates: Partial<User>) => {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // 사용자 삭제
  deleteUser: async (userId: number) => {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);
    
    if (error) throw error;
  }
}; 