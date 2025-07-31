import { 
  useSupabaseQuery,
  createCacheKey,
  createMutation
} from '../base/useSupabaseQuery';
import {
  CreateJourneyWeek,
  JourneyWeek,
  UpdateJourneyWeek,
  Mission,
  CreateJourneyMissionInstance,
} from '@/types';

// 여정 주차 목록 조회 훅
export function useWeeksRefactored(journeyId: string | null) {
  return useSupabaseQuery<JourneyWeek[]>(
    journeyId ? createCacheKey('journey-weeks', { journeyId }) : null,
    async (supabase) => {
      if (!journeyId) return [];

      const { data, error } = await supabase
        .from('journey_weeks')
        .select('*')
        .eq('journey_id', journeyId)
        .order('week_number', { ascending: true });

      if (error) throw error;
      return (data || []) as JourneyWeek[];
    },
    {
      dedupingInterval: 300000, // 5분 동안 중복 요청 방지
      revalidateOnFocus: false,
      revalidateOnMount: true,
    }
  );
}

// 단일 주차 조회 훅
export function useWeekRefactored(weekId: string | null) {
  return useSupabaseQuery<JourneyWeek>(
    weekId ? createCacheKey('journey-week', { weekId }) : null,
    async (supabase) => {
      if (!weekId) throw new Error('Week ID is required');

      const { data, error } = await supabase
        .from('journey_weeks')
        .select('*')
        .eq('id', weekId)
        .single();

      if (error) throw error;
      return data as JourneyWeek;
    }
  );
}

