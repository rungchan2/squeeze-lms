import useSWR from "swr";
import { JourneyMissionInstance, Mission, CreateJourneyMissionInstance, UpdateJourneyMissionInstance } from "@/types";
import { useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
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
  // Supabase 클라이언트를 사용한 직접 데이터 가져오기
  const fetcher = useCallback(async (): Promise<(JourneyMissionInstance & { mission: Mission })[]> => {
    if (!journeyUuid) {
      return [];
    }

    try {
      const supabase = createClient();
      
      // 쿼리 빌더 시작
      let query = supabase
        .from("journey_mission_instances")
        .select(`
          *,
          mission:missions(*)
        `)
        .eq("journey_id", journeyUuid);

      // weekId가 있으면 해당 주차로 필터링
      if (weekId) {
        query = query.eq("journey_week_id", weekId);
      }

      // 정렬: 생성일 기준 오름차순
      query = query.order("created_at", { ascending: true });

      const { data, error } = await query;

      if (error) {
        console.error("useJourneyMissionInstances: Supabase 에러", error);
        throw new Error(`데이터베이스 에러: ${error.message}`);
      }

      return data || [];
    } catch (err) {
      console.error("useJourneyMissionInstances: 예외 발생", err);
      throw err;
    }
  }, [journeyUuid, weekId]);

  // 최적화된 SWR 키 생성
  const swrKey = journeyUuid
    ? `journey-mission-instances:${journeyUuid}${weekId ? `:${weekId}` : ":all"}`
    : null;

  // 최적화된 SWR 설정
  const {
    data: missionInstances,
    error,
    isLoading,
    mutate,
  } = useSWR<(JourneyMissionInstance & { mission: Mission })[]>(
    swrKey,
    fetcher,
    {
      revalidateOnFocus: false, // 포커스 시 재검증 비활성화
      revalidateOnReconnect: true, // 재연결 시 재검증 활성화
      revalidateIfStale: true, // stale 데이터 재검증 활성화
      dedupingInterval: 60000, // 1분 동안 중복 요청 방지
      revalidateOnMount: true, // 마운트 시 재검증 활성화
      shouldRetryOnError: false, // 에러 시 재시도 비활성화
      errorRetryCount: 1, // 재시도 횟수 최소화
      errorRetryInterval: 5000, // 재시도 간격
      keepPreviousData: true, // 이전 데이터 유지 (로딩 상태 개선)
      onError: (err) => {
        console.error("[useJourneyMissionInstances] 데이터 로딩 중 오류:", err);
      },
    }
  );

  return {
    missionInstances: missionInstances || [],
    isLoading,
    error,
    createMissionInstance: async (instanceData: CreateJourneyMissionInstance) => {
      const result = await createMissionInstance(instanceData);
      mutate();
      return result;
    },
    updateMissionInstance: async (id: string, instanceData: UpdateJourneyMissionInstance) => {
      const result = await updateMissionInstance(id, instanceData);
      mutate();
      return result;
    },
    deleteMissionInstance: async (id: string) => {
      const result = await deleteMissionInstance(id);
      mutate();
      return result;
    },
    getMissionInstanceById: (id: string) => getMissionInstanceById(id),
    mutate,
  };
}
