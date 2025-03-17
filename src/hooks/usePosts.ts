import useSWR from "swr";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "@/components/AuthProvider";

async function getPosts() {
  const supabase = createClient();
  const { data, error } = await supabase.from("posts").select(`
      *,
      profiles (
        id, first_name, last_name, organization_id, profile_image,
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

// 내 게시물만 가져오는 함수
async function getMyPosts(userId: number) {
  if (!userId) return [];
  
  const supabase = createClient();
  const { data, error } = await supabase
    .from("posts")
    .select(`
      *,
      profiles (
        id, first_name, last_name, organization_id, profile_image,
        organizations (
          id, name
        )
      )
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  
  if (error) {
    throw error;
  }
  
  return data ?? [];
}

// 내가 좋아요한 게시물만 가져오는 함수
async function getMyLikedPosts(userId: number) {
  if (!userId) return [];
  
  const supabase = createClient();
  const { data, error } = await supabase
    .from("likes")
    .select(`
      post_id,
      posts (
        *,
        profiles (
          id, first_name, last_name, organization_id, profile_image,
          organizations (
            id, name
          )
        )
      )
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  
  if (error) {
    throw error;
  }
  
  // post_id가 null이 아닌 게시물만 필터링하고 posts 객체만 추출
  return data
    .filter(item => item.post_id !== null && item.posts !== null)
    .map(item => item.posts) ?? [];
}

async function getCompletedMissionIds(userId: number) {
  if (!userId) return [];
  
  const supabase = createClient();
  const { data, error } = await supabase
    .from("posts")
    .select("mission_instance_id")
    .eq("user_id", userId);
  
  if (error) {
    console.error("Error fetching completed missions:", error);
    return [];
  }
  
  // 제출한 미션 ID 목록 추출
  const completedIds = data
    .filter((post) => post.mission_instance_id !== null)
    .map((post) => post.mission_instance_id as number);
  
  return completedIds;
}
//TODO: comments 무한 스크롤 적용

// ✅ SWR을 사용한 usePosts 훅
export function usePosts() {
  const { data, error, isLoading, mutate } = useSWR("posts", getPosts, {
    revalidateOnFocus: false,
    dedupingInterval: 60000, // 1분 동안 중복 요청 방지
  });

  return { data, isLoading, error, mutate };
}

// ✅ SWR을 사용한 useMyPosts 훅
export function useMyPosts() {
  const { id: userId } = useAuth();
  
  const { data, error, isLoading, mutate } = useSWR(
    userId ? `my-posts-${userId}` : null,
    () => getMyPosts(userId as number),
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1분 동안 중복 요청 방지
    }
  );

  return { 
    data, 
    error, 
    isLoading,
    mutate,
    isEmpty: Array.isArray(data) && data.length === 0
  };
}

// ✅ SWR을 사용한 useMyLikedPosts 훅
export function useMyLikedPosts() {
  const { id: userId } = useAuth();
  
  const { data, error, isLoading, mutate } = useSWR(
    userId ? `my-liked-posts-${userId}` : null,
    () => getMyLikedPosts(userId as number),
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1분 동안 중복 요청 방지
    }
  );

  return { 
    data, 
    error, 
    isLoading,
    mutate,
    isEmpty: Array.isArray(data) && data.length === 0
  };
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
