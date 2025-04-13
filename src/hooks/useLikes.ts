import useSWR, { useSWRConfig } from 'swr';
import { useState, useCallback } from 'react';
import { getLikesCount, addLike, removeLike , getUserLike} from '@/utils/data/like';
import { LikesCountResponse } from '@/utils/data/like';

export function useLikes(postId: string) {
  const { mutate } = useSWRConfig();
  const [isLikeLoading, setIsLikeLoading] = useState(false);
  const [isUnlikeLoading, setIsUnlikeLoading] = useState(false);
  
  const likesCountKey = `likes-count-${postId}`;
  const getUserLikeKey = (userId: string) => `user-like-${postId}-${userId}`;

  // ✅ 좋아요 수 조회 쿼리
  const {
    data: likesData,
    isLoading,
    error,
  } = useSWR(
    [likesCountKey, postId],
    ([key, id]) => getLikesCount(key, id),
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000, // 30초 동안 중복 요청 방지
    }
  );

  // ✅ 좋아요 추가 함수 (낙관적 업데이트)
  const onLike = useCallback(async (userId: string) => {
    if (!userId || !postId || isLikeLoading) {
      console.log("[onLike] 필수 매개변수 누락 또는 이미 로딩 중", { userId, postId, isLikeLoading });
      return;
    }
    
    setIsLikeLoading(true);
    
    try {
      // 현재 캐시 데이터
      const userLikeKey = getUserLikeKey(userId);
      const currentLikesData = await mutate(
        [likesCountKey, postId],
        (data: LikesCountResponse | undefined) => ({
          count: (data?.count || 0) + 1
        }),
        false // 재검증 안함
      );
      
      // 사용자 좋아요 상태 업데이트
      await mutate(
        [userLikeKey, { postId, userId }],
        { id: 'temp-id' },
        false // 재검증 안함
      );
      
    
      // 실제 API 호출
      await addLike({ postId, userId });
      
      // 전체 캐시 갱신
      await Promise.all([
        mutate([likesCountKey, postId]),
        mutate([userLikeKey, { postId, userId }])
      ]);
    } catch (error) {
      // 실패 시 원래 데이터로 롤백 (재검증)
      await Promise.all([
        mutate([likesCountKey, postId]),
        mutate([getUserLikeKey(userId), { postId, userId }])
      ]);
      console.error("[onLike] 좋아요 추가 실패:", error);
    } finally {
      setIsLikeLoading(false);
    }
  }, [postId, mutate, isLikeLoading, getUserLikeKey, likesCountKey]);

  // ✅ 좋아요 취소 함수 (낙관적 업데이트)
  const onUnlike = useCallback(async (userId: string) => {
    if (!userId || !postId || isUnlikeLoading) {
      return;
    }
    
    setIsUnlikeLoading(true);
    
    try {
      // 현재 캐시 데이터
      const userLikeKey = getUserLikeKey(userId);
      
      // 낙관적 업데이트: 좋아요 수 감소
      await mutate(
        [likesCountKey, postId],
        (data: LikesCountResponse | undefined) => ({
          count: Math.max((data?.count || 0) - 1, 0)
        }),
        false // 재검증 안함
      );
      
      // 사용자 좋아요 상태 업데이트
      await mutate(
        [userLikeKey, { postId, userId }],
        null,
        false // 재검증 안함
      );
      
      // 실제 API 호출
      await removeLike({ postId, userId });
      
      // 전체 캐시 갱신
      await Promise.all([
        mutate([likesCountKey, postId]),
        mutate([userLikeKey, { postId, userId }])
      ]);
    } catch (error) {
      // 실패 시 원래 데이터로 롤백 (재검증)
      await Promise.all([
        mutate([likesCountKey, postId]),
        mutate([getUserLikeKey(userId), { postId, userId }])
      ]);
      console.error("[onUnlike] 좋아요 취소 실패:", error);
    } finally {
      setIsUnlikeLoading(false);
    }
  }, [postId, mutate, isUnlikeLoading]);

  // ✅ 사용자가 좋아요 했는지 확인하는 훅
  const useUserLike = (userId: string | null) => {
    return useSWR(
      userId ? [getUserLikeKey(userId), { postId, userId }] : null,
      ([key, params]) => {
        if (!params || !params.postId || !params.userId) {
          console.log("[useUserLike] 필수 매개변수 누락", { key, params });
          return null;
        }
        return getUserLike(key, params);
      },
      {
        revalidateOnFocus: false,
        dedupingInterval: 30000, // 30초 동안 중복 요청 방지
        errorRetryCount: 2,
        onError: (err) => {
          console.error("[useUserLike] 에러 발생:", err);
        }
      }
    );
  };

  return { 
    likesCount: likesData?.count || 0, 
    isLoading, 
    error, 
    onLike, 
    onUnlike,
    useUserLike
  };
}
