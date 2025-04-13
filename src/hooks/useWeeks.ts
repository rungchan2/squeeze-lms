import useSWR from "swr";
import { createClient } from "@/utils/supabase/client";
import {
  CreateJourneyWeek,
  JourneyWeek,
  UpdateJourneyWeek,
  Mission,
  CreateJourneyMissionInstance,
} from "@/types";
import { useCallback } from "react";

// 데이터 가져오기 함수
const fetcher = async (journeyId: string) => {
  if (!journeyId) {
    console.warn("유효하지 않은 journeyId로 호출됨:", journeyId);
    return [];
  }

  try {
    const supabase = createClient();
    
    // Supabase 요청 자체에 try-catch 추가
    try {
      const { data, error } = await supabase
        .from("journey_weeks")
        .select("*")
        .eq("journey_id", journeyId);

      if (error) {
        console.error("useWeeks: 주차 데이터 요청 에러:", error);
        throw new Error(error.message);
      }

      const safeData = data || [];
      return safeData as JourneyWeek[];
    } catch (dbError) {
      console.error("useWeeks: Supabase 쿼리 에러:", dbError);
      return [];
    }
  } catch (err) {
    console.error("useWeeks: 예외 발생:", err);
    // 중요: 여기서 빈 배열을 반환하여 훅이 크래시되지 않도록 함
    return [];
  }
};

// 미션 데이터 가져오기 함수
const fetchMissionsByWeekId = async (weekId: string) => {
  if (!weekId) return [];

  const supabase = createClient();
  const { data, error } = await supabase
    .from("journey_mission_instances")
    .select(
      `
      *,
      missions(*)
    `
    )
    .eq("journey_week_id", weekId);

  if (error) {
    throw new Error(error.message);
  }

  // missions 객체에서 미션 데이터 추출
  return data.map((instance) => instance.missions) as Mission[];
};

export function useWeeks(journeyId: string) {
  // 유효한 journeyId 검증
  const validJourneyId = journeyId ? journeyId : "";
  
  // 훅의 키를 체크하는 로그 추가
  const swrKey = validJourneyId ? `journey-weeks-${validJourneyId}` : null;
  
  const {
    data: weeks,
    error,
    isLoading,
    mutate,
  } = useSWR<JourneyWeek[]>(
    swrKey,
    () => fetcher(validJourneyId),
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1분 동안 중복 요청 방지
      errorRetryCount: 3, // 최대 3번 재시도
      onErrorRetry: (error, key, config, revalidate, { retryCount }) => {
        // 메시지 로깅
        
        // 네트워크 에러일 경우만 재시도
        if (error.name === 'SyntaxError') return;
        
        // 최대 횟수를 초과한 경우 재시도 안함
        if (retryCount >= 3) return;
        
        // 지수 백오프로 재시도
        setTimeout(() => revalidate({ retryCount }), 
          Math.min(1000 * 2 ** retryCount, 30000));
      },
      fallbackData: [], // 데이터가 로드되기 전에 빈 배열을 제공
    }
  );

  // 주차 생성 함수
  const createWeek = useCallback(
    async (weekData: CreateJourneyWeek) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("journey_weeks")
        .insert(weekData)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      // 캐시 업데이트
      mutate();

      return data;
    },
    [mutate]
  );

  // 주차 업데이트 함수
  const updateWeek = useCallback(
    async (id: string, weekData: UpdateJourneyWeek) => {
      console.log("updateWeek", id, weekData);
      const supabase = createClient();
      const { data, error } = await supabase
        .from("journey_weeks")
        .update(weekData)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      // 캐시 업데이트
      mutate();

      return data;
    },
    [mutate]
  );

  // 주차 삭제 함수
  const deleteWeek = useCallback(
    async (id: string) => {
      const supabase = createClient();

      // 먼저 해당 주차의 모든 미션 인스턴스 삭제
      const { error: missionError } = await supabase
        .from("journey_mission_instances")
        .delete()
        .eq("journey_week_id", id);

      if (missionError) {
        throw new Error(missionError.message);
      }

      // 그 다음 주차 삭제
      const { error } = await supabase
        .from("journey_weeks")
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

  // 주차에 미션 추가 함수
  const addMissionToWeek = useCallback(
    async (weekId: string, missionId: string, journeyUuid: string) => {
      if (!weekId || !missionId) return null;

      // 이미 추가된 미션인지 확인
      const supabase = createClient();
      const { data: existingInstances, error: checkError } = await supabase
        .from("journey_mission_instances")
        .select("*")
        .eq("journey_week_id", weekId)
        .eq("mission_id", missionId);

      if (checkError) {
        throw new Error(checkError.message);
      }

      // 이미 존재하면 추가하지 않음
      if (existingInstances && existingInstances.length > 0) {
        return existingInstances[0];
      }

      // 새 미션 인스턴스 생성
      const newInstance: CreateJourneyMissionInstance = {
        journey_week_id: weekId,
        mission_id: missionId,
        status: "not_started",
        release_date: "",
        expiry_date: "",
        journey_uuid: journeyUuid,
      };

      const { data, error } = await supabase
        .from("journey_mission_instances")
        .insert(newInstance)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      // 캐시 업데이트
      mutate();

      return data;
    },
    [mutate]
  );

  // 주차에서 미션 제거 함수
  const removeMissionFromWeek = useCallback(
    async (weekId: string, missionId: string) => {
      if (!weekId || !missionId) return false;

      const supabase = createClient();
      const { error } = await supabase
        .from("journey_mission_instances")
        .delete()
        .eq("journey_week_id", weekId)
        .eq("mission_id", missionId);

      if (error) {
        throw new Error(error.message);
      }

      // 캐시 업데이트
      mutate();

      return true;
    },
    [mutate]
  );

  // 주차의 미션 목록 가져오기 함수
  const getWeekMissions = useCallback(
    async (weekId: string): Promise<Mission[]> => {
      if (!weekId) return [];

      try {
        const missions = await fetchMissionsByWeekId(weekId);
        return missions;
      } catch (error) {
        console.error("Error fetching week missions:", error);
        return [];
      }
    },
    []
  );

  // 주차의 미션 개수 가져오기 함수
  const getWeekMissionCount = useCallback(
    async (weekId: string): Promise<number> => {
      if (!weekId) return 0;

      const supabase = createClient();
      const { count, error } = await supabase
        .from("journey_mission_instances")
        .select("*", { count: "exact", head: true })
        .eq("journey_week_id", weekId);

      if (error) {
        console.error("Error counting missions:", error);
        return 0;
      }

      return count || 0;
    },
    []
  );

  return {
    weeks: weeks || [],
    isLoading,
    error,
    createWeek,
    updateWeek,
    deleteWeek,
    addMissionToWeek,
    removeMissionFromWeek,
    getWeekMissions,
    getWeekMissionCount,
    mutate,
  };
}
