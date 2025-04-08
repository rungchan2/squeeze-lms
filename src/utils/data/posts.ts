import {
  UpdatePost,
  PostWithRelationsWithJourneyMissionInstance,
  Post,
  JourneyMissionInstance
} from "@/types";
import { createClient } from "@/utils/supabase/client";
const supabase = createClient();

// Supabase의 쿼리 결과와 일치하는 타입 정의
type PostWithMissionInstanceResponse = {
  data: {
    id: number;
    title: string;
    content: string | null;
    user_id: number;
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
  getPost: async (id: number): Promise<PostWithMissionInstanceResponse> => {
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
  updateTeamPost: async (postId: number, post: {
    team_id: number;
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
  addViewCount: async (postId: number, prevViewCount: number) => {
    const { data, error } = await supabase
      .from("posts")
      .update({ view_count: prevViewCount + 1 })
      .eq("id", postId);
    return { data, error };
  },
};