// 주차의 미션 목록 조회 훅
export function useWeekMissionsRefactored(weekId: string | null) {
  return useSupabaseQuery<Mission[]>(
    weekId ? createCacheKey('week-missions', { weekId }) : null,
    async (supabase) => {
      if (!weekId) return [];

      const { data, error } = await supabase
        .from('journey_mission_instances')
        .select(`
          *,
          missions (*)
        `)
        .eq('journey_week_id', weekId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // missions 객체에서 미션 데이터 추출
      return (data || []).map((instance) => instance.missions).filter(Boolean) as Mission[];
    }
  );
}

// 주차 CRUD 작업 훅
export function useWeekActionsRefactored() {

  // 주차 생성
  const createWeek = createMutation<JourneyWeek, CreateJourneyWeek>(
    async (supabase, weekData) => {
      const { data, error } = await supabase
        .from('journey_weeks')
        .insert(weekData)
        .select()
        .single();

      if (error) throw error;
      return data as JourneyWeek;
    },
    {
      revalidateKeys: ['journey-weeks'],
    }
  );

  // 주차 업데이트
  const updateWeek = createMutation<
    JourneyWeek,
    { id: string; updates: UpdateJourneyWeek }
  >(
    async (supabase, { id, updates }) => {
      const { data, error } = await supabase
        .from('journey_weeks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as JourneyWeek;
    },
    {
      revalidateKeys: ['journey-weeks', 'journey-week'],
    }
  );

  // 주차 삭제 (관련 미션 인스턴스도 함께 삭제)
  const deleteWeek = createMutation<boolean, string>(
    async (supabase, weekId) => {
      // 먼저 해당 주차의 모든 미션 인스턴스 삭제
      const { error: missionError } = await supabase
        .from('journey_mission_instances')
        .delete()
        .eq('journey_week_id', weekId);

      if (missionError) throw missionError;

      // 그 다음 주차 삭제
      const { error } = await supabase
        .from('journey_weeks')
        .delete()
        .eq('id', weekId);

      if (error) throw error;
      return true;
    },
    {
      revalidateKeys: ['journey-weeks', 'week-missions'],
    }
  );

  // 주차에 미션 추가
  const addMissionToWeek = createMutation<
    any,
    { weekId: string; missionId: string; journeyId: string }
  >(
    async (supabase, { weekId, missionId, journeyId }) => {
      // 이미 추가된 미션인지 확인
      const { data: existingInstances } = await supabase
        .from('journey_mission_instances')
        .select('*')
        .eq('journey_week_id', weekId)
        .eq('mission_id', missionId);

      // 이미 존재하면 추가하지 않음
      if (existingInstances && existingInstances.length > 0) {
        return existingInstances[0];
      }

      // 새 미션 인스턴스 생성
      const newInstance: CreateJourneyMissionInstance = {
        journey_week_id: weekId,
        mission_id: missionId,
        status: 'not_started',
        release_date: '',
        expiry_date: '',
        journey_id: journeyId,
      };

      const { data, error } = await supabase
        .from('journey_mission_instances')
        .insert(newInstance)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    {
      revalidateKeys: ['week-missions', 'journey-mission-instances'],
    }
  );

  // 주차에서 미션 제거
  const removeMissionFromWeek = createMutation<
    boolean,
    { weekId: string; missionId: string }
  >(
    async (supabase, { weekId, missionId }) => {
      const { error } = await supabase
        .from('journey_mission_instances')
        .delete()
        .eq('journey_week_id', weekId)
        .eq('mission_id', missionId);

      if (error) throw error;
      return true;
    },
    {
      revalidateKeys: ['week-missions', 'journey-mission-instances'],
    }
  );

  return {
    createWeek,
    updateWeek,
    deleteWeek,
    addMissionToWeek,
    removeMissionFromWeek,
  };
}

// 주차 통계 및 정보 훅
export function useWeekStatsRefactored(weekId: string | null) {
  const { data: weekMissions } = useWeekMissionsRefactored(weekId);

  return useSupabaseQuery(
    weekId ? createCacheKey('week-stats', { weekId }) : null,
    async (supabase) => {
      if (!weekId) return {};

      // 미션 개수
      const { count: missionCount } = await supabase
        .from('journey_mission_instances')
        .select('*', { count: 'exact', head: true })
        .eq('journey_week_id', weekId);

      // 게시물 개수 (해당 주차 미션들의 게시물)
      const { count: postCount } = await supabase
        .from('posts')
        .select('journey_mission_instances!inner(*)', { count: 'exact', head: true })
        .eq('journey_mission_instances.journey_week_id', weekId);

      return {
        missionCount: missionCount || 0,
        postCount: postCount || 0,
        totalPoints: weekMissions?.reduce((sum, mission) => sum + (mission.points || 0), 0) || 0,
      };
    },
    {
      dedupingInterval: 120000, // 2분 동안 중복 요청 방지
    }
  );
}

// 주차 순서 관리 훅
export function useWeekOrderRefactored(journeyId: string | null) {
  const { data: weeks } = useWeeksRefactored(journeyId);
  const { updateWeek } = useWeekActionsRefactored();

  // 주차 순서 변경
  const reorderWeeks = createMutation<
    boolean,
    { updates: { id: string; week_number: number }[] }
  >(
    async (supabase, { updates }) => {
      // 트랜잭션으로 여러 주차의 순서를 한 번에 업데이트
      const updatePromises = updates.map(({ id, week_number }) =>
        supabase
          .from('journey_weeks')
          .update({ week_number })
          .eq('id', id)
      );

      const results = await Promise.all(updatePromises);
      
      // 에러가 있는지 확인
      for (const result of results) {
        if (result.error) throw result.error;
      }

      return true;
    },
    {
      revalidateKeys: ['journey-weeks'],
    }
  );

  // 주차 위치 이동
  const moveWeek = async (weekId: string, newWeekNumber: number) => {
    if (!weeks) return false;

    const currentWeek = weeks.find(w => w.id === weekId);
    if (!currentWeek) return false;

    const currentNumber = currentWeek.week_number;
    if (currentNumber === newWeekNumber) return true;

    // 다른 주차들의 순서 조정
    const updates = weeks
      .filter(w => w.id !== weekId)
      .map(w => {
        let adjustedNumber = w.week_number;
        
        if (currentNumber < newWeekNumber) {
          // 아래로 이동: 사이에 있는 주차들을 위로
          if (w.week_number > currentNumber && w.week_number <= newWeekNumber) {
            adjustedNumber = w.week_number - 1;
          }
        } else {
          // 위로 이동: 사이에 있는 주차들을 아래로
          if (w.week_number >= newWeekNumber && w.week_number < currentNumber) {
            adjustedNumber = w.week_number + 1;
          }
        }
        
        return { id: w.id, week_number: adjustedNumber };
      })
      .concat([{ id: weekId, week_number: newWeekNumber }]);

    return await reorderWeeks.mutate({ updates });
  };

  // 다음 주차 번호 가져오기
  const getNextWeekNumber = () => {
    if (!weeks || weeks.length === 0) return 1;
    return Math.max(...weeks.map(w => w.week_number)) + 1;
  };

  return {
    reorderWeeks,
    moveWeek,
    getNextWeekNumber,
  };
}