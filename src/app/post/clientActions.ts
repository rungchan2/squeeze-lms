import { createClient } from "@/utils/supabase/client";

export async function deletePost(postId: number) {
  const supabase = createClient();
  const { data, error } = await supabase.from("posts").delete().eq("id", postId);
  return { data, error };
}