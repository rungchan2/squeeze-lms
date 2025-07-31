import { 
  useSupabaseQuery,
  createCacheKey,
  createMutation
} from '../base/useSupabaseQuery';
import { JourneyMissionInstance, Mission, CreateJourneyMissionInstance, UpdateJourneyMissionInstance } from '@/types';
import {
  getJourneyMissionInstances,
  getJourneyMissionInstanceById,
  createMissionInstance,
  updateMissionInstance,
  deleteMissionInstance,
  updateMissionInstanceStatus,
  updateMissionInstancesOrder,
  getJourneyMissionStats,
  getMissionInstances
} from '@/utils/data/journeyMissionInstance';

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
    async () => {
      if (!journeyUuid) return [];
      return await getJourneyMissionInstances(journeyUuid, weekId);
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
    async () => {
      if (!instanceId) throw new Error('Instance ID is required');
      return await getJourneyMissionInstanceById(instanceId);
    }
  );
}

// 여정 미션 인스턴스 CRUD 작업 훅
export function useJourneyMissionInstanceActionsRefactored() {
  
  // 미션 인스턴스 생성
  const createMissionInstanceMutation = createMutation<
    JourneyMissionInstance, 
    CreateJourneyMissionInstance
  >(
    async (instanceData) => {
      return await createMissionInstance(instanceData);
    },
    {
      revalidateKeys: ['journey-mission-instances'],
    }
  );

  // 미션 인스턴스 업데이트
  const updateMissionInstanceMutation = createMutation<
    JourneyMissionInstance,
    { id: string; updates: UpdateJourneyMissionInstance }
  >(
    async ({ id, updates }) => {
      return await updateMissionInstance(id, updates);
    },
    {
      revalidateKeys: ['journey-mission-instances', 'journey-mission-instance'],
    }
  );

  // 미션 인스턴스 삭제
  const deleteMissionInstanceMutation = createMutation<boolean, string>(
    async (instanceId) => {
      return await deleteMissionInstance(instanceId);
    },
    {
      revalidateKeys: ['journey-mission-instances'],
    }
  );

  // 미션 인스턴스 상태 업데이트 (활성화/비활성화)
  const updateInstanceStatusMutation = createMutation<
    JourneyMissionInstance,
    { id: string; isActive: boolean }
  >(
    async ({ id, isActive }) => {
      return await updateMissionInstanceStatus(id, isActive);
    },
    {
      revalidateKeys: ['journey-mission-instances', 'journey-mission-instance'],
    }
  );

  // 미션 인스턴스 순서 업데이트
  const updateInstanceOrderMutation = createMutation<
    boolean,
    { updates: { id: string; order: number }[] }
  >(
    async ({ updates }) => {
      return await updateMissionInstancesOrder(updates);
    },
    {
      revalidateKeys: ['journey-mission-instances'],
    }
  );

  return {
    createMissionInstance: createMissionInstanceMutation,
    updateMissionInstance: updateMissionInstanceMutation,
    deleteMissionInstance: deleteMissionInstanceMutation,
    updateInstanceStatus: updateInstanceStatusMutation,
    updateInstanceOrder: updateInstanceOrderMutation,
  };
}

// 여정의 주차별 미션 인스턴스 통계 조회 훅
export function useJourneyMissionStatsRefactored(journeyUuid: string | null) {
  return useSupabaseQuery(
    journeyUuid 
      ? createCacheKey('journey-mission-stats', { journeyUuid })
      : null,
    async () => {
      if (!journeyUuid) return {};
      return await getJourneyMissionStats(journeyUuid);
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
    async () => {
      if (!missionId) return [];
      return await getMissionInstances(missionId);
    }
  );
}