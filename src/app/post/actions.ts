"use server";

import { createClient } from "@/utils/supabase/server";
import { PostWithMissionInstanceResponse } from "@/utils/data/posts";

export async function getPost(
  id: string
): Promise<PostWithMissionInstanceResponse> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .select(
      `
        id, title, content, user_id, created_at, updated_at, 
        view_count, score, is_hidden,
        mission_instance:mission_instance_id(*)
      `
    )
    .eq("id", id)
    .single();
  return { data, error };
}
