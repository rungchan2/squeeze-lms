import useSWR from "swr";
import { createClient } from "@/utils/supabase/client";
import { useSupabaseAuth } from "./useSupabaseAuth";

// 게시물 유형 enum
export enum PostType {
  MY_POSTS = "my_posts",
  LIKED_POSTS = "liked_posts",
}

// 내 게시물 가져오는 함수
async function getMyPosts(userId: string) {
  if (!userId) return [];

  const supabase = createClient();

  const { data, error } = await supabase
    .from("posts")
    .select("*, profiles(*)")
    .eq("user_id", userId)
    .eq("is_hidden", false) // 숨겨진 게시물 제외
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data ?? [];
}

// 내가 좋아요한 게시물만 가져오는 함수
async function getMyLikedPosts(userId: string) {
  if (!userId) return [];

  const supabase = createClient();

  const { data: likedPosts, error } = await supabase
    .from("likes")
    .select("posts(*, profiles(*))")
    .eq("user_id", userId)
    .eq("posts.is_hidden", false) // 숨겨진 게시물 제외
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return likedPosts.map((post) => post.posts) ?? [];
}

// ✅ 통합된 게시물 데이터 가져오는 함수
async function getPosts(userId: string, type: PostType) {
  if (type === PostType.MY_POSTS) {
    return getMyPosts(userId);
  } else {
    return getMyLikedPosts(userId);
  }
}

// ✅ 통합된 usePosts 훅
export function useLikedPosts(type: PostType = PostType.LIKED_POSTS) {
  const { id: userId } = useSupabaseAuth();

  const { data, error, isLoading, mutate } = useSWR(
    userId ? [`posts-${type}-${userId}`, userId, type] : null,
    ([_, id, postType]) => getPosts(id, postType),
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
    isEmpty: Array.isArray(data) && data.length === 0,
  };
}