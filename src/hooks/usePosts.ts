import useSWR from "swr";
import { createClient } from "@/utils/supabase/client";

// ✅ posts 데이터 가져오기 (users + companies LEFT JOIN)
async function getPosts() {
  const supabase = createClient();
  const { data, error } = await supabase.from("posts").select(`
      *,
      profiles (
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

// ✅ 사용자가 완료한 미션 ID 목록 가져오기
async function getCompletedMissionIds(userId: number) {
  if (!userId) return [];
  
  const supabase = createClient();
  const { data, error } = await supabase
    .from("posts")
    .select("mission_id")
    .eq("user_id", userId);
  
  if (error) {
    console.error("Error fetching completed missions:", error);
    return [];
  }
  
  // 제출한 미션 ID 목록 추출
  const completedIds = data
    .filter((post) => post.mission_id !== null)
    .map((post) => post.mission_id as number);
  
  return completedIds;
}

// ✅ SWR을 사용한 usePosts 훅
export function usePosts() {
  const { data, error, isLoading } = useSWR("posts", getPosts, {
    revalidateOnFocus: false,
    dedupingInterval: 60000, // 1분 동안 중복 요청 방지
  });

  return { data, isLoading, error };
}

// ✅ SWR을 사용한 useCompletedMissions 훅
export function useCompletedMissions(userId: number) {
  const { data, error, isLoading, mutate } = useSWR(
    userId ? `completed-missions-${userId}` : null,
    () => getCompletedMissionIds(userId),
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1분 동안 중복 요청 방지
    }
  );

  return {
    completedMissionIds: data || [],
    isLoading,
    error,
    mutate
  };
}
