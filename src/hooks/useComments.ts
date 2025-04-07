import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { Comment, CreateComment } from "@/types/comments";
import { RealtimeChannel } from "@supabase/supabase-js";
import useSWR from "swr";

interface UseCommentsProps {
  postId: number;
  pageSize?: number;
}

// 전역 상태로 댓글 캐시 관리
const commentsCache: Record<string, Comment[]> = {};
// 최근 생성/삭제된 댓글 ID를 추적 (중복 처리 방지)
const recentlyProcessedIds = new Set<number>();

// 댓글을 가져오는 함수
async function fetchComments(postId: number, pageSize: number = 10): Promise<{
  comments: Comment[];
  count: number;
}> {
  if (!postId) return { comments: [], count: 0 };

  const supabase = createClient();

  const { data, error, count } = await supabase
    .from("comments")
    .select(
      `
      *,
      profiles:user_id (
        id,
        first_name,
        last_name,
        profile_image
      )
    `,
      { count: "exact" }
    )
    .eq("post_id", postId)
    .order("created_at", { ascending: false })
    .limit(pageSize);

  if (error) throw error;

  return {
    comments: data || [],
    count: count || 0,
  };
}

export function useComments({ postId, pageSize = 10 }: UseCommentsProps) {
  const { id: userId, profileImage, fullName } = useAuth();
  const supabase = createClient();
  const realtimeChannelRef = useRef<RealtimeChannel | null>(null);
  const mountedRef = useRef(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [loadedComments, setLoadedComments] = useState<Comment[]>([]);

  // SWR로 댓글 데이터 가져오기
  const {
    data,
    error: swrError,
    isLoading,
    isValidating,
    mutate,
  } = useSWR(
    postId ? [`comments-${postId}`, pageSize] : null,
    ([_, size]) => fetchComments(postId, size * page),
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1분 동안 중복 요청 방지
    }
  );

  // 데이터가 로드되면 상태 업데이트
  useEffect(() => {
    if (data?.comments) {
      setLoadedComments(data.comments);
    }
  }, [data]);

  // 댓글 생성 함수
  const createComment = useCallback(
    async (content: string) => {
      if (!userId || !postId || !mountedRef.current) {
        setError("로그인이 필요합니다.");
        return null;
      }

      // 낙관적 업데이트를 위한 임시 댓글 생성
      const tempId = Date.now();
      const [firstName, lastName] = fullName ? fullName.split(" ") : ["", ""];
      const optimisticComment: Comment = {
        id: tempId,
        content,
        user_id: userId,
        post_id: postId,
        created_at: new Date().toISOString(),
        updated_at: null,
        profiles: {
          id: userId,
          first_name: firstName,
          last_name: lastName,
          profile_image: profileImage,
        },
      };

      // 낙관적 업데이트 적용
      setLoadedComments(prev => [optimisticComment, ...prev]);

      try {
        const newComment: CreateComment = {
          content,
          user_id: userId,
          post_id: postId,
        };

        const { data: createdComment, error } = await supabase
          .from("comments")
          .insert(newComment)
          .select(
            `
          *,
          profiles:user_id (
            id,
            first_name,
            last_name,
            profile_image
          )
        `
          )
          .single();

        if (error) throw error;
        if (!mountedRef.current) return null;

        // 추가된 댓글 ID를 Set에 추가 (중복 처리 방지)
        if (createdComment?.id) {
          recentlyProcessedIds.add(createdComment.id);
          setTimeout(() => {
            recentlyProcessedIds.delete(createdComment.id);
          }, 5000); // 5초 후 제거
        }

        // 데이터 다시 불러오기
        mutate();

        return createdComment;
      } catch (err: any) {
        console.error("댓글 생성 오류:", err.message);

        if (mountedRef.current) {
          setError(err.message);
          // 데이터 다시 불러오기
          mutate();
        }
        return null;
      }
    },
    [userId, postId, fullName, profileImage, supabase, mutate]
  );

  // 댓글 삭제 함수
  const deleteComment = useCallback(
    async (commentId: number) => {
      if (!userId || !mountedRef.current) {
        setError("로그인이 필요합니다.");
        return false;
      }

      // 삭제할 댓글 찾기
      const commentToDelete = loadedComments.find(
        (comment) => comment.id === commentId
      );
      if (!commentToDelete) return false;

      // 낙관적 업데이트
      setLoadedComments(prev => prev.filter(comment => comment.id !== commentId));

      // 중복 처리 방지를 위해 ID 추가
      recentlyProcessedIds.add(commentId);
      setTimeout(() => {
        recentlyProcessedIds.delete(commentId);
      }, 5000); // 5초 후 제거

      try {
        const { error } = await supabase
          .from("comments")
          .delete()
          .eq("id", commentId)
          .eq("user_id", userId);

        if (error) throw error;

        // 데이터 다시 불러오기
        mutate();
        return true;
      } catch (err: any) {
        console.error("댓글 삭제 오류:", err.message);

        if (mountedRef.current) {
          setError(err.message);
          // 데이터 다시 불러오기
          mutate();
        }
        return false;
      }
    },
    [userId, supabase, loadedComments, mutate]
  );

  // 더 많은 댓글 불러오기
  const fetchNextPage = useCallback(() => {
    setPage(prev => prev + 1);
  }, []);

  // 실시간 구독 설정
  useEffect(() => {
    if (!postId) return;

    mountedRef.current = true;

    // 실시간 채널 설정
    const setupRealtimeSubscription = async () => {
      if (realtimeChannelRef.current) {
        await supabase.removeChannel(realtimeChannelRef.current);
      }

      const channel = supabase
        .channel(`comments-${postId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "comments",
            filter: `post_id=eq.${postId}`,
          },
          async (payload) => {
            if (!mountedRef.current || !payload.new) return;

            const commentId = payload.new.id;

            // 이미 처리한 댓글인지 확인
            if (recentlyProcessedIds.has(commentId)) return;

            // 새 댓글이 추가되면 데이터 다시 불러오기
            mutate();
          }
        )
        .on(
          "postgres_changes",
          {
            event: "DELETE",
            schema: "public",
            table: "comments",
            filter: `post_id=eq.${postId}`,
          },
          (payload) => {
            if (!mountedRef.current || !payload.old) return;

            const deletedId = (payload.old as Comment).id;

            // 이미 처리한 댓글인지 확인
            if (recentlyProcessedIds.has(deletedId)) return;

            // 댓글이 삭제되면 데이터 다시 불러오기
            mutate();
          }
        )
        .subscribe();

      realtimeChannelRef.current = channel;
    };

    setupRealtimeSubscription();

    // 클린업 함수
    return () => {
      mountedRef.current = false;
      if (realtimeChannelRef.current) {
        supabase.removeChannel(realtimeChannelRef.current);
      }
    };
  }, [postId, supabase, mutate]);

  // 다음 페이지가 있는지 여부 확인
  const hasNextPage = data?.count 
    ? data.count > loadedComments.length 
    : false;

  return {
    comments: loadedComments,
    count: data?.count || 0,
    loading: isLoading,
    error: error || (swrError ? String(swrError) : null),
    createComment,
    deleteComment,
    refreshComments: () => mutate(),
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage: isValidating && !isLoading,
  };
}
