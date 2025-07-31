import { useMemo, useRef, useCallback } from 'react';
import { 
  useSupabaseInfiniteQuery,
  createCacheKey,
  createMutation,
  PaginatedResponse,
  useSupabaseQuery
} from '../base/useSupabaseQuery';
import { useSupabaseAuth } from '../useSupabaseAuth';
import { Comment, CreateComment, UpdateComment } from '@/types';
import {
  getComments,
  getCommentsNumber,
  createComment,
  deleteComment,
  updateComment,
  getCommentById,
  addChannel,
  removeChannel
} from '@/utils/data/comment';

// 댓글 무한 스크롤 조회 훅
export function useCommentsRefactored(postId: string | null, pageSize = 10) {
  const { id: userId } = useSupabaseAuth();
  const recentlyProcessedIds = useRef<Set<string>>(new Set());

  const getKey = (pageIndex: number, previousPageData: PaginatedResponse<Comment> | null) => {
    if (!postId) return null;
    
    if (previousPageData === null || previousPageData.nextPage !== null) {
      return createCacheKey('comments', { 
        postId, 
        page: pageIndex,
        size: pageSize 
      });
    }
    return null;
  };

  const result = useSupabaseInfiniteQuery<Comment>(
    getKey,
    async (pageIndex, pageSize) => {
      if (!postId) throw new Error('Post ID is required');

      const { data, count } = await getComments(postId, pageSize, pageIndex + 1);
      
      const hasNextPage = count ? (pageIndex + 1) * pageSize < count : false;
      const nextPage = hasNextPage ? pageIndex + 1 : null;

      return {
        data: data as Comment[],
        nextPage,
        total: count ?? 0
      };
    },
    pageSize
  );

  const comments = useMemo(() => result.data || [], [result.data]);

  const addToRecentlyProcessed = useCallback((id: string) => {
    recentlyProcessedIds.current.add(id);
    setTimeout(() => {
      recentlyProcessedIds.current.delete(id);
    }, 5000);
  }, []);

  return {
    ...result,
    comments,
    addToRecentlyProcessed,
    recentlyProcessedIds: recentlyProcessedIds.current
  };
}

// 댓글 수 조회 훅
export function useCommentsCountRefactored(postId: string | null) {
  return useSupabaseQuery<number>(
    postId ? createCacheKey('comments-count', { postId }) : null,
    async () => {
      if (!postId) return 0;
      return await getCommentsNumber(postId);
    }
  );
}

// 단일 댓글 조회 훅
export function useCommentRefactored(commentId: string | null) {
  return useSupabaseQuery<Comment>(
    commentId ? createCacheKey('comment', { commentId }) : null,
    async () => {
      if (!commentId) throw new Error('Comment ID is required');
      const data = await getCommentById(commentId);
      return data?.[0] as Comment;
    }
  );
}

// 댓글 CRUD 액션들
export function useCommentActionsRefactored() {
  // 댓글 생성
  const createCommentMutation = createMutation<Comment, CreateComment>(
    async (commentData) => {
      const result = await createComment(commentData);
      return result as Comment;
    },
    {
      revalidateKeys: ['comments', 'comments-count']
    }
  );

  // 댓글 수정
  const updateCommentMutation = createMutation<any, { commentId: string; updates: UpdateComment }>(
    async ({ commentId, updates }) => {
      const result = await updateComment(commentId, updates);
      return result;
    },
    {
      revalidateKeys: ['comments', 'comment']
    }
  );

  // 댓글 삭제
  const deleteCommentMutation = createMutation<any, string>(
    async (commentId) => {
      const result = await deleteComment(commentId);
      return result;
    },
    {
      revalidateKeys: ['comments', 'comment', 'comments-count']
    }
  );

  return {
    createComment: createCommentMutation,
    updateComment: updateCommentMutation,
    deleteComment: deleteCommentMutation
  };
}

// 실시간 댓글 업데이트 훅
export function useRealTimeCommentsRefactored(
  postId: string | null,
  mountedRef: React.RefObject<boolean>,
  onUpdate: () => void
) {
  const recentlyProcessedIds = useRef<Set<string>>(new Set());
  const channelRef = useRef<any>(null);

  const subscribeToComments = useCallback(async () => {
    if (!postId || channelRef.current) return;

    try {
      const channel = await addChannel(
        postId,
        mountedRef,
        recentlyProcessedIds.current,
        onUpdate
      );
      channelRef.current = channel;
    } catch (error) {
      console.error('Failed to subscribe to comments:', error);
    }
  }, [postId, mountedRef, onUpdate]);

  const unsubscribeFromComments = useCallback(async () => {
    if (channelRef.current) {
      try {
        await removeChannel(channelRef.current);
        channelRef.current = null;
      } catch (error) {
        console.error('Failed to unsubscribe from comments:', error);
      }
    }
  }, []);

  return {
    subscribeToComments,
    unsubscribeFromComments,
    recentlyProcessedIds: recentlyProcessedIds.current
  };
}

// 편의 함수들
export function useCreateCommentRefactored() {
  const actions = useCommentActionsRefactored();
  return actions.createComment;
}

export function useDeleteCommentRefactored() {
  const actions = useCommentActionsRefactored();
  return actions.deleteComment;
}