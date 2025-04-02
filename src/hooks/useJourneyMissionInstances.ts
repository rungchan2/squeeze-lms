import useSWR from "swr";
import { createClient } from "@/utils/supabase/client";
import {
  JourneyMissionInstance,
  CreateJourneyMissionInstance,
  UpdateJourneyMissionInstance,
  MissionStatus,
  Mission,
} from "@/types";
import { useCallback, useState, useEffect } from "react";

export function useJourneyMissionInstances(
  specificJourneyUuid: string,
  weekId?: number | null,
) {
  const [retryCount, setRetryCount] = useState(0);
  
  // 외부에서 주입된 UUID 또는 스토어에서 가져온 UUID 사용
  const journeyUuid = specificJourneyUuid;
  
  // 데이터 가져오기 함수
  const fetcher = useCallback(async () => {
    // 키에서 데이터 추출 (SWR 키는 `mission-instances-${weekId}-${journeyUuid}` 형식)
    
    if (!journeyUuid) {
      // 데이터가 없는 빈 배열 반환 (에러 발생 방지)
      return [];
    }
    
    try {
      // 지연 처리 - 첫 번째 요청에서만 지연 적용
      if (retryCount === 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // API 라우트를 통해 데이터 가져오기
      const response = await fetch("/api/journey-mission-instances", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          journeyUuid,
          weekId: weekId || undefined
        }),
        // 캐시 사용 방지
        cache: 'no-store'
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API 에러 (${response.status}): ${errorText}`);
      }
      
      const result = await response.json();
      
      if (result.error) {
        console.error("useJourneyMissionInstances: API 에러 응답", result.error);
        throw new Error(`API 에러: ${result.error}`);
      }
      
      const instances = result.data || [];
      
      // 재시도 횟수 초기화 (성공 시)
      setRetryCount(0);
      
      return instances;
    } catch (err) {
      console.error("useJourneyMissionInstances: 예외 발생", err);
      
      // 최대 3번까지 재시도 증가
      setRetryCount(prev => prev < 3 ? prev + 1 : prev);
      
      if (retryCount >= 3) {
        console.error("useJourneyMissionInstances: 최대 재시도 횟수 초과");
        return [];
      }
      
      // 빈 배열 반환 (에러 발생 방지)
      throw err;
    }
  }, [weekId, journeyUuid, retryCount]);

  // SWR 키 생성 (로그 추가)
  const swrKey = journeyUuid ? 
    (weekId ? `mission-instances-${weekId}-${journeyUuid}` : `all-mission-instances-${journeyUuid}`) 
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
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1분 동안 중복 요청 방지
      fallbackData: [], // 기본값 제공하여 에러 방지
      suspense: false, // suspense 모드 비활성화로 에러 방지
      revalidateOnMount: true, // 마운트 시 항상 재검증
      shouldRetryOnError: true, // 에러 발생 시 재시도
      errorRetryCount: 3, // 에러 재시도 횟수
      errorRetryInterval: 1000, // 에러 재시도 간격
      onError: (err) => {
        console.error("[useJourneyMissionInstances] 데이터 로딩 중 오류:", err);
      }
    }
  );

  // 효과적인 에러 로깅
  useEffect(() => {
    if (error) {
      console.error("[useJourneyMissionInstances] SWR 오류:", error);
    }
  }, [error]);

  const createMissionInstance = useCallback(
    async (instanceData: CreateJourneyMissionInstance) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("journey_mission_instances")
        .insert(instanceData)
        .select(
          `
        *,
        missions(*)
      `
        )
        .single();

      if (error) {
        throw new Error(error.message);
      }

      // 캐시 업데이트
      mutate();

      return data as unknown as JourneyMissionInstance & { missions: Mission };
    },
    [mutate]
  );

  /**
   * 미션 인스턴스 업데이트 함수
   * @param id 업데이트할 미션 인스턴스 ID
   * @param instanceData 업데이트할 미션 인스턴스 데이터
   * @returns 업데이트된 미션 인스턴스 데이터
   */
  const updateMissionInstance = useCallback(
    async (id: number, instanceData: UpdateJourneyMissionInstance) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("journey_mission_instances")
        .update(instanceData)
        .eq("id", id)
        .select(
          `
        *,
        missions(*)
      `
        )
        .single();

      if (error) {
        throw new Error(error.message);
      }

      // 캐시 업데이트
      mutate();

      return data as unknown as JourneyMissionInstance & { missions: Mission };
    },
    [mutate]
  );

  /**
   * 미션 인스턴스 상태 업데이트 함수
   * @param id 업데이트할 미션 인스턴스 ID
   * @param status 새로운 상태
   * @returns 업데이트된 미션 인스턴스 데이터
   */
  const updateMissionStatus = useCallback(
    async (id: number, status: MissionStatus) => {
      return updateMissionInstance(id, { status });
    },
    [updateMissionInstance]
  );

  /**
   * 미션 인스턴스 삭제 함수
   * @param id 삭제할 미션 인스턴스 ID
   * @returns 삭제 성공 여부
   */
  const deleteMissionInstance = useCallback(
    async (id: number) => {
      const supabase = createClient();

      try {
        // 1. 먼저 관련된 user_points 레코드 삭제
        const { error: pointsError } = await supabase
          .from("user_points")
          .delete()
          .eq("mission_instance_id", id);

        if (pointsError) {
          console.error("Error deleting user points:", pointsError);
          throw new Error(`포인트 데이터 삭제 중 오류: ${pointsError.message}`);
        }

        // 2. 그 다음 미션 인스턴스 삭제
        const { error: instanceError } = await supabase
          .from("journey_mission_instances")
          .delete()
          .eq("id", id);

        if (instanceError) {
          throw new Error(`미션 인스턴스 삭제 중 오류: ${instanceError.message}`);
        }

        // 캐시 업데이트
        mutate();

        return true;
      } catch (error) {
        console.error("Error in deleteMissionInstance:", error);
        throw error;
      }
    },
    [mutate]
  );

  /**
   * 특정 미션 인스턴스 조회 함수
   * @param id 조회할 미션 인스턴스 ID
   * @returns 미션 인스턴스 데이터
   */
  const getMissionInstanceById = useCallback(
    (id: number) => {
      return missionInstances?.find((instance) => instance.id === id);
    },
    [missionInstances]
  );

  return {
    missionInstances: missionInstances || [],
    isLoading,
    error,
    createMissionInstance,
    updateMissionInstance,
    updateMissionStatus,
    deleteMissionInstance,
    getMissionInstanceById,
    mutate,
  };
}
