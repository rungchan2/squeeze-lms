import { JourneyMissionInstance, CreateJourneyMissionInstance, Mission, UpdateJourneyMissionInstance } from "@/types";
import { createClient } from "../supabase/client";

export async function createMissionInstance (instanceData: CreateJourneyMissionInstance, mutate: () => void) {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("journey_mission_instances")
        .insert(instanceData as any)
        .select(
          `
        *,
        missions(*)
      `
        )
        .single();

      if (error) {
        throw new Error(error.message);
      }

      // 캐시 업데이트
      mutate();

      return data as unknown as JourneyMissionInstance & { missions: Mission };
    }

export async function updateMissionInstance (id: string, instanceData: UpdateJourneyMissionInstance, mutate: () => void) {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("journey_mission_instances")
        .update(instanceData as any)
        .eq("id", id)
        .select(
          `
        *,
        missions(*)
      `
        )
        .single();

      if (error) {
        throw new Error(error.message);
      }

      // 캐시 업데이트
      mutate();

      return data as unknown as JourneyMissionInstance & { missions: Mission };
    }



export async function deleteMissionInstance (id: string, mutate: () => void) {
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
          throw new Error(
            `미션 인스턴스 삭제 중 오류: ${instanceError.message}`
          );
        }

        // 캐시 업데이트
        mutate();

        return true;
      } catch (error) {
        console.error("Error in deleteMissionInstance:", error);
        throw error;
      }
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