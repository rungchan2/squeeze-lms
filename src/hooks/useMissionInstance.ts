import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { JourneyMissionInstance, Mission } from "@/types";

type MissionInstanceWithMission = JourneyMissionInstance & { mission: Mission };

/**
 * 단일 미션 인스턴스를 가져오는 훅
 * @param instanceId 미션 인스턴스 ID
 * @returns 미션 인스턴스 데이터와 상태
 */
export function useMissionInstance(instanceId: number | null) {
  const [missionInstance, setMissionInstance] = useState<MissionInstanceWithMission | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchMissionInstance() {
      if (!instanceId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        
        const supabase = createClient();
        const { data, error } = await supabase
          .from("journey_mission_instances")
          .select(`*, mission:missions(*)`)
          .eq("id", instanceId)
          .single();

        if (error) throw new Error(error.message);
        
        if (isMounted) {
          setMissionInstance(data as MissionInstanceWithMission);
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('알 수 없는 오류가 발생했습니다.'));
          setIsLoading(false);
        }
      }
    }

    fetchMissionInstance();

    return () => {
      isMounted = false;
    };
  }, [instanceId]);

  // 데이터 다시 가져오기 함수
  const refetch = async () => {
    if (!instanceId) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const supabase = createClient();
      const { data, error } = await supabase
        .from("journey_mission_instances")
        .select(`*, mission:missions(*)`)
        .eq("id", instanceId)
        .single();

      if (error) throw new Error(error.message);
      
      setMissionInstance(data as MissionInstanceWithMission);
      setIsLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('알 수 없는 오류가 발생했습니다.'));
      setIsLoading(false);
    }
  };

  return {
    missionInstance,
    isLoading,
    error,
    refetch
  };
} 