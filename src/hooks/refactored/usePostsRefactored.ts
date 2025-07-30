import { useMemo } from 'react';
import { 
  useSupabaseInfiniteQuery, 
  useSupabaseQuery,
  createCacheKey,
  PaginatedResponse 
} from '../base/useSupabaseQuery';
import { useSupabaseAuth } from '../useSupabaseAuth';
import { PostWithRelations } from '@/types';

interface PostsQueryParams {
  journeySlug?: string;
  showHidden?: boolean;
  userId?: string;
  pageSize?: number;
}

// 메인 게시물 페이지네이션 훅 (usePosts.ts 대응)
export function usePostsRefactored({
  journeySlug,
  showHidden = false,
  userId,
  pageSize = 10,
}: PostsQueryParams = {}) {
  
  const getKey = (pageIndex: number, previousPageData: PaginatedResponse<PostWithRelations> | null) => {
    if (previousPageData === null || previousPageData.nextPage !== null) {
      return createCacheKey('posts', {
        journey: journeySlug || 'all',
        hidden: showHidden ? 'hidden' : 'visible',
        user: userId || 'all',
        page: pageIndex,
        size: pageSize,
      });
    }
    return null;
  };

  const result = useSupabaseInfiniteQuery<PostWithRelations>(
    getKey,
    async (supabase, pageIndex, pageSize) => {
      const from = pageIndex * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from('posts')
        .select(`
          *,
          profiles (
            id, email, first_name, last_name, organization_id, profile_image, created_at,
            organizations (
              id, name
            )
          ),
          teams (
            id, name
          ),
          journey_mission_instances!mission_instance_id (
            id,
            journey_week_id,
            missions (
              id, name, description, points, mission_type
            )
          )
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      // 조건부 필터 적용
      if (!showHidden) {
        query = query.eq('is_hidden', false);
      }
      if (journeySlug) {
        query = query.eq('journey_id', journeySlug);
      }
      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      const hasNextPage = count ? from + pageSize < count : false;
      const nextPage = hasNextPage ? pageIndex + 1 : null;

      return {
        data: (data || []) as PostWithRelations[],
        nextPage,
        total: count ?? 0,
      };
    },
    pageSize
  );

  return {
    data: result.data,
    error: result.error,
    isLoading: result.isLoading,
    isFetchingNextPage: result.isLoadingMore,
    fetchNextPage: result.loadMore,
    hasNextPage: result.hasNextPage,
    refetch: result.refetch,
    total: result.total,
  };
}

// 완료된 미션 ID 조회 훅
export function useCompletedMissionsRefactored(userId: string | null, journeySlug?: string) {
  const cacheKey = useMemo(() => 
    userId ? createCacheKey('completed-missions', { userId, journeySlug }) : null,
    [userId, journeySlug]
  );

  const result = useSupabaseQuery<string[]>(
    cacheKey,
    async (supabase) => {
      if (!userId) return [];

      // 1. posts에서 완료된 미션 확인
      let postsQuery = supabase
        .from('posts')
        .select('mission_instance_id')
        .eq('user_id', userId)
        .eq('is_hidden', false)
        .not('mission_instance_id', 'is', null);

      // journeySlug 필터링
      if (journeySlug) {
        const { data: missionInstances } = await supabase
          .from('journey_mission_instances')
          .select('id')
          .eq('journey_id', journeySlug);

        if (missionInstances && missionInstances.length > 0) {
          const instanceIds = missionInstances.map(instance => instance.id);
          postsQuery = postsQuery.in('mission_instance_id', instanceIds);
        } else {
          return [];
        }
      }

      const { data: postsData, error: postsError } = await postsQuery;
      if (postsError) throw postsError;

      // 2. user_points에서도 확인
      const { data: pointsData, error: pointsError } = await supabase
        .from('user_points')
        .select('mission_instance_id')
        .eq('profile_id', userId)
        .not('mission_instance_id', 'is', null);

      if (pointsError) throw pointsError;

      // 중복 제거하여 병합
      const completedFromPosts = (postsData || [])
        .map(post => post.mission_instance_id as string);
      
      const completedFromPoints = (pointsData || [])
        .map(point => point.mission_instance_id as string);

      return [...new Set([...completedFromPosts, ...completedFromPoints])];
    },
    {
      dedupingInterval: 5 * 60 * 1000, // 5분
    }
  );

  return {
    completedMissionIds: result.data || [],
    error: result.error,
    isLoading: result.isLoading,
    refetch: result.refetch,
  };
}

// 개별 포스트 조회
export function usePostByIdRefactored(postId: string | null) {
  return useSupabaseQuery<PostWithRelations>(
    postId ? createCacheKey('post', { postId }) : null,
    async (supabase) => {
      if (!postId) throw new Error('Post ID is required');

      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles (
            id, email, first_name, last_name, organization_id, profile_image, created_at,
            organizations (
              id, name
            )
          ),
          teams (
            id, name
          ),
          journey_mission_instances!mission_instance_id (
            id,
            journey_week_id,
            missions (
              id, name, description, points, mission_type,
              mission_questions (*)
            )
          ),
          comments (
            id,
            content,
            created_at,
            user_id,
            profiles (
              id, email, first_name, last_name, profile_image
            )
          ),
          likes (
            id,
            user_id
          )
        `)
        .eq('id', postId)
        .single();

      if (error) throw error;
      return data as PostWithRelations;
    }
  );
}

// 실시간 게시물 구독 훅
export function usePostsRealtimeRefactored(
  journeySlug?: string,
  onNewPost?: (post: PostWithRelations) => void,
  onPostUpdate?: (post: PostWithRelations) => void,
  onPostDelete?: (postId: string) => void
) {
  const { refetch } = usePostsRefactored({ journeySlug });

  useSupabaseQuery(
    journeySlug ? `posts-realtime:${journeySlug}` : 'posts-realtime:all',
    async (supabase) => {
      const channelName = journeySlug ? `posts:${journeySlug}` : 'posts:all';
      
      let subscription = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'posts',
            filter: journeySlug ? `journey_id=eq.${journeySlug}` : undefined,
          },
          (payload) => {
            const newPost = payload.new as PostWithRelations;
            onNewPost?.(newPost);
            refetch();
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'posts',
            filter: journeySlug ? `journey_id=eq.${journeySlug}` : undefined,
          },
          (payload) => {
            const updatedPost = payload.new as PostWithRelations;
            onPostUpdate?.(updatedPost);
            refetch();
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'posts',
            filter: journeySlug ? `journey_id=eq.${journeySlug}` : undefined,
          },
          (payload) => {
            const deletedPost = payload.old as PostWithRelations;
            onPostDelete?.(deletedPost.id);
            refetch();
          }
        )
        .subscribe();

      // Cleanup 함수 반환
      return () => {
        subscription.unsubscribe();
      };
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );
}