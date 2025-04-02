import useSWR from "swr";
import { createClient } from "@/utils/supabase/client";
import { JourneyMissionInstance, Mission } from "@/types";

type MissionInstanceWithMission = JourneyMissionInstance & { mission: Mission };

/**
 * 미션 인스턴스를 가져오는 함수
 */
async function fetchMissionInstance(instanceId: number | null) {
  if (!instanceId) return null;
  
  const supabase = createClient();
  const { data, error } = await supabase
    .from("journey_mission_instances")
    .select(`*, mission:missions(*)`)
    .eq("id", instanceId)
    .single();
  
  if (error) throw new Error(error.message);
  
  return data as MissionInstanceWithMission;
}

/**
 * 단일 미션 인스턴스를 가져오는 훅 (SWR 사용)
 * @param instanceId 미션 인스턴스 ID
 * @returns 미션 인스턴스 데이터와 상태
 */
export function useMissionInstance(instanceId: number | null) {
  const { data, error, isLoading, mutate } = useSWR(
    instanceId ? `mission-instance-${instanceId}` : null,
    () => fetchMissionInstance(instanceId),
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000, // 30초 동안 중복 요청 방지
    }
  );

  return {
    missionInstance: data,
    isLoading,
    error,
    refetch: mutate
  };
} 