import { useCallback, useState, useEffect } from "react";
import useSWR from "swr";
import { z } from "zod";

// 주차별 통계 스키마 정의
export const WeeklyStatSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  weekNumber: z.number(),
  totalMissions: z.number(),
  totalStudents: z.number(),
  totalPossibleSubmissions: z.number(),
  submittedMissions: z.number(),
  submissionRate: z.number(),
  remainingRate: z.number(),
  incompleteUsers: z.array(z.object({
    id: z.string(),
    name: z.string(),
  })),
  incompleteMissionList: z.array(z.object({
    mission_name: z.string(),
    user_name: z.string(),
    user_id: z.string(),
  }))
});

export type WeeklyStat = z.infer<typeof WeeklyStatSchema>;

export function useJourneyWeeklyStats(journeyId?: string | number) {

  // 데이터 가져오기 함수
  const fetcher = useCallback(async () => {
    if (!journeyId) {
      return [];
    }

    try {

      // API 라우트를 통해 데이터 가져오기
      const response = await fetch("/api/journey-weekly-stats", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          journeyId,
        }),
      });
      
      // 응답 텍스트 먼저 가져오기 (JSON 파싱 실패 대비)
      const responseText = await response.text();
      
      if (!response.ok) {
        // 응답이 JSON 형식인지 확인하고 에러 메시지 추출
        try {
          const errorData = JSON.parse(responseText);
          throw new Error(`API 에러 (${response.status}): ${errorData.error || '알 수 없는 오류'}`);
        } catch (parseError) {
          console.error("JSON 파싱 오류:", parseError);
          throw new Error(`API 에러 (${response.status}): ${responseText || '알 수 없는 오류'}`);
        }
      }
      
      // 응답이 JSON 형식인지 확인
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error("JSON 파싱 오류:", parseError);
        throw new Error("API 응답 파싱 오류: 유효하지 않은 JSON 형식");
      }
      
      if (result.error) {
        console.error("useJourneyWeeklyStats: API 에러 응답", result.error);
        throw new Error(`API 에러: ${result.error}`);
      }
      
      const stats = result.data || [];
      
      return stats;
    } catch (err) {
      console.error("useJourneyWeeklyStats: 예외 발생", err);
      
      throw err;
    }
  }, [journeyId]);

  // SWR 키 생성
  const swrKey = journeyId ? `weekly-stats-${journeyId}` : null;

  // SWR 훅 사용
  const {
    data: weeklyStats,
    error,
    isLoading,
    mutate,
  } = useSWR<WeeklyStat[]>(
    swrKey,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1분 동안 중복 요청 방지
      fallbackData: [], // 기본값 제공하여 에러 방지
      suspense: false, // suspense 모드 비활성화로 에러 방지
      revalidateOnMount: true, // 마운트 시 항상 재검증
      shouldRetryOnError: true, // 에러 발생 시 재시도
      onError: (err) => {
        console.error("[useJourneyWeeklyStats] 데이터 로딩 중 오류:", err);
      }
    }
  );

  // 효과적인 에러 로깅
  useEffect(() => {
    if (error) {
      console.error("[useJourneyWeeklyStats] SWR 오류:", error);
    }
  }, [error]);

  return {
    weeklyStats: weeklyStats || [],
    isLoading,
    error,
    mutate,
  };
} 