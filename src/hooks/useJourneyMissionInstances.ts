import useSWR from "swr";
import { createClient } from "@/utils/supabase/client";
import {
  JourneyMissionInstance,
  CreateJourneyMissionInstance,
  UpdateJourneyMissionInstance,
  MissionStatus,
  Mission,
} from "@/types";
import { useCallback } from "react";
import { useJourneyStore } from "@/store/journey";

export function useJourneyMissionInstances(
  weekId?: number | null,
) {
  const { currentJourneyUuid } = useJourneyStore();
  // 데이터 가져오기 함수
  const fetcher = useCallback(async () => {
    const supabase = createClient();

    // 특정 주차의 미션 인스턴스 가져오기
    const query = supabase
      .from("journey_mission_instances")
      .select(`*, missions(*)`)
      .eq("journey_uuid", currentJourneyUuid || "");

    // 주차 ID가 있으면 필터링œ
    if (weekId) {
      query.eq("journey_week_id", weekId);
    }

    const { data, error } = await query;
    if (error) {
      throw new Error(error.message);
    }

    // missions를 mission으로 매핑하여 타입 일관성 유지
    return data.map((item: any) => ({
      ...item,
      mission: item.missions,
    })) as unknown as (JourneyMissionInstance & {
      mission: Mission;
    })[];
  }, [weekId]);

  // SWR 훅 사용
  const {
    data: missionInstances,
    error,
    isLoading,
    mutate,
  } = useSWR<(JourneyMissionInstance & { mission: Mission })[]>(
    weekId ? `mission-instances-${weekId}` : "all-mission-instances",
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1분 동안 중복 요청 방지
    }
  );

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
      const { error } = await supabase
        .from("journey_mission_instances")
        .delete()
        .eq("id", id);

      if (error) {
        throw new Error(error.message);
      }

      // 캐시 업데이트
      mutate();

      return true;
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
