import { createClient } from "@/utils/supabase/client";
import { CreateUserPoints } from "@/types";
import { Database } from "@/types/database.types";

export type UpdateUserPoints = Database["public"]["Tables"]["user_points"]["Update"];
export type UserPoints = Database["public"]["Tables"]["user_points"]["Row"];

const userPoint = {
  getUserPoints: async (userId: number) => {
    const supabase = createClient();
    const { data, error } = await supabase.from("user_points").select("*, mission_instances(*)").eq("profile_id", userId);
    return { data, error };
  },
  
  createUserPoint: async (UserPointData: CreateUserPoints) => {
    const supabase = createClient();
    
    try {
      // mission_instance_id가 null이면 기본값 0 사용
      const missionInstanceId = UserPointData.mission_instance_id || 0;

      // 접근 방식 1: post_id가 있는 경우에만 중복 체크
      if (UserPointData.post_id) {
        // post_id를 기준으로 중복 검사 (더 정확한 중복 검사)
        const { data: existingByPostId, error: postCheckError } = await supabase
          .from("user_points")
          .select("id")
          .eq("post_id", UserPointData.post_id)
          .maybeSingle();
        
        if (postCheckError) {
          console.error("포스트 ID로 중복 체크 중 오류:", postCheckError);
        }
        
        // post_id로 이미 존재하면 중복으로 간주하고 기존 레코드를 반환
        if (existingByPostId) {
          return { data: existingByPostId, error: null };
        }
      }
      
      // 접근 방식 2: 동일한 미션 인스턴스와 유저에 대한 포인트가 이미 있는지 확인
      const { data: existingPoint, error: checkError } = await supabase
        .from("user_points")
        .select("id")
        .eq("profile_id", UserPointData.profile_id)
        .eq("mission_instance_id", missionInstanceId)
        .maybeSingle();
      
      if (checkError) {
        console.error("중복 체크 중 오류:", checkError);
      }
        
      // 이미 존재하는 경우 충돌 방지를 위해 업데이트
      if (existingPoint) {
        const updateData: any = {
          total_points: UserPointData.total_points
        };
        
        // post_id가 있는 경우에만 업데이트 필드에 추가
        if (UserPointData.post_id) {
          updateData.post_id = UserPointData.post_id;
        }
        
        const { data, error } = await supabase
          .from("user_points")
          .update(updateData)
          .eq("id", existingPoint.id)
          .select();
        
        if (error) {
          console.error("포인트 업데이트 오류:", error);
        }
        
        return { data, error };
      }
      
      // 새 레코드 생성
      
      const { data, error } = await supabase.from("user_points").insert({
        profile_id: UserPointData.profile_id,
        mission_instance_id: missionInstanceId,
        post_id: UserPointData.post_id,
        total_points: UserPointData.total_points
      });
      
      if (error) {
        console.error("포인트 생성 오류:", error);
      } else {
      }
      
      return { data, error: null };
    } catch (error) {
      console.error("유저 포인트 처리 중 예외 발생:", error);
      return { data: null, error };
    }
  }
}

export default userPoint;