import {
  UpdatePost,
} from "@/types";
import { createClient } from "@/utils/supabase/client";
const supabase = createClient();

// Supabase의 쿼리 결과와 일치하는 타입 정의
export type PostWithMissionInstanceResponse = {
  data: {
    id: string;
    title: string;
    content: string | null;
    user_id: string;
    created_at: string | null;
    updated_at: string | null;
    view_count: number;
    score: number | null;
    is_hidden: boolean;
    mission_instance: Record<string, any> | null;
  } | null;
  error: any;
}

export const posts = {
  getPost: async (id: string): Promise<PostWithMissionInstanceResponse> => {
    const { data, error } = await supabase
      .from("posts")
      .select(`
        id, title, content, user_id, created_at, updated_at, 
        view_count, score, is_hidden,
        mission_instance:mission_instance_id(*)
      `)
      .eq("id", id)
      .single();
    return { data, error };
  },
  deletePost: async (postId: string) => {
    const { data, error } = await supabase
      .from("posts")
      .delete()
      .eq("id", postId);
    return { data, error };
  },

  hidePost: async (postId: string) => {
    const { data, error } = await supabase
      .from("posts")
      .update({ is_hidden: true })
      .eq("id", postId);
    return { data, error };
  },

  unhidePost: async (postId: string) => {
    const { data, error } = await supabase
      .from("posts")
      .update({ is_hidden: false })
      .eq("id", postId);
    return { data, error };
  },

  updatePost: async (postId: string, post: UpdatePost) => {
    const { data, error } = await supabase
      .from("posts")
      .update(post)
      .eq("id", postId);
    return { data, error };
  },
  updateTeamPost: async (postId: string, post: {
    team_id: string;
    is_team_submission: boolean;
    team_points: number;
  }) => {
    const { data, error } = await supabase
      .from("posts")
      .update(post)
      .eq("id", postId);

    if (error) {
      throw error;
    }

    return data;
  },
  addViewCount: async (postId: string, prevViewCount: number) => {
    const { data, error } = await supabase
      .from("posts")
      .update({ view_count: prevViewCount + 1 })
      .eq("id", postId);
    return { data, error };
  },
};
