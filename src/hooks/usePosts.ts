import useSWR from "swr";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { useInfiniteQuery } from '@tanstack/react-query';

// 페이지네이션 타입 정의
type FetchPostsParams = {
  pageParam: number;
  pageSize: number;
};

// 포스트 페이지 결과 타입
interface PostsPage {
  data: any[];
  nextPage: number | null;
  total: number;
}

// 게시물을 페이지네이션으로 가져오는 함수
async function getPosts({ pageParam = 0, pageSize = 10 }: FetchPostsParams): Promise<PostsPage> {
  const supabase = createClient();
  
  const from = pageParam * pageSize;
  const to = from + pageSize - 1;
  
  const { data, error, count } = await supabase
    .from("posts")
    .select(`
      *,
      profiles (
        id, first_name, last_name, organization_id, profile_image,
        organizations (
          id, name
        )
      )
    `, { count: 'exact' })
    .order("created_at", { ascending: false })
    .range(from, to);
    
  if (error) throw error;
  
  const hasNextPage = count ? from + pageSize < count : false;
  const nextPage = hasNextPage ? pageParam + 1 : null;
  
  return {
    data: data ?? [],
    nextPage,
    total: count ?? 0
  };
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

// ✅ SWR을 사용한 usePosts 훅
export function usePosts(pageSize = 10) {
  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
    refetch
  } = useInfiniteQuery({
    queryKey: ['posts'],
    queryFn: ({ pageParam }) => getPosts({ 
      pageParam: pageParam as number, 
      pageSize
    }),
    getNextPageParam: (lastPage: PostsPage) => lastPage.nextPage,
    initialPageParam: 0
  });
  
  // 모든 페이지의 데이터를 하나의 배열로 합치기
  const posts = data?.pages.flatMap(page => page.data) || [];
  
  return {
    data: posts,
    error,
    isLoading: status === 'pending',
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    refetch,
    total: data?.pages[0]?.total ?? 0
  };
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
  const { data, error, isLoading, refetch } = useInfiniteQuery({
    queryKey: ['completed-missions', userId],
    queryFn: () => getCompletedMissionIds(userId),
    initialPageParam: 0,
    getNextPageParam: () => null, // 페이지네이션이 필요 없으므로 null 반환
    enabled: !!userId
  });
  
  const completedMissionIds = data?.pages[0] || [];
  
  return {
    completedMissionIds,
    error,
    isLoading,
    refetch
  };
}
