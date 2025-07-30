import { 
  useSupabaseQuery,
  createCacheKey,
  createMutation
} from '../base/useSupabaseQuery';
import { JourneyMissionInstance, Mission, CreateJourneyMissionInstance, UpdateJourneyMissionInstance } from '@/types';

// 여정 미션 인스턴스 목록 조회 훅
export function useJourneyMissionInstancesRefactored(
  journeyUuid: string | null,
  weekId?: string | null
) {
  return useSupabaseQuery<(JourneyMissionInstance & { mission: Mission })[]>(
    journeyUuid 
      ? createCacheKey('journey-mission-instances', { 
          journeyUuid, 
          weekId: weekId || 'all' 
        })
      : null,
    async (supabase) => {
      if (!journeyUuid) return [];

      let query = supabase
        .from('journey_mission_instances')
        .select(`
          *,
          mission:missions(*)
        `)
        .eq('journey_id', journeyUuid);

      // weekId가 있으면 해당 주차로 필터링
      if (weekId) {
        query = query.eq('journey_week_id', weekId);
      }

      // 정렬: 생성일 기준 오름차순
      query = query.order('created_at', { ascending: true });

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as (JourneyMissionInstance & { mission: Mission })[];
    },
    {
      dedupingInterval: 300000, // 5분 동안 중복 요청 방지
      revalidateOnFocus: false,
      revalidateOnMount: true,
    }
  );
}

// 단일 여정 미션 인스턴스 조회 훅
export function useJourneyMissionInstanceRefactored(instanceId: string | null) {
  return useSupabaseQuery<JourneyMissionInstance & { mission: Mission }>(
    instanceId 
      ? createCacheKey('journey-mission-instance', { instanceId })
      : null,
    async (supabase) => {
      if (!instanceId) throw new Error('Instance ID is required');

      const { data, error } = await supabase
        .from('journey_mission_instances')
        .select(`
          *,
          mission:missions(*)
        `)
        .eq('id', instanceId)
        .single();

      if (error) throw error;
      return data as JourneyMissionInstance & { mission: Mission };
    }
  );
}

// 여정 미션 인스턴스 CRUD 작업 훅
export function useJourneyMissionInstanceActionsRefactored() {
  
  // 미션 인스턴스 생성
  const createMissionInstance = createMutation<
    JourneyMissionInstance, 
    CreateJourneyMissionInstance
  >(
    async (supabase, instanceData) => {
      const { data, error } = await supabase
        .from('journey_mission_instances')
        .insert(instanceData)
        .select(`
          *,
          mission:missions(*)
        `)
        .single();

      if (error) throw error;
      return data as JourneyMissionInstance;
    },
    {
      revalidateKeys: ['journey-mission-instances'],
    }
  );

  // 미션 인스턴스 업데이트
  const updateMissionInstance = createMutation<
    JourneyMissionInstance,
    { id: string; updates: UpdateJourneyMissionInstance }
  >(
    async (supabase, { id, updates }) => {
      const { data, error } = await supabase
        .from('journey_mission_instances')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          mission:missions(*)
        `)
        .single();

      if (error) throw error;
      return data as JourneyMissionInstance;
    },
    {
      revalidateKeys: ['journey-mission-instances', 'journey-mission-instance'],
    }
  );

  // 미션 인스턴스 삭제
  const deleteMissionInstance = createMutation<boolean, string>(
    async (supabase, instanceId) => {
      const { error } = await supabase
        .from('journey_mission_instances')
        .delete()
        .eq('id', instanceId);

      if (error) throw error;
      return true;
    },
    {
      revalidateKeys: ['journey-mission-instances'],
    }
  );

  // 미션 인스턴스 상태 업데이트 (활성화/비활성화)
  const updateInstanceStatus = createMutation<
    JourneyMissionInstance,
    { id: string; isActive: boolean }
  >(
    async (supabase, { id, isActive }) => {
      const { data, error } = await supabase
        .from('journey_mission_instances')
        .update({ 
          is_active: isActive,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select(`
          *,
          mission:missions(*)
        `)
        .single();

      if (error) throw error;
      return data as JourneyMissionInstance;
    },
    {
      revalidateKeys: ['journey-mission-instances', 'journey-mission-instance'],
    }
  );

  // 미션 인스턴스 순서 업데이트
  const updateInstanceOrder = createMutation<
    boolean,
    { updates: { id: string; order: number }[] }
  >(
    async (supabase, { updates }) => {
      // 트랜잭션으로 여러 인스턴스의 순서를 한 번에 업데이트
      const updatePromises = updates.map(({ id, order }) =>
        supabase
          .from('journey_mission_instances')
          .update({ 
            order_index: order,
            updated_at: new Date().toISOString()
          })
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
      revalidateKeys: ['journey-mission-instances'],
    }
  );

  return {
    createMissionInstance,
    updateMissionInstance,
    deleteMissionInstance,
    updateInstanceStatus,
    updateInstanceOrder,
  };
}

// 여정의 주차별 미션 인스턴스 통계 조회 훅
export function useJourneyMissionStatsRefactored(journeyUuid: string | null) {
  return useSupabaseQuery(
    journeyUuid 
      ? createCacheKey('journey-mission-stats', { journeyUuid })
      : null,
    async (supabase) => {
      if (!journeyUuid) return {};

      // 전체 미션 인스턴스 수
      const { count: totalInstances } = await supabase
        .from('journey_mission_instances')
        .select('*', { count: 'exact', head: true })
        .eq('journey_id', journeyUuid);

      // 활성 미션 인스턴스 수
      const { count: activeInstances } = await supabase
        .from('journey_mission_instances')
        .select('*', { count: 'exact', head: true })
        .eq('journey_id', journeyUuid)
        .eq('is_active', true);

      // 주차별 미션 수
      const { data: weeklyStats } = await supabase
        .from('journey_mission_instances')
        .select('journey_week_id')
        .eq('journey_id', journeyUuid);

      const weeklyCount = weeklyStats?.reduce((acc, item) => {
        const weekId = item.journey_week_id;
        if (weekId) {
          acc[weekId] = (acc[weekId] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>) || {};

      return {
        totalInstances: totalInstances || 0,
        activeInstances: activeInstances || 0,
        weeklyCount,
      };
    },
    {
      dedupingInterval: 600000, // 10분 동안 중복 요청 방지
    }
  );
}

// 특정 미션의 모든 인스턴스 조회 훅 (여러 여정에서 사용되는 미션 추적)
export function useMissionInstancesRefactored(missionId: string | null) {
  return useSupabaseQuery<JourneyMissionInstance[]>(
    missionId 
      ? createCacheKey('mission-instances', { missionId })
      : null,
    async (supabase) => {
      if (!missionId) return [];

      const { data, error } = await supabase
        .from('journey_mission_instances')
        .select(`
          *,
          journeys (
            id,
            title,
            slug
          )
        `)
        .eq('mission_id', missionId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as JourneyMissionInstance[];
    }
  );
}