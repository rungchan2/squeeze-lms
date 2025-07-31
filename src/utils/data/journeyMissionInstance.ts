import { JourneyMissionInstance, CreateJourneyMissionInstance, Mission, UpdateJourneyMissionInstance } from "@/types";
import { createClient } from "../supabase/client";

// 여정 미션 인스턴스 목록 조회
export async function getJourneyMissionInstances(
  journeyUuid: string,
  weekId?: string | null
): Promise<(JourneyMissionInstance & { mission: Mission })[]> {
  const supabase = createClient();
  
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
}

// 단일 여정 미션 인스턴스 조회
export async function getJourneyMissionInstanceById(instanceId: string): Promise<JourneyMissionInstance & { mission: Mission }> {
  const supabase = createClient();
  
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

// 여정 미션 인스턴스 생성 (SWR용)
export async function createMissionInstance(instanceData: CreateJourneyMissionInstance): Promise<JourneyMissionInstance> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("journey_mission_instances")
    .insert(instanceData as any)
    .select(`
      *,
      mission:missions(*)
    `)
    .single();

  if (error) {
    throw error;
  }

  return data as JourneyMissionInstance;
}

// 여정 미션 인스턴스 업데이트 (SWR용)
export async function updateMissionInstance(id: string, instanceData: UpdateJourneyMissionInstance): Promise<JourneyMissionInstance> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("journey_mission_instances")
    .update(instanceData as any)
    .eq("id", id)
    .select(`
      *,
      mission:missions(*)
    `)
    .single();

  if (error) {
    throw error;
  }

  return data as JourneyMissionInstance;
}

// 여정 미션 인스턴스 삭제 (SWR용)
export async function deleteMissionInstance(id: string): Promise<boolean> {
  const supabase = createClient();

  try {
    // 1. 먼저 관련된 user_points 레코드 삭제
    const { error: pointsError } = await supabase
      .from("user_points")
      .delete()
      .eq("mission_instance_id", id);

    if (pointsError) {
      console.error("Error deleting user points:", pointsError);
      throw new Error(`포인트 데이터 삭제 중 오류: ${pointsError.message}`);
    }

    // 2. 그 다음 미션 인스턴스 삭제
    const { error: instanceError } = await supabase
      .from("journey_mission_instances")
      .delete()
      .eq("id", id);

    if (instanceError) {
      if (instanceError.code === "23503") {
        throw new Error(instanceError.code);
      } else {
        throw new Error(`미션 인스턴스 삭제 중 오류: ${instanceError.message}`);
      }
    }

    return true;
  } catch (error) {
    console.error("Error in deleteMissionInstance:", error);
    throw error;
  }
}

// 미션 인스턴스 상태 업데이트
export async function updateMissionInstanceStatus(id: string, isActive: boolean): Promise<JourneyMissionInstance> {
  const supabase = createClient();
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
}

// 미션 인스턴스 순서 업데이트
export async function updateMissionInstancesOrder(updates: { id: string; order: number }[]): Promise<boolean> {
  const supabase = createClient();
  
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
}

// 여정의 미션 인스턴스 통계 조회
export async function getJourneyMissionStats(journeyUuid: string) {
  const supabase = createClient();
  
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
}

// 특정 미션의 모든 인스턴스 조회
export async function getMissionInstances(missionId: string): Promise<JourneyMissionInstance[]> {
  const supabase = createClient();
  
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

// 기존 함수들 (하위 호환성을 위해 유지)
export async function createMissionInstanceLegacy (instanceData: CreateJourneyMissionInstance, mutate: () => void) {
  const result = await createMissionInstance(instanceData);
  mutate();
  return result as unknown as JourneyMissionInstance & { missions: Mission };
}

export async function updateMissionInstanceLegacy (id: string, instanceData: UpdateJourneyMissionInstance, mutate: () => void) {
  const result = await updateMissionInstance(id, instanceData);
  mutate();
  return result as unknown as JourneyMissionInstance & { missions: Mission };
}

export async function deleteMissionInstanceLegacy (id: string, mutate: () => void) {
  const result = await deleteMissionInstance(id);
  mutate();
  return result;
}

export async function getMissionInstanceById (id: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("journey_mission_instances")
    .select("*")
    .eq("id", id)
    .single();

    if (error) throw error

  return data;
}