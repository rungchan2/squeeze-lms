import useSWR, { mutate } from "swr";
import { createClient } from "@/utils/supabase/client";

const fetcher = async () => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("role_access_code")
    .select("*");
  
  if (error) throw error;
  return data;
};

export default function useAccessCode() {
  const { data, error, isLoading } = useSWR("/api/access-code", fetcher);

  // 액세스 코드 생성 함수
  const createAccessCode = async (code: string, roleId: string) => {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("role_access_code")
        .insert([{ code, role_id: roleId }]);
      
      if (error) throw error;
      
      // SWR 캐시 갱신
      mutate("/api/access-code");
      
      return { data, success: true };
    } catch (error) {
      return { error, success: false };
    }
  };

  // 액세스 코드 삭제 함수
  const deleteAccessCode = async (id: string) => {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("role_access_code")
        .delete()
        .match({ id });
      
      if (error) throw error;
      
      // SWR 캐시 갱신
      mutate("/api/access-code");
      
      return { data, success: true };
    } catch (error) {
      return { error, success: false };
    }
  };

  return {
    accessCodes: data,
    isLoading,
    error,
    createAccessCode,
    deleteAccessCode
  };
}

