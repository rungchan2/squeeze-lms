import { createClient } from "@/utils/supabase/client";

export async function deletePost(postId: number) {
  const supabase = createClient();
  const { data, error } = await supabase.from("posts").delete().eq("id", postId);
  return { data, error };
}

export async function hidePost(postId: number) {
  const supabase = createClient();
  const { data, error } = await supabase.from("posts").update({ is_hidden: true }).eq("id", postId);
  return { data, error };
}

export async function unhidePost(postId: number) {
  const supabase = createClient();
  const { data, error } = await supabase.from("posts").update({ is_hidden: false }).eq("id", postId);
  return { data, error };
}
