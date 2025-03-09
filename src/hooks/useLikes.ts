import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/utils/supabase/client";

// 타입 정의 개선
interface LikeParams {
  postId: number;
  userId: number;
}

interface LikesCountResponse {
  count: number;
}

// ✅ 좋아요 수만 가져오는 최적화된 함수
async function getLikesCount(postId: number): Promise<LikesCountResponse> {
  const { count, error } = await supabase
    .from("likes")
    .select("*", { count: "exact", head: true })
    .eq("post_id", postId);
  
  if (error) {
    throw error;
  }
  return { count: count || 0 };
}

// ✅ 좋아요 추가 함수
async function addLike({ postId, userId }: LikeParams): Promise<void> {
  
  // 이미 좋아요가 있는지 확인
  const existingLike = await getUserLike({ postId, userId });
  if (existingLike) {
    return; // 이미 좋아요가 있으면 중복 추가 방지
  }
  
  const { error } = await supabase
    .from("likes")
    .insert([{ post_id: postId, user_id: userId }]);
  
  
  if (error) {
    throw error;
  }
}

// ✅ 좋아요 삭제 함수
async function removeLike({ postId, userId }: LikeParams): Promise<void> {
  
  const { error } = await supabase
    .from("likes")
    .delete()
    .eq("post_id", postId)
    .eq("user_id", userId);
  
  if (error) {
    throw error;
  }
}

// ✅ 사용자가 좋아요 했는지 확인하는 함수 - 수정
async function getUserLike({ postId, userId }: LikeParams) {
  const { data, error } = await supabase
    .from("likes")
    .select("id")
    .eq("post_id", postId)
    .eq("user_id", userId)
    .maybeSingle();
  
  if (error) {
    throw error;
  }
  
  return data; // id가 있으면 좋아요 있음, null이면 없음
}

export function useLikes(postId: number) {
  const queryClient = useQueryClient();
  const likesCountQueryKey = ["likes-count", postId] as const;
  const userLikeQueryKeyPrefix = ["user-like", postId] as const;

  // ✅ 좋아요 수 조회 쿼리
  const {
    data: likesData,
    isLoading,
    error,
  } = useQuery({
    queryKey: likesCountQueryKey,
    queryFn: () => getLikesCount(postId),
    staleTime: 30000, // 30초 동안 캐시 유지 (최적화)
  });

  // ✅ 좋아요 추가 뮤테이션 (낙관적 업데이트) - 수정
  const { mutate: likeMutation } = useMutation({
    mutationFn: (params: LikeParams) => addLike(params),
    onMutate: async (params) => {
      // 좋아요 수 쿼리 취소
      await queryClient.cancelQueries({ queryKey: likesCountQueryKey });
      
      // 사용자 좋아요 상태 쿼리 취소
      const userLikeQueryKey = [...userLikeQueryKeyPrefix, params.userId];
      await queryClient.cancelQueries({ queryKey: userLikeQueryKey });
      
      // 이전 데이터 저장
      const previousLikesData = queryClient.getQueryData<LikesCountResponse>(likesCountQueryKey);
      
      // 낙관적 업데이트: 좋아요 수 증가
      queryClient.setQueryData(likesCountQueryKey, (old: LikesCountResponse | undefined) => ({
        count: (old?.count || 0) + 1
      }));
      
      // 낙관적 업데이트: 사용자 좋아요 상태 설정
      queryClient.setQueryData(userLikeQueryKey, { id: 'temp-id' });
      
      return { previousLikesData };
    },
    onError: (_, __, context) => {
      if (context?.previousLikesData) {
        queryClient.setQueryData(likesCountQueryKey, context.previousLikesData);
      }
    },
    onSettled: (_, __, params) => {
      // 좋아요 수 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: likesCountQueryKey });
      
      // 사용자 좋아요 상태 쿼리 무효화
      const userLikeQueryKey = [...userLikeQueryKeyPrefix, params.userId];
      queryClient.invalidateQueries({ queryKey: userLikeQueryKey });
    },
  });

  // ✅ 좋아요 취소 뮤테이션 (낙관적 업데이트) - 수정
  const { mutate: unlikeMutation } = useMutation({
    mutationFn: (params: LikeParams) => removeLike(params),
    onMutate: async (params) => {
      // 좋아요 수 쿼리 취소
      await queryClient.cancelQueries({ queryKey: likesCountQueryKey });
      
      // 사용자 좋아요 상태 쿼리 취소
      const userLikeQueryKey = [...userLikeQueryKeyPrefix, params.userId];
      await queryClient.cancelQueries({ queryKey: userLikeQueryKey });
      
      // 이전 데이터 저장
      const previousLikesData = queryClient.getQueryData<LikesCountResponse>(likesCountQueryKey);
      const previousUserLikeData = queryClient.getQueryData(userLikeQueryKey);
      
      // 낙관적 업데이트: 좋아요 수 감소
      queryClient.setQueryData(likesCountQueryKey, (old: LikesCountResponse | undefined) => ({
        count: Math.max((old?.count || 0) - 1, 0)
      }));
      
      // 낙관적 업데이트: 사용자 좋아요 상태 제거
      queryClient.setQueryData(userLikeQueryKey, null);
      
      return { 
        previousLikesData, 
        previousUserLikeData,
        params // params를 컨텍스트에 포함
      };
    },
    onError: (_, __, context) => {
      if (context?.previousLikesData) {
        queryClient.setQueryData(likesCountQueryKey, context.previousLikesData);
      }
      if (context?.previousUserLikeData) {
        const userLikeQueryKey = [...userLikeQueryKeyPrefix, context.params.userId];
        queryClient.setQueryData(userLikeQueryKey, context.previousUserLikeData);
      }
    },
    onSettled: (_, __, params) => {
      // 좋아요 수 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: likesCountQueryKey });
      
      // 사용자 좋아요 상태 쿼리 무효화
      const userLikeQueryKey = [...userLikeQueryKeyPrefix, params.userId];
      queryClient.invalidateQueries({ queryKey: userLikeQueryKey });
    },
  });

  // 클로저를 사용하여 postId를 미리 바인딩
  const onLike = (userId: number) => {
    likeMutation({ postId, userId });
  };

  const onUnlike = (userId: number) => {
    unlikeMutation({ postId, userId });
  };

  // ✅ 사용자가 좋아요 했는지 확인하는 쿼리 - 수정
  const useUserLike = (userId: number | null) => {
    return useQuery({
      queryKey: [...userLikeQueryKeyPrefix, userId],
      queryFn: () => userId ? getUserLike({ postId, userId }) : null,
      enabled: !!userId, // userId가 있을 때만 쿼리 실행
      staleTime: 30000, // 30초 동안 캐시 유지 (최적화)
    });
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
