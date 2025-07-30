import { useSupabaseCRUD } from '../base/useSupabaseCRUD';
import { useSupabaseQuery, getSupabaseClient } from '../base/useSupabaseQuery';
import { Journey, CreateJourney } from '@/types';

// Journey 관련 쿼리 훅
export function useJourneyRefactored() {
  const crud = useSupabaseCRUD({
    tableName: 'journeys',
    cacheKey: 'journeys',
  });

  return {
    // 기존 인터페이스 유지
    journeys: crud.data as Journey[],
    error: crud.error,
    isLoading: crud.isLoading,
    revalidate: crud.refetch,
    
    // CRUD 작업 - 기존 이름 유지
    addJourney: async (journeyData: CreateJourney) => {
      const result = await crud.create(journeyData);
      return [result] as Journey[];
    },
    
    removeJourney: async (journeyId: string) => {
      await crud.remove(journeyId);
      return true;
    },
    
    updateJourney: async (journeyId: string, updateData: Partial<CreateJourney>) => {
      const result = await crud.update({ id: journeyId, data: updateData });
      return [result] as Journey[];
    },
  };
}

// 개별 Journey 조회 훅
export function useJourneyById(id: string | null) {
  return useSupabaseQuery<Journey>(
    id ? `journey:${id}` : null,
    async (supabase) => {
      if (!id) throw new Error('Journey ID is required');
      
      const { data, error } = await supabase
        .from('journeys')
        .select('*')
        .eq('id', id.trim())
        .single();
      
      if (error) throw error;
      return data as Journey;
    }
  );
}

// Journey 상세 정보 조회 (관계 포함)
export function useJourneyWithRelations(id: string | null) {
  return useSupabaseQuery(
    id ? `journey-with-relations:${id}` : null,
    async (supabase) => {
      if (!id) throw new Error('Journey ID is required');
      
      const { data, error } = await supabase
        .from('journeys')
        .select(`
          *,
          journey_weeks (
            id,
            week_number,
            title,
            description,
            start_date,
            end_date
          ),
          journey_users (
            id,
            user_id,
            joined_at,
            profiles (
              id,
              email,
              first_name,
              last_name,
              profile_image
            )
          )
        `)
        .eq('id', id.trim())
        .single();
      
      if (error) throw error;
      return data;
    }
  );
}

// Legacy 함수 export (점진적 마이그레이션용)
export const fetchJourneyDetail = async (uuid: string) => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('journeys')
    .select('*')
    .eq('id', uuid.trim())
    .single();
  
  if (error) throw new Error(error.message);
  return { data, error };
};