import { 
  useSupabaseQuery,
  createCacheKey,
  createMutation
} from '../base/useSupabaseQuery';
import { useSupabaseAuth } from '../useSupabaseAuth';
import {
  getLikesCount,
  addLike,
  removeLike,
  getUserLike,
  LikesCountResponse
} from '@/utils/data/like';

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
    async () => {
      if (!postId) return 0;
      
      const result = await getLikesCount('likes-count', postId);
      return result.count;
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
    async () => {
      if (!postId || !userId) return null;
      
      const result = await getUserLike(null, { postId, userId });
      return result as Like | null;
    },
    {
      dedupingInterval: 10000, // 10초 동안 중복 요청 방지
    }
  );
}

// 좋아요 액션들
export function useLikeActionsRefactored() {
  const { id: userId } = useSupabaseAuth();

  // 좋아요 추가
  const addLikeMutation = createMutation<void, string>(
    async (postId) => {
      if (!userId || !postId) throw new Error('User ID and Post ID are required');
      
      await addLike({ postId, userId });
    },
    {
      revalidateKeys: ['likes-count', 'user-like']
    }
  );

  // 좋아요 제거
  const removeLikeMutation = createMutation<void, string>(
    async (postId) => {
      if (!userId || !postId) throw new Error('User ID and Post ID are required');
      
      await removeLike({ postId, userId });
    },
    {
      revalidateKeys: ['likes-count', 'user-like']
    }
  );

  // 좋아요 토글 (추가/제거)
  const toggleLikeMutation = createMutation<void, { postId: string; isLiked: boolean }>(
    async ({ postId, isLiked }) => {
      if (!userId || !postId) throw new Error('User ID and Post ID are required');
      
      if (isLiked) {
        await removeLike({ postId, userId });
      } else {
        await addLike({ postId, userId });
      }
    },
    {
      revalidateKeys: ['likes-count', 'user-like']
    }
  );

  return {
    addLike: addLikeMutation,
    removeLike: removeLikeMutation,
    toggleLike: toggleLikeMutation
  };
}

// 통합 좋아요 훅 (수와 상태를 함께 제공)
export function useLikeStatusRefactored(postId: string | null) {
  const likesCount = useLikesCountRefactored(postId);
  const userLike = useUserLikeRefactored(postId);
  const actions = useLikeActionsRefactored();

  const isLiked = !!userLike.data;
  const count = likesCount.data ?? 0;

  const toggleLike = () => {
    if (!postId) return;
    actions.toggleLike.mutate({ postId, isLiked });
  };

  return {
    count,
    isLiked,
    isLoading: likesCount.isLoading || userLike.isLoading,
    error: likesCount.error || userLike.error,
    toggleLike,
    isToggling: actions.toggleLike.isLoading || actions.addLike.isLoading || actions.removeLike.isLoading,
    actions
  };
}

// 편의 함수들
export function useToggleLikeRefactored(postId: string | null) {
  const { toggleLike, isToggling } = useLikeStatusRefactored(postId);
  return { toggleLike, isToggling };
}

export function useLikeCountRefactored(postId: string | null) {
  const { count, isLoading, error } = useLikesCountRefactored(postId);
  return { count, isLoading, error };
}