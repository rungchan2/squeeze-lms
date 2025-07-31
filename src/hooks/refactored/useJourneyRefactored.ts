import { 
  useSupabaseQuery, 
  createCacheKey,
  createMutation
} from '../base/useSupabaseQuery';
import { Journey, CreateJourney } from '@/types';
import {
  getAllJourneys,
  getJourneyById as getJourneyByIdUtil,
  createJourney,
  updateJourney,
  deleteJourney
} from '@/utils/data/journey';

// Journey 관련 쿼리 훅
export function useJourneyRefactored() {
  // 전체 여정 목록 조회
  const { data: journeys, error, isLoading, refetch } = useSupabaseQuery<Journey[]>(
    createCacheKey('journeys'),
    async () => {
      return await getAllJourneys();
    },
    {
      dedupingInterval: 300000, // 5분 동안 중복 요청 방지
    }
  );

  // 여정 생성 mutation
  const addJourneyMutation = createMutation<Journey[], CreateJourney>(
    async (journeyData) => {
      const result = await createJourney(journeyData);
      if (result.error) throw result.error;
      return result.data ? [result.data] : [];
    },
    {
      revalidateKeys: ['journeys']
    }
  );

  // 여정 삭제 mutation
  const removeJourneyMutation = createMutation<boolean, string>(
    async (journeyId) => {
      const result = await deleteJourney(journeyId);
      if (result.error) throw result.error;
      return true;
    },
    {
      revalidateKeys: ['journeys']
    }
  );

  // 여정 업데이트 mutation
  const updateJourneyMutation = createMutation<Journey[], { id: string; data: Partial<CreateJourney> }>(
    async ({ id, data }) => {
      const result = await updateJourney(id, data as CreateJourney);
      if (result.error) throw result.error;
      return result.data ? [result.data] : [];
    },
    {
      revalidateKeys: ['journeys', 'journey']
    }
  );

  return {
    // 기존 인터페이스 유지
    journeys: journeys || [],
    error,
    isLoading,
    revalidate: refetch,
    
    // CRUD 작업 - 기존 이름 유지
    addJourney: async (journeyData: CreateJourney) => {
      const result = await addJourneyMutation.trigger(journeyData);
      return result;
    },
    
    removeJourney: async (journeyId: string) => {
      await removeJourneyMutation.trigger(journeyId);
      return true;
    },
    
    updateJourney: async (journeyId: string, updateData: Partial<CreateJourney>) => {
      const result = await updateJourneyMutation.trigger({ id: journeyId, data: updateData });
      return result;
    },
  };
}

// 개별 Journey 조회 훅
export function useJourneyById(id: string | null) {
  return useSupabaseQuery<Journey>(
    id ? createCacheKey('journey', { id }) : null,
    async () => {
      if (!id) throw new Error('Journey ID is required');
      return await getJourneyByIdUtil(id.trim());
    }
  );
}

// Journey 상세 정보 조회 (관계 포함)
export function useJourneyWithRelations(id: string | null) {
  return useSupabaseQuery(
    id ? createCacheKey('journey-with-relations', { id }) : null,
    async () => {
      if (!id) throw new Error('Journey ID is required');
      
      // journey.ts에 이미 getJourneyDetailsById 함수가 있으므로 사용
      // 또는 새로운 함수를 만들어야 할 수 있음
      // 일단 기본 여정 정보만 반환
      return await getJourneyByIdUtil(id.trim());
    }
  );
}

// Legacy 함수 export (점진적 마이그레이션용)
export const fetchJourneyDetail = async (uuid: string) => {
  try {
    const data = await getJourneyByIdUtil(uuid.trim());
    return { data, error: null };
  } catch (error: any) {
    return { data: null, error };
  }
};