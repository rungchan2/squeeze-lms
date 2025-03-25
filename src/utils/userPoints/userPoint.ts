import { createClient } from "@/utils/supabase/client";
import { CreateUserPoints } from "@/types";
import { Database } from "@/types/database.types";

export type UpdateUserPoints = Database["public"]["Tables"]["user_points"]["Update"];
export type UserPoints = Database["public"]["Tables"]["user_points"]["Row"];

const userPoint = {
  getUserPoints: async (userId: number) => {
    const supabase = createClient();
    const { data, error } = await supabase.from("user_points").select("*").eq("user_id", userId);
    return { data, error };
  },
  
  createUserPoint: async (UserPointData: CreateUserPoints) => {
    const supabase = createClient();
    const { data, error } = await supabase.from("user_points").insert({
      profile_id: UserPointData.user_id,
      journey_id: UserPointData.journey_id || 0,
      mission_instance_id: UserPointData.mission_instance_id || 0,
      post_id: UserPointData.post_id,
      total_points: UserPointData.amount
    });
    return { data, error };
  }
}

export default userPoint;