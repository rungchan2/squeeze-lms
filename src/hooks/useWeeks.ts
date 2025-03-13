import useSWR from 'swr';
import { createClient } from "@/utils/supabase/client";
import { CreateJourneyWeek, JourneyWeek, UpdateJourneyWeek } from '@/types/journeyWeeks';
import { Mission } from '@/types/missions';
import { useCallback } from 'react';
import { CreateJourneyMissionInstance } from '@/types/journeyMissionInstances';

// 데이터 가져오기 함수
const fetcher = async (journeyId: number) => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("journey_weeks")
    .select("*")
    .eq("journey_id", journeyId);
  
  if (error) {
    throw new Error(error.message);
  }
  
  return data as JourneyWeek[];
};

// 미션 데이터 가져오기 함수
const fetchMissionsByWeekId = async (weekId: number) => {
  if (!weekId) return [];
  
  const supabase = createClient();
  const { data, error } = await supabase
    .from("journey_mission_instances")
    .select(`
      *,
      missions(*)
    `)
    .eq("journey_week_id", weekId);
  
  if (error) {
    throw new Error(error.message);
  }
  
  // missions 객체에서 미션 데이터 추출
  return data.map(instance => instance.missions) as Mission[];
};

export function useWeeks(journeyId: number) {
  const {
    data: weeks,
    error,
    isLoading,
    mutate
  } = useSWR<JourneyWeek[]>(
    journeyId ? `journey-weeks-${journeyId}` : null,
    () => fetcher(journeyId),
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1분 동안 중복 요청 방지
    }
  );

  // 주차 생성 함수
  const createWeek = useCallback(async (weekData: CreateJourneyWeek) => {
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
  }, [mutate]);

  // 주차 업데이트 함수
  const updateWeek = useCallback(async (id: number, weekData: UpdateJourneyWeek) => {
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
  }, [mutate]);

  // 주차 삭제 함수
  const deleteWeek = useCallback(async (id: number) => {
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
  }, [mutate]);

  // 주차에 미션 추가 함수
  const addMissionToWeek = useCallback(async (weekId: number, missionId: number) => {
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
      status: 'not_started',
      release_date: null,
      expiry_date: null
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
  }, [mutate]);

  // 주차에서 미션 제거 함수
  const removeMissionFromWeek = useCallback(async (weekId: number, missionId: number) => {
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
  }, [mutate]);

  // 주차의 미션 목록 가져오기 함수
  const getWeekMissions = useCallback(async (weekId: number): Promise<Mission[]> => {
    if (!weekId) return [];
    
    try {
      const missions = await fetchMissionsByWeekId(weekId);
      return missions;
    } catch (error) {
      console.error("Error fetching week missions:", error);
      return [];
    }
  }, []);

  // 주차의 미션 개수 가져오기 함수
  const getWeekMissionCount = useCallback(async (weekId: number): Promise<number> => {
    if (!weekId) return 0;
    
    const supabase = createClient();
    const { count, error } = await supabase
      .from("journey_mission_instances")
      .select("*", { count: 'exact', head: true })
      .eq("journey_week_id", weekId);
    
    if (error) {
      console.error("Error counting missions:", error);
      return 0;
    }
    
    return count || 0;
  }, []);

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
    mutate
  };
} 