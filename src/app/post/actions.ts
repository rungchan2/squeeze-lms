import { createClient } from "@/utils/supabase/server";

export async function getPost(id: number) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("posts").select("*").eq("id", id);
  return { data, error };
}

export async function addViewCount(postId: number, prevViewCount: number) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("posts").update({ view_count: prevViewCount + 1 }).eq("id", postId);
  return { data, error };
}

