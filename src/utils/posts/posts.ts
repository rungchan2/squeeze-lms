import { UpdatePost } from "@/types";
import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

export const posts = {
  getPost: async (id: number) => {
    const { data, error } = await supabase
      .from("posts")
      .select("title, content, user_id")
      .eq("id", id)
      .single();
    return { data, error };
  },
  deletePost: async (postId: number) => {
    const { data, error } = await supabase
      .from("posts")
      .delete()
      .eq("id", postId);
    return { data, error };
  },

  hidePost: async (postId: number) => {
    const { data, error } = await supabase
      .from("posts")
      .update({ is_hidden: true })
      .eq("id", postId);
    return { data, error };
  },

  unhidePost: async (postId: number) => {
    const { data, error } = await supabase
      .from("posts")
      .update({ is_hidden: false })
      .eq("id", postId);
    return { data, error };
  },

  updatePost: async (postId: number, post: UpdatePost) => {
    const { data, error } = await supabase
      .from("posts")
      .update(post)
      .eq("id", postId);
    return { data, error };
  },
  addViewCount: async (postId: number, prevViewCount: number) => {
    const { data, error } = await supabase
      .from("posts")
      .update({ view_count: prevViewCount + 1 })
      .eq("id", postId);
    return { data, error };
  },
};
