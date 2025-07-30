import { 
  useSupabaseQuery,
  createCacheKey,
  createMutation
} from '../base/useSupabaseQuery';
import { useSupabaseAuth } from '../useSupabaseAuth';

interface Like {
  id: string;
  user_id: string;
  post_id: string;
  created_at: string;
}

// 좋아요 수 조회 훅
export function useLikesCountRefactored(postId: string | null) {
  return useSupabaseQuery<number>(
    postId ? createCacheKey('likes-count', { postId }) : null,
    async (supabase) => {
      if (!postId) return 0;

      const { count, error } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId);

      if (error) throw error;
      return count ?? 0;
    },
    {
      dedupingInterval: 30000, // 30초 동안 중복 요청 방지
    }
  );
}

// 사용자의 좋아요 상태 조회 훅
export function useUserLikeRefactored(postId: string | null) {
  const { id: userId } = useSupabaseAuth();

  return useSupabaseQuery<Like | null>(
    postId && userId 
      ? createCacheKey('user-like', { postId, userId })
      : null,
    async (supabase) => {
      if (!postId || !userId) return null;

      const { data, error } = await supabase
        .from('likes')
        .select('*')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      return data as Like | null;
    },
    {
      dedupingInterval: 30000, // 30초 동안 중복 요청 방지
    }
  );
}

// 좋아요 CRUD 작업 훅
export function useLikeActionsRefactored() {
  const { id: userId } = useSupabaseAuth();

  // 좋아요 추가
  const addLike = createMutation<Like, string>(
    async (supabase, postId) => {
      if (!userId) throw new Error('로그인이 필요합니다.');

      const { data, error } = await supabase
        .from('likes')
        .insert({
          user_id: userId,
          post_id: postId,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Like;
    },
    {
      revalidateKeys: ['likes-count', 'user-like'],
    }
  );

  // 좋아요 제거
  const removeLike = createMutation<boolean, string>(
    async (supabase, postId) => {
      if (!userId) throw new Error('로그인이 필요합니다.');

      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', userId);

      if (error) throw error;
      return true;
    },
    {
      revalidateKeys: ['likes-count', 'user-like'],
    }
  );

  // 좋아요 토글 (추가/제거)
  const toggleLike = createMutation<{ isLiked: boolean; like?: Like }, string>(
    async (supabase, postId) => {
      if (!userId) throw new Error('로그인이 필요합니다.');

      // 현재 좋아요 상태 확인
      const { data: existingLike } = await supabase
        .from('likes')
        .select('*')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .maybeSingle();

      if (existingLike) {
        // 좋아요가 있으면 제거
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('id', existingLike.id);

        if (error) throw error;
        return { isLiked: false };
      } else {
        // 좋아요가 없으면 추가
        const { data, error } = await supabase
          .from('likes')
          .insert({
            user_id: userId,
            post_id: postId,
          })
          .select()
          .single();

        if (error) throw error;
        return { isLiked: true, like: data as Like };
      }
    },
    {
      revalidateKeys: ['likes-count', 'user-like'],
    }
  );

  return {
    addLike,
    removeLike,
    toggleLike,
  };
}

// 게시물의 좋아요 목록 조회 훅 (관리자용 또는 상세 조회)
export function usePostLikesRefactored(postId: string | null) {
  return useSupabaseQuery<Like[]>(
    postId ? createCacheKey('post-likes', { postId }) : null,
    async (supabase) => {
      if (!postId) return [];

      const { data, error } = await supabase
        .from('likes')
        .select(`
          *,
          profiles (
            id,
            first_name,
            last_name,
            profile_image
          )
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as Like[];
    }
  );
}

// 전체 좋아요 정보를 포함한 통합 훅
export function useLikesRefactored(postId: string | null) {
  const likesCount = useLikesCountRefactored(postId);
  const userLike = useUserLikeRefactored(postId);
  const actions = useLikeActionsRefactored();

  return {
    // 좋아요 수
    likesCount: likesCount.data ?? 0,
    likesCountLoading: likesCount.isLoading,
    likesCountError: likesCount.error,

    // 사용자 좋아요 상태
    isLiked: !!userLike.data,
    userLike: userLike.data,
    userLikeLoading: userLike.isLoading,
    userLikeError: userLike.error,

    // 액션들
    addLike: actions.addLike,
    removeLike: actions.removeLike,
    toggleLike: actions.toggleLike,

    // 캐시 갱신
    refetch: () => {
      likesCount.refetch();
      userLike.refetch();
    },
  };
}