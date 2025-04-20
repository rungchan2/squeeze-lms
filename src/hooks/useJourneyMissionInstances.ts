import useSWR from "swr";
import { JourneyMissionInstance, Mission, CreateJourneyMissionInstance, UpdateJourneyMissionInstance } from "@/types";
import { useCallback } from "react";
import {
  createMissionInstance,
  updateMissionInstance,
  deleteMissionInstance,
  getMissionInstanceById,
} from "@/utils/data/journeyMissionInstance";
export function useJourneyMissionInstances(
  journeyUuid: string,
  weekId?: string | null
) {
  // 데이터 가져오기 함수
  const fetcher = useCallback(async () => {
    if (!journeyUuid) {
      return [];
    }

    try {
      // API 라우트를 통해 데이터 가져오기
      const response = await fetch("/api/journey-mission-instances", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          journeyUuid,
          weekId: weekId || undefined,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API 에러 (${response.status}): ${errorText}`);
      }

      const result = await response.json();

      if (result.error) {
        console.error(
          "useJourneyMissionInstances: API 에러 응답",
          result.error
        );
        throw new Error(`API 에러: ${result.error}`);
      }

      const instances = result.data || [];

      return instances;
    } catch (err) {
      console.error("useJourneyMissionInstances: 예외 발생", err);
      throw err;
    }
  }, [weekId, journeyUuid]);

  // SWR 키 생성 (로그 추가)
  const swrKey = journeyUuid
    ? weekId
      ? `mission-instances-${weekId}-${journeyUuid}`
      : `all-mission-instances-${journeyUuid}`
    : null;

  // SWR 훅 사용
  const {
    data: missionInstances,
    error,
    isLoading,
    mutate,
  } = useSWR<(JourneyMissionInstance & { mission: Mission })[]>(
    swrKey,
    fetcher,
    {
      revalidateOnFocus: true,
      dedupingInterval: 60000, // 1분 동안 중복 요청 방지
      fallbackData: [], // 기본값 제공하여 에러 방지
      revalidateOnMount: true, // 마운트 시 항상 재검증
      shouldRetryOnError: true, // 에러 발생 시 재시도
      errorRetryCount: 3, // 에러 재시도 횟수
      errorRetryInterval: 1000, // 에러 재시도 간격
      onError: (err) => {
        console.error("[useJourneyMissionInstances] 데이터 로딩 중 오류:", err);
      },
    }
  );

  return {
    missionInstances: missionInstances || [],
    isLoading,
    error,
    createMissionInstance: (instanceData: CreateJourneyMissionInstance) => createMissionInstance(instanceData, mutate),
    updateMissionInstance: (id: string, instanceData: UpdateJourneyMissionInstance) => updateMissionInstance(id, instanceData, mutate),
    deleteMissionInstance: (id: string) => deleteMissionInstance(id, mutate),
    getMissionInstanceById: (id: string) => getMissionInstanceById(id),
    mutate,
  };
}
