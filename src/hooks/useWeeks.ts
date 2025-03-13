import useSWR from 'swr';
import { createClient } from "@/utils/supabase/client";
import { CreateJourneyWeek, JourneyWeek, UpdateJourneyWeek } from '@/types/journeyWeeks';
import { Mission } from '@/types/missions';
import { useCallback } from 'react';

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
const fetchMissionsByIds = async (missionIds: number[]) => {
  if (!missionIds || missionIds.length === 0) return [];
  
  const supabase = createClient();
  const { data, error } = await supabase
    .from("missions")
    .select("*")
    .in("id", missionIds);
  
  if (error) {
    throw new Error(error.message);
  }
  
  return data as Mission[];
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
    if (!weeks) return null;
    
    const week = weeks.find(w => w.id === weekId);
    if (!week) return null;
    
    const currentMissions = week.missions || [];
    
    // 이미 추가된 미션인지 확인
    if (currentMissions.includes(missionId)) {
      return week;
    }
    
    const updatedMissions = [...currentMissions, missionId];
    
    const supabase = createClient();
    const { data, error } = await supabase
      .from("journey_weeks")
      .update({ missions: updatedMissions } as any)
      .eq("id", weekId)
      .select()
      .single();
    
    if (error) {
      throw new Error(error.message);
    }
    
    // 캐시 업데이트
    mutate();
    
    return data;
  }, [weeks, mutate]);

  // 주차에서 미션 제거 함수
  const removeMissionFromWeek = useCallback(async (weekId: number, missionId: number) => {
    if (!weeks) return null;
    
    const week = weeks.find(w => w.id === weekId);
    if (!week) return null;
    
    const currentMissions = week.missions || [];
    
    // 미션이 존재하는지 확인
    if (!currentMissions.includes(missionId)) {
      return week;
    }
    
    const updatedMissions = currentMissions.filter(id => id !== missionId);
    
    const supabase = createClient();
    const { data, error } = await supabase
      .from("journey_weeks")
      .update({ missions: updatedMissions } as any)
      .eq("id", weekId)
      .select()
      .single();
    
    if (error) {
      throw new Error(error.message);
    }
    
    // 캐시 업데이트
    mutate();
    
    return data;
  }, [weeks, mutate]);

  // 주차의 미션 목록 가져오기 함수
  const getWeekMissions = useCallback(async (weekId: number): Promise<Mission[]> => {
    if (!weeks) return [];
    
    try {
      const week = weeks.find(w => w.id === weekId);
      if (!week) {
        console.log(`주차 ID ${weekId}를 찾을 수 없습니다.`);
        return [];
      }
      
      const missionIds = week.missions || [];
      if (!missionIds || missionIds.length === 0) {
        return [];
      }
      
      const missions = await fetchMissionsByIds(missionIds);
      return missions;
    } catch (error) {
      console.error("Error fetching week missions:", error);
      return [];
    }
  }, [weeks]);

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
    mutate
  };
} 