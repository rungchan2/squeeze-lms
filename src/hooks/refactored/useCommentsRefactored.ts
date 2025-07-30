import { useMemo, useRef, useCallback } from 'react';
import { 
  useSupabaseInfiniteQuery,
  createCacheKey,
  createMutation,
  PaginatedResponse
} from '../base/useSupabaseQuery';
import { useSupabaseAuth } from '../useSupabaseAuth';
import { Comment } from '@/types';

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
    async (supabase, pageIndex, pageSize) => {
      if (!postId) throw new Error('Post ID is required');

      const from = pageIndex * pageSize;
      const to = from + pageSize - 1;

      const { data, error, count } = await supabase
        .from('comments')
        .select(`
          *,
          profiles (
            id,
            first_name,
            last_name,
            profile_image
          )
        `, { count: 'exact' })
        .eq('post_id', postId)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      const hasNextPage = count ? from + pageSize < count : false;
      const nextPage = hasNextPage ? pageIndex + 1 : null;

      return {
        data: (data || []) as Comment[],
        nextPage,
        total: count ?? 0,
      };
    },
    pageSize
  );

  // 최신 댓글이 먼저 표시되도록 정렬
  const sortedComments = useMemo(() => 
    result.data.slice().sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    ),
    [result.data]
  );

  return {
    comments: sortedComments,
    error: result.error,
    isLoading: result.isLoading,
    fetchNextPage: result.loadMore,
    hasNextPage: result.hasNextPage,
    isFetchingNextPage: result.isLoadingMore,
    mutate: result.refetch,
    total: result.total,
  };
}

// 댓글 CRUD 작업 훅
export function useCommentActionsRefactored() {
  const { id: userId } = useSupabaseAuth();

  // 댓글 생성
  const createComment = createMutation<Comment, { content: string; postId: string }>(
    async (supabase, { content, postId }) => {
      if (!userId) throw new Error('로그인이 필요합니다.');

      const { data, error } = await supabase
        .from('comments')
        .insert({
          content,
          user_id: userId,
          post_id: postId,
        })
        .select(`
          *,
          profiles (
            id,
            first_name,
            last_name,
            profile_image
          )
        `)
        .single();

      if (error) throw error;
      return data as Comment;
    },
    {
      revalidateKeys: ['comments'],
    }
  );

  // 댓글 업데이트
  const updateComment = createMutation<Comment, { commentId: string; content: string }>(
    async (supabase, { commentId, content }) => {
      if (!userId) throw new Error('로그인이 필요합니다.');

      const { data, error } = await supabase
        .from('comments')
        .update({ 
          content,
          updated_at: new Date().toISOString()
        })
        .eq('id', commentId)
        .eq('user_id', userId) // 작성자만 수정 가능
        .select(`
          *,
          profiles (
            id,
            first_name,
            last_name,
            profile_image
          )
        `)
        .single();

      if (error) throw error;
      return data as Comment;
    },
    {
      revalidateKeys: ['comments'],
    }
  );

  // 댓글 삭제
  const deleteComment = createMutation<boolean, string>(
    async (supabase, commentId) => {
      if (!userId) throw new Error('로그인이 필요합니다.');

      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', userId); // 작성자만 삭제 가능

      if (error) throw error;
      return true;
    },
    {
      revalidateKeys: ['comments'],
    }
  );

  return {
    createComment,
    updateComment,
    deleteComment,
  };
}

// 단일 댓글 조회 훅
export function useCommentRefactored(commentId: string | null) {
  const { id: userId } = useSupabaseAuth();

  return useSupabaseQuery<Comment>(
    commentId ? createCacheKey('comment', { commentId }) : null,
    async (supabase) => {
      if (!commentId) throw new Error('Comment ID is required');

      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          profiles (
            id,
            first_name,
            last_name,
            profile_image
          )
        `)
        .eq('id', commentId)
        .single();

      if (error) throw error;
      return data as Comment;
    }
  );
}

// 실시간 댓글 구독 훅
export function useCommentSubscriptionRefactored(
  postId: string | null,
  onNewComment?: (comment: Comment) => void,
  onCommentUpdate?: (comment: Comment) => void,
  onCommentDelete?: (commentId: string) => void
) {
  const { id: userId } = useSupabaseAuth();
  const { refetch } = useCommentsRefactored(postId);

  useSupabaseQuery(
    postId ? `comment-subscription:${postId}` : null,
    async (supabase) => {
      if (!postId) return null;

      const subscription = supabase
        .channel(`comments:${postId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'comments',
            filter: `post_id=eq.${postId}`,
          },
          (payload) => {
            const newComment = payload.new as Comment;
            onNewComment?.(newComment);
            refetch();
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'comments',
            filter: `post_id=eq.${postId}`,
          },
          (payload) => {
            const updatedComment = payload.new as Comment;
            onCommentUpdate?.(updatedComment);
            refetch();
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'comments',
            filter: `post_id=eq.${postId}`,
          },
          (payload) => {
            const deletedComment = payload.old as Comment;
            onCommentDelete?.(deletedComment.id);
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