import { useEffect, useRef, useCallback } from "react";
import useSWRInfinite from "swr/infinite";
import { useAuth } from "@/components/AuthProvider";
import { Comment, CreateComment } from "@/types/comments";
import { RealtimeChannel } from "@supabase/supabase-js";
import {
  getComments,
  createComment as createCommentApi,
  deleteComment as deleteCommentApi,
  updateComment as updateCommentApi,
  addChannel,
  removeChannel,
} from "@/utils/data/comment";

interface UseCommentsProps {
  postId: number;
  pageSize?: number;
  enableRealtime?: boolean; // 실시간 업데이트 활성화 여부
}

// 페이지 데이터 타입 정의
interface PageData {
  data: Comment[];
  count: number | null;
}

export function useComments({ 
  postId, 
  pageSize = 10, 
  enableRealtime = false // 기본값은 false로 설정 
}: UseCommentsProps) {
  const { id: userId } = useAuth();
  
  const recentlyProcessedIds = useRef<Set<number>>(new Set());
  const channelRef = useRef<RealtimeChannel | null>(null);
  const mountedRef = useRef(true);
  const isSettingUpRef = useRef(false);

  // SWR 키 생성 함수 - 페이지 인덱스를 받아 API 요청에 필요한 키를 반환
  const getKey = (pageIndex: number, previousPageData: PageData | null) => {
    // 이전 페이지 데이터가 없거나 빈 배열이면 더 이상 데이터가 없는 것
    if (previousPageData && !previousPageData.data?.length) return null;
    
    // 첫 번째 페이지는 인덱스가 0이지만 API는 1부터 시작하므로 +1
    return [postId, pageIndex + 1, pageSize];
  };

  // 페치 함수 - SWR 키로부터 실제 데이터를 가져옴
  const fetcher = async ([postId, page, pageSize]: [number, number, number]) => {
    const response = await getComments(postId, pageSize, page);
    return response;
  };

  // useSWRInfinite 훅 사용
  const {
    data: pagesData,
    error,
    size,
    setSize,
    isLoading,
    isValidating,
    mutate,
  } = useSWRInfinite<PageData>(getKey, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 5000,
    persistSize: true,
  });

  // 다음 페이지 로드
  const fetchNextPage = useCallback(() => {
    if (!isValidating && pagesData && pagesData[pagesData.length - 1]?.data?.length === pageSize) {
      setSize(size + 1);
    }
  }, [isValidating, pagesData, pageSize, setSize, size]);

  // 데이터 플랫화 및 가공
  const comments = pagesData 
    ? pagesData.flatMap(page => page?.data || [])
    : [];
  
  const totalCount = pagesData && pagesData[0]?.count ? pagesData[0].count : 0;
  const hasMore = pagesData && pagesData[pagesData.length - 1]?.data?.length === pageSize;
  const isFetchingNextPage = size > 1 && isValidating;

  // 댓글 새로고침
  const refreshComments = useCallback(() => {
    mutate();
  }, [mutate]);

  // 댓글 생성 함수
  const createComment = useCallback(async (content: string) => {
    if (!userId || !postId) {
      throw new Error("로그인이 필요합니다.");
    }

    try {
      // 임시 ID 생성 (낙관적 업데이트용)
      const tempId = Date.now();
      const tempComment: Comment = {
        id: tempId,
        content,
        user_id: userId,
        post_id: postId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        profiles: {
          id: userId,
          first_name: "",
          last_name: "",
          profile_image: "",
        }
      };

      // recentlyProcessedIds에 추가
      recentlyProcessedIds.current.add(tempId);

      // 낙관적 업데이트
      mutate(async (currentPages) => {
        if (!currentPages || currentPages.length === 0) {
          return [{ data: [tempComment], count: 1 }];
        }
        
        // 기존 페이지 복사
        const updatedPages = [...currentPages];
        
        // 첫 번째 페이지에 새 댓글 추가
        if (updatedPages[0]) {
          const firstPage = { ...updatedPages[0] };
          firstPage.data = [tempComment, ...(firstPage.data || [])];
          
          // count가 null이 아닌 경우에만 증가
          if (firstPage.count !== null) {
            firstPage.count = (firstPage.count || 0) + 1;
          }
          
          updatedPages[0] = firstPage;
        }
        
        return updatedPages;
      }, false);

      // 실제 API 호출
      const newComment: CreateComment = {
        content,
        user_id: userId,
        post_id: postId,
      };

      const createdComment = await createCommentApi(newComment);
      
      // recentlyProcessedIds에 실제 ID 추가 (실시간 이벤트 처리 시 중복 방지)
      recentlyProcessedIds.current.add(createdComment.id);
      setTimeout(() => {
        recentlyProcessedIds.current.delete(tempId);
        recentlyProcessedIds.current.delete(createdComment.id);
      }, 5000);

      // 새로운 데이터로 갱신
      mutate();
      
      return createdComment;
    } catch (err: any) {
      console.error("댓글 생성 오류:", err.message);
      // 오류 발생 시 캐시를 다시 원래대로 되돌림
      mutate();
      throw err;
    }
  }, [userId, postId, mutate]);

  // 댓글 삭제 함수
  const deleteComment = useCallback(async (commentId: number) => {
    if (!userId) {
      throw new Error("로그인이 필요합니다.");
    }

    try {
      // recentlyProcessedIds에 추가
      recentlyProcessedIds.current.add(commentId);

      // 낙관적 업데이트
      mutate(async (currentPages) => {
        if (!currentPages) return currentPages;
        
        // 모든 페이지에서 해당 댓글 제거
        const updatedPages = currentPages.map(page => {
          if (!page || !page.data) return page;
          
          return {
            ...page,
            data: page.data.filter(comment => comment.id !== commentId),
            // count가 null이 아닌 경우에만 감소
            count: page.count !== null ? page.count - 1 : page.count
          };
        });
        
        return updatedPages;
      }, false);

      // 실제 API 호출
      await deleteCommentApi(commentId);

      // 일정 시간 후 ID 제거
      setTimeout(() => {
        recentlyProcessedIds.current.delete(commentId);
      }, 5000);

      // 새로운 데이터로 갱신
      mutate();
      
      return true;
    } catch (err: any) {
      console.error("댓글 삭제 오류:", err.message);
      // 오류 발생 시 캐시를 다시 원래대로 되돌림
      mutate();
      return false;
    }
  }, [userId, mutate]);

  // 댓글 수정 함수
  const updateComment = useCallback(async (commentId: number, content: string) => {
    if (!userId) {
      throw new Error("로그인이 필요합니다.");
    }

    try {
      // recentlyProcessedIds에 추가
      recentlyProcessedIds.current.add(commentId);

      // 낙관적 업데이트
      mutate(async (currentPages) => {
        if (!currentPages) return currentPages;
        
        // 모든 페이지에서 해당 댓글 업데이트
        const updatedPages = currentPages.map(page => {
          if (!page || !page.data) return page;
          
          return {
            ...page,
            data: page.data.map(comment => 
              comment.id === commentId 
                ? { ...comment, content, updated_at: new Date().toISOString() } 
                : comment
            )
          };
        });
        
        return updatedPages;
      }, false);

      // 실제 API 호출
      await updateCommentApi(commentId, { content });

      // 일정 시간 후 ID 제거
      setTimeout(() => {
        recentlyProcessedIds.current.delete(commentId);
      }, 5000);

      // 새로운 데이터로 갱신
      mutate();
      
      return true;
    } catch (err: any) {
      console.error("댓글 수정 오류:", err.message);
      // 오류 발생 시 캐시를 다시 원래대로 되돌림
      mutate();
      return false;
    }
  }, [userId, mutate]);

  // 실시간 구독 설정 - enableRealtime 옵션에 따라 활성화
  useEffect(() => {
    if (!postId || !enableRealtime) return; // enableRealtime이 false면 실시간 구독하지 않음

    mountedRef.current = true;

    const setupChannel = async () => {
      // 이미 설정 중이면 중복 실행 방지
      if (isSettingUpRef.current) return;
      isSettingUpRef.current = true;

      try {
        // 기존 채널이 있으면 제거
        if (channelRef.current) {
          await removeChannel(channelRef.current);
          channelRef.current = null;
        }

        // 새 채널 설정
        const channel = await addChannel(
          postId,
          mountedRef,
          recentlyProcessedIds.current,
          () => mutate()  // 실시간 업데이트 시 캐시 갱신
        );

        // 컴포넌트가 언마운트되지 않았으면 채널 저장
        if (mountedRef.current) {
          channelRef.current = channel;
        } else {
          // 설정 도중 언마운트된 경우 채널 정리
          removeChannel(channel);
        }
      } catch (error) {
        console.error("실시간 구독 설정 실패:", error);
      } finally {
        isSettingUpRef.current = false;
      }
    };

    setupChannel();

    return () => {
      // 컴포넌트 언마운트 표시
      mountedRef.current = false;
      
      // 컴포넌트 언마운트 시 채널 제거
      if (channelRef.current) {
        removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [postId, enableRealtime]); // enableRealtime 의존성 추가

  return {
    comments,
    count: totalCount,
    loading: isLoading,
    error,
    hasMore,
    isFetchingNextPage: isFetchingNextPage,
    createComment,
    deleteComment,
    updateComment,
    refreshComments,
    fetchNextPage,
  };
}
