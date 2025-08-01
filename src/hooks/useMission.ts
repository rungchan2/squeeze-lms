import useSWR from 'swr';
import { createClient } from "@/utils/supabase/client";
import { Mission, CreateMission, UpdateMission } from '@/types';
import { CreateMissionQuestion } from '@/types/missionQuestions';
import { 
  getMissionWithQuestions as getMissionWithQuestionsAPI,
  createMissionWithQuestions as createMissionWithQuestionsAPI,
  migrateLegacyMission 
} from '@/utils/data/mission';
import { useCallback } from 'react';

/**
 * 미션 데이터를 관리하는 훅
 * @param weekId 주차 ID (0이면 모든 미션 가져오기)
 * @returns 미션 데이터와 CRUD 함수들
 */
export function useMission() {
  // 데이터 가져오기 함수
  const fetcher = useCallback(async () => {
    const supabase = createClient();
    
    // 모든 미션 가져오기
    const { data, error } = await supabase
      .from("missions")
      .select("*");
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data as Mission[];
  }, []);

  // SWR 훅 사용
  const {
    data: missions,
    error,
    isLoading,
    mutate
  } = useSWR<Mission[]>(
    'all-missions',
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1분 동안 중복 요청 방지
    }
  );

  /**
   * 미션 생성 함수
   * @param missionData 생성할 미션 데이터
   * @returns 생성된 미션 데이터
   */
  const createMission = useCallback(async (missionData: CreateMission) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("missions")
      .insert(missionData)
      .select()
      .single();
    
    if (error) {
      throw new Error(error.message);
    }
    
    // 캐시 업데이트
    mutate();
    
    return data as Mission;
  }, [mutate]);

  /**
   * 미션 업데이트 함수
   * @param id 업데이트할 미션 ID
   * @param missionData 업데이트할 미션 데이터
   * @returns 업데이트된 미션 데이터
   */
  const updateMission = useCallback(async (id: string, missionData: UpdateMission) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("missions")
      .update(missionData)
      .eq("id", id)
      .select()
      .single();
    
    if (error) {
      throw new Error(error.message);
    }
    
    // 캐시 업데이트
    mutate();
    
    return data as Mission;
  }, [mutate]);

  /**
   * 미션 삭제 함수
   * @param id 삭제할 미션 ID
   * @returns 삭제 성공 여부
   */
  const deleteMission = useCallback(async (id: string) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("missions")
      .delete()
      .eq("id", id);
    
    if (error) {
      throw new Error(error.message);
    }
    
    // 캐시 업데이트
    mutate();
    
    return true;
  }, [mutate]);

  /**
   * 특정 미션 조회 함수
   * @param id 조회할 미션 ID
   * @returns 미션 데이터
   */
  const getMissionById = useCallback((id: string) => {
    return missions?.find(mission => mission.id === id);
  }, [missions]);

  /**
   * 질문과 함께 미션 생성 함수 (Enhanced)
   * @param missionData 생성할 미션 데이터
   * @param questions 질문 배열 (옵션)
   * @returns 생성된 미션 데이터
   */
  const createMissionWithQuestions = useCallback(async (
    missionData: CreateMission, 
    questions: CreateMissionQuestion[] = []
  ) => {
    const { data, error } = await createMissionWithQuestionsAPI(missionData, questions);
    
    if (error) {
      throw new Error(error.message);
    }
    
    // 캐시 업데이트
    mutate();
    
    return data;
  }, [mutate]);

  /**
   * 질문과 함께 미션 조회 함수 (Enhanced)
   * @param id 조회할 미션 ID
   * @returns 미션 데이터 (질문 포함)
   */
  const getMissionWithQuestionsById = useCallback(async (id: string) => {
    const { data, error } = await getMissionWithQuestionsAPI(id);
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data;
  }, []);

  /**
   * 레거시 미션을 새 형식으로 마이그레이션
   * @param id 마이그레이션할 미션 ID
   * @returns 마이그레이션 결과
   */
  const migrateMissionToQuestions = useCallback(async (id: string) => {
    const { data, error } = await migrateLegacyMission(id);
    
    if (error) {
      throw new Error(error.message);
    }
    
    // 캐시 업데이트
    mutate();
    
    return data;
  }, [mutate]);

  return {
    missions: missions || [],
    isLoading,
    error,
    createMission,
    updateMission,
    deleteMission,
    getMissionById,
    mutate, // 수동으로 데이터를 다시 가져오기 위한 함수
    
    // Enhanced functions for missions with questions
    createMissionWithQuestions,
    getMissionWithQuestionsById,
    migrateMissionToQuestions,
  };
} 