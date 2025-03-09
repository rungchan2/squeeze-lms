import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/utils/supabase/client";

// ✅ posts 데이터 가져오기 (users + companies LEFT JOIN)
async function getPosts() {
  const { data, error } = await supabase.from("posts").select(`
      *,
      users (
        id, first_name, last_name, organization_id,
        organizations (
          id, name
        )
      )
    `);

  if (error) {
    throw error;
  }

  return data ?? [];
}

// ✅ React Query를 사용한 usePosts 훅
export function usePosts() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["posts"],
    queryFn: getPosts,
  });

  return { data, isLoading, error };
}
