import { createClient } from "@/utils/supabase/server";
import { UpdatePost } from "@/types";

export async function getPost(id: number) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("posts").select("title, content, user_id").eq("id", id).single();
  return { data, error };
}

export async function addViewCount(postId: number, prevViewCount: number) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .update({ view_count: prevViewCount + 1 })
    .eq("id", postId);
  return { data, error };
}

export async function updatePost(postId: number, post: UpdatePost) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .update(post)
    .eq("id", postId);
  return { data, error };
}
