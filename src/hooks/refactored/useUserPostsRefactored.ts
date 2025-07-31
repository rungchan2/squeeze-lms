import { 
  useSupabaseQuery,
  createCacheKey
} from '../base/useSupabaseQuery';
import { useSupabaseAuth } from '../useSupabaseAuth';

// 게시물 유형 enum (usePosts2.ts 대응)
export enum PostType {
  MY_POSTS = 'my_posts',
  LIKED_POSTS = 'liked_posts',
}

interface Post {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  is_hidden: boolean;
  mission_instance_id?: string;
  journey_id?: string;
  profiles?: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    profile_image?: string;
  };
}

// 내 게시물 조회 훅 (usePosts2.ts의 getMyPosts 대응)
export function useMyPostsRefactored() {
  const { id: userId } = useSupabaseAuth();

  return useSupabaseQuery<Post[]>(
    userId ? createCacheKey('my-posts', { userId }) : null,
    async (supabase) => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles (
            id,
            email,
            first_name,
            last_name,
            profile_image
          )
        `)
        .eq('user_id', userId)
        .eq('is_hidden', false) // 숨겨진 게시물 제외
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as Post[];
    },
    {
      dedupingInterval: 60000, // 1분 동안 중복 요청 방지
    }
  );
}

// 내가 좋아요한 게시물 조회 훅 (usePosts2.ts의 getMyLikedPosts 대응)
export function useMyLikedPostsRefactored() {
  const { id: userId } = useSupabaseAuth();

  return useSupabaseQuery<Post[]>(
    userId ? createCacheKey('my-liked-posts', { userId }) : null,
    async (supabase) => {
      if (!userId) return [];

      const { data: likedPosts, error } = await supabase
        .from('likes')
        .select(`
          posts (
            *,
            profiles (
              id,
              email,
              first_name,
              last_name,
              profile_image
            )
          )
        `)
        .eq('user_id', userId)
        .eq('posts.is_hidden', false) // 숨겨진 게시물 제외
        .order('created_at', { ascending: false });

      if (error) throw error;

      // posts 객체 추출
      return (likedPosts || [])
        .map((item) => item.posts)
        .filter(Boolean) as Post[];
    },
    {
      dedupingInterval: 60000, // 1분 동안 중복 요청 방지
    }
  );
}

// 통합된 사용자 게시물 훅 (usePosts2.ts의 useLikedPosts 대응)
export function useLikedPostsRefactored(type: PostType = PostType.LIKED_POSTS) {
  const { id: userId } = useSupabaseAuth();

  const result = useSupabaseQuery<Post[]>(
    userId ? createCacheKey('user-posts', { userId, type }) : null,
    async (supabase) => {
      if (!userId) return [];

      if (type === PostType.MY_POSTS) {
        // 내 게시물 조회
        const { data, error } = await supabase
          .from('posts')
          .select(`
            *,
            profiles (
              id,
              email,
              first_name,
              last_name,
              profile_image
            )
          `)
          .eq('user_id', userId)
          .eq('is_hidden', false)
          .order('created_at', { ascending: false });

        if (error) throw error;
        return (data || []) as Post[];
      } else {
        // 내가 좋아요한 게시물 조회
        const { data: likedPosts, error } = await supabase
          .from('likes')
          .select(`
            posts (
              *,
              profiles (
                id,
                email,
                first_name,
                last_name,
                profile_image
              )
            )
          `)
          .eq('user_id', userId)
          .eq('posts.is_hidden', false)
          .order('created_at', { ascending: false });

        if (error) throw error;

        return (likedPosts || [])
          .map((item) => item.posts)
          .filter(Boolean) as Post[];
      }
    },
    {
      dedupingInterval: 60000, // 1분 동안 중복 요청 방지
    }
  );

  return {
    data: result.data || [],
    error: result.error,
    isLoading: result.isLoading,
    mutate: result.refetch,
    isEmpty: Array.isArray(result.data) && result.data.length === 0,
  };
}

// 사용자별 게시물 통계 훅
export function useUserPostStatsRefactored() {
  const { id: userId } = useSupabaseAuth();

  return useSupabaseQuery(
    userId ? createCacheKey('user-post-stats', { userId }) : null,
    async (supabase) => {
      if (!userId) return {};

      // 내 게시물 개수
      const { count: myPostsCount } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_hidden', false);

      // 내가 좋아요한 게시물 개수
      const { count: likedPostsCount } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      // 내 게시물이 받은 좋아요 총 개수
      const { count: receivedLikesCount } = await supabase
        .from('likes')
        .select('posts!inner(*)', { count: 'exact', head: true })
        .eq('posts.user_id', userId);

      // 내 게시물에 달린 댓글 총 개수
      const { count: receivedCommentsCount } = await supabase
        .from('comments')
        .select('posts!inner(*)', { count: 'exact', head: true })
        .eq('posts.user_id', userId);

      return {
        myPostsCount: myPostsCount || 0,
        likedPostsCount: likedPostsCount || 0,
        receivedLikesCount: receivedLikesCount || 0,
        receivedCommentsCount: receivedCommentsCount || 0,
      };
    },
    {
      dedupingInterval: 300000, // 5분 동안 중복 요청 방지
    }
  );
}

// 특정 사용자의 게시물 조회 훅 (다른 사용자 프로필 조회용)
export function useUserPostsByIdRefactored(targetUserId: string | null) {
  return useSupabaseQuery<Post[]>(
    targetUserId ? createCacheKey('user-posts-by-id', { targetUserId }) : null,
    async (supabase) => {
      if (!targetUserId) return [];

      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles (
            id,
            email,
            first_name,
            last_name,
            profile_image
          )
        `)
        .eq('user_id', targetUserId)
        .eq('is_hidden', false) // 숨겨진 게시물 제외
        .order('created_at', { ascending: false })
        .limit(20); // 최근 20개만

      if (error) throw error;
      return (data || []) as Post[];
    },
    {
      dedupingInterval: 60000, // 1분 동안 중복 요청 방지
    }
  );
}

// 여정별 내 게시물 조회 훅
export function useMyPostsByJourneyRefactored(journeyId: string | null) {
  const { id: userId } = useSupabaseAuth();

  return useSupabaseQuery<Post[]>(
    userId && journeyId 
      ? createCacheKey('my-posts-by-journey', { userId, journeyId }) 
      : null,
    async (supabase) => {
      if (!userId || !journeyId) return [];

      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles (
            id,
            email,
            first_name,
            last_name,
            profile_image
          )
        `)
        .eq('user_id', userId)
        .eq('journey_id', journeyId)
        .eq('is_hidden', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as Post[];
    },
    {
      dedupingInterval: 60000, // 1분 동안 중복 요청 방지
    }
  );
}