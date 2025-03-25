import useSWR from "swr";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { useInfiniteQuery } from '@tanstack/react-query';
import { PostWithRelations } from "@/types";

// 페이지네이션 타입 정의
type FetchPostsParams = {
  pageParam: number;
  pageSize: number;
  journeySlug?: string;
  showHidden?: boolean;
};

// 포스트 페이지 결과 타입
interface PostsPage {
  data: PostWithRelations[];
  nextPage: number | null;
  total: number;
}

// 게시물을 페이지네이션으로 가져오는 함수
async function getPosts({ pageParam = 0, pageSize = 10, journeySlug, showHidden = false }: FetchPostsParams): Promise<PostsPage> {
  const supabase = createClient();
  
  const from = pageParam * pageSize;
  const to = from + pageSize - 1;
  
  let query = supabase
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
    
  if (!showHidden) {
    query = query.eq("is_hidden", false);
  }
  
  // journeySlug가 제공된 경우 해당 journey의 게시물만 필터링
  if (journeySlug) {
    // mission_instance_id를 통해 journey와 연결
    const { data: missionInstances } = await supabase
      .from("journey_mission_instances")
      .select("id")
      .eq("journey_uuid", journeySlug);
    
    if (missionInstances && missionInstances.length > 0) {
      const instanceIds = missionInstances.map(instance => instance.id);
      query = query.in("mission_instance_id", instanceIds);
    } else {
      // 해당 journey에 대한 mission instance가 없으면 빈 결과 반환
      return {
        data: [],
        nextPage: null,
        total: 0
      };
    }
  }
    
  const { data, error, count } = await query.range(from, to);
    
  if (error) throw error;
  
  const hasNextPage = count ? from + pageSize < count : false;
  const nextPage = hasNextPage ? pageParam + 1 : null;
  
  return {
    data: data as PostWithRelations[],
    nextPage,
    total: count ?? 0
  };
}

// 내 게시물만 가져오는 함수
async function getMyPosts(userId: number, journeySlug?: string) {
  if (!userId) return [];
  
  const supabase = createClient();
  
  let query = supabase
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
    .eq("is_hidden", false) // 숨겨진 게시물 제외
    .order("created_at", { ascending: false });
  
  // journeySlug가 제공된 경우 해당 journey의 게시물만 필터링
  if (journeySlug) {
    // mission_instance_id를 통해 journey와 연결
    const { data: missionInstances } = await supabase
      .from("journey_mission_instances")
      .select("id")
      .eq("journey_uuid", journeySlug);
    
    if (missionInstances && missionInstances.length > 0) {
      const instanceIds = missionInstances.map(instance => instance.id);
      query = query.in("mission_instance_id", instanceIds);
    } else {
      // 해당 journey에 대한 mission instance가 없으면 빈 결과 반환
      return [];
    }
  }
  
  const { data, error } = await query;
  
  if (error) {
    throw error;
  }
  
  return data ?? [];
}

// 내가 좋아요한 게시물만 가져오는 함수
async function getMyLikedPosts(userId: number, journeySlug?: string) {
  if (!userId) return [];
  
  const supabase = createClient();
  
  // 먼저 journey_mission_instances에서 해당 journey의 mission_instance_id 목록 조회
  const missionInstanceIds: number[] = [];
  if (journeySlug) {
    const { data: missionInstances } = await supabase
      .from("journey_mission_instances")
      .select("id")
      .eq("journey_uuid", journeySlug);
    
    if (missionInstances && missionInstances.length > 0) {
      missionInstances.forEach(instance => missionInstanceIds.push(instance.id));
    } else {
      // 해당 journey에 대한 mission instance가 없으면 빈 결과 반환
      return [];
    }
  }
  
  let query = supabase
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
    .eq("posts.is_hidden", false); // 숨겨진 게시물 제외
  
  // journeySlug 필터링
  if (journeySlug && missionInstanceIds.length > 0) {
    query = query.in("posts.mission_instance_id", missionInstanceIds);
  }
  
  // 생성일 기준 내림차순 정렬
  query = query.order("created_at", { ascending: false });
  
  const { data, error } = await query;
  
  if (error) {
    throw error;
  }
  
  // post_id가 null이 아닌 게시물만 필터링하고 posts 객체만 추출
  return data
    .filter(item => item.post_id !== null && item.posts !== null)
    .map(item => item.posts) ?? [];
}

async function getCompletedMissionIds(userId: number, journeySlug?: string) {
  if (!userId) return [];
  
  const supabase = createClient();
  
  let query = supabase
    .from("posts")
    .select("mission_instance_id")
    .eq("user_id", userId)
    .eq("is_hidden", false); // 숨겨진 게시물 제외
  
  // journeySlug가 제공된 경우 해당 journey의 게시물만 필터링
  if (journeySlug) {
    // mission_instance_id를 통해 journey와 연결
    const { data: missionInstances } = await supabase
      .from("journey_mission_instances")
      .select("id")
      .eq("journey_uuid", journeySlug);
    
    if (missionInstances && missionInstances.length > 0) {
      const instanceIds = missionInstances.map(instance => instance.id);
      query = query.in("mission_instance_id", instanceIds);
    } else {
      // 해당 journey에 대한 mission instance가 없으면 빈 결과 반환
      return [];
    }
  }
  
  const { data, error } = await query;
  
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

// 게시물 숨김 상태 변경 함수
async function togglePostHidden(postId: number, isHidden: boolean) {
  if (!postId) return null;
  
  const supabase = createClient();
  const { data, error } = await supabase
    .from("posts")
    .update({ is_hidden: isHidden })
    .eq("id", postId)
    .select("*")
    .single();
  
  if (error) {
    console.error("Error toggling post hidden state:", error);
    throw error;
  }
  
  return data;
}

// TODO: 1. ✅ 게시물 숨김 상태 갖고오기 및 다시 보이게 하기 기능 구현
// TODO: 2. ✅ 클라스 별로 게시물 볼 수 있게 쿼리 수정
// ✅ SWR을 사용한 usePosts 훅
export function usePosts(pageSize = 10, journeySlug?: string, showHidden = false) {
  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
    refetch
  } = useInfiniteQuery({
    queryKey: ['posts', journeySlug],
    queryFn: ({ pageParam }) => getPosts({ 
      pageParam: pageParam as number, 
      pageSize,
      journeySlug,
      showHidden
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
export function useMyPosts(journeySlug?: string) {
  const { id: userId } = useAuth();
  
  const { data, error, isLoading, mutate } = useSWR(
    userId ? `my-posts-${userId}-${journeySlug || ''}` : null,
    () => getMyPosts(userId as number, journeySlug),
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
export function useMyLikedPosts(journeySlug?: string) {
  const { id: userId } = useAuth();
  
  const { data, error, isLoading, mutate } = useSWR(
    userId ? `my-liked-posts-${userId}-${journeySlug || ''}` : null,
    () => getMyLikedPosts(userId as number, journeySlug),
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
export function useCompletedMissions(userId: number, journeySlug?: string) {
  const { data, error, isLoading, refetch } = useInfiniteQuery({
    queryKey: ['completed-missions', userId, journeySlug],
    queryFn: () => getCompletedMissionIds(userId, journeySlug),
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

// 게시물 숨김 상태 변경 훅
export function useTogglePostHidden() {
  return {
    toggleHidden: async (postId: number, isHidden: boolean) => {
      return await togglePostHidden(postId, isHidden);
    }
  };
}
