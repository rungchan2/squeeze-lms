import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { Comment, CreateComment } from "@/types/comments";
import { RealtimeChannel } from "@supabase/supabase-js";
import { useInfiniteQuery } from "@tanstack/react-query";

interface UseCommentsProps {
  postId: number;
  pageSize?: number;
}

// 댓글 페이지 결과 타입
interface CommentsPage {
  data: Comment[];
  nextPage: number | null;
  total: number;
}

// 전역 상태로 댓글 캐시 관리
const commentsCache: Record<string, Comment[]> = {};
// 최근 생성/삭제된 댓글 ID를 추적 (중복 처리 방지)
const recentlyProcessedIds = new Set<number>();

// 댓글을 페이지네이션으로 가져오는 함수
async function fetchCommentsPage({
  postId,
  pageParam = 0,
  pageSize = 10,
}: {
  postId: number;
  pageParam: number;
  pageSize: number;
}): Promise<CommentsPage> {
  if (!postId) return { data: [], nextPage: null, total: 0 };

  const supabase = createClient();
  const from = pageParam * pageSize;
  const to = from + pageSize - 1;

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
    .range(from, to);

  if (error) throw error;

  const hasNextPage = count ? from + pageSize < count : false;
  const nextPage = hasNextPage ? pageParam + 1 : null;

  return {
    data: data || [],
    nextPage,
    total: count || 0,
  };
}

export function useComments({ postId, pageSize = 10 }: UseCommentsProps) {
  const { id: userId, profileImage, fullName } = useAuth();
  const supabase = createClient();
  const realtimeChannelRef = useRef<RealtimeChannel | null>(null);
  const mountedRef = useRef(true);

  // React Query로 무한 스크롤 구현
  const {
    data,
    error: queryError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["comments", postId],
    queryFn: ({ pageParam }) =>
      fetchCommentsPage({
        postId,
        pageParam: pageParam as number,
        pageSize,
      }),
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
    enabled: !!postId,
  });

  // 모든 페이지의 댓글을 하나의 배열로 합치기
  const comments = data?.pages.flatMap((page) => page.data) || [];
  const count = data?.pages[0]?.total || 0;
  const [error, setError] = useState<string | null>(null);

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

      // 캐시 키
      const cacheKey = `comments-${postId}`;

      // 낙관적 업데이트 적용 (첫 페이지에만)
      const firstPageComments = data?.pages[0]?.data || [];
      const updatedFirstPage = [optimisticComment, ...firstPageComments];
      commentsCache[cacheKey] = updatedFirstPage;

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
        refetch();

        return createdComment;
      } catch (err: any) {
        console.error("댓글 생성 오류:", err.message);

        if (mountedRef.current) {
          setError(err.message);
          // 데이터 다시 불러오기
          refetch();
        }
        return null;
      }
    },
    [userId, postId, fullName, profileImage, supabase, data, refetch]
  );

  // 댓글 삭제 함수
  const deleteComment = useCallback(
    async (commentId: number) => {
      if (!userId || !mountedRef.current) {
        setError("로그인이 필요합니다.");
        return false;
      }

      // 삭제할 댓글 찾기
      const commentToDelete = comments.find(
        (comment) => comment.id === commentId
      );
      if (!commentToDelete) return false;

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
        refetch();
        return true;
      } catch (err: any) {
        console.error("댓글 삭제 오류:", err.message);

        if (mountedRef.current) {
          setError(err.message);
          // 데이터 다시 불러오기
          refetch();
        }
        return false;
      }
    },
    [userId, supabase, comments, refetch]
  );

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
            refetch();
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
            refetch();
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
  }, [postId, supabase, refetch]);

  return {
    comments,
    count,
    loading: status === "pending",
    error: error || (queryError ? String(queryError) : null),
    createComment,
    deleteComment,
    refreshComments: refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  };
}
