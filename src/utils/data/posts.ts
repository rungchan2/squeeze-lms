import {
  CreatePost,
  UpdatePost,
} from "@/types";
import { createClient } from "@/utils/supabase/client";

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
}

export async function getPost(id: string): Promise<PostWithMissionInstanceResponse> {
  const supabase = createClient();
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
}

export async function deletePost(postId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("posts")
    .delete()
    .eq("id", postId);
  return { data, error };
}

export async function hidePost(postId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("posts")
    .update({ is_hidden: true })
    .eq("id", postId);
  return { data, error };
}

export async function unhidePost(postId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("posts")
    .update({ is_hidden: false })
    .eq("id", postId);
  return { data, error };
}

export async function updateTeamPost(postId: string, post: {
  team_id: string;
  is_team_submission: boolean;
  team_points: number;
}) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("posts")
    .update(post)
    .eq("id", postId);

  if (error) {
    throw error;
  }

  return data;
}

export async function addViewCount(postId: string, prevViewCount: number) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("posts")
    .update({ view_count: prevViewCount + 1 })
    .eq("id", postId);
  return { data, error };
}

export async function updatePost(post: UpdatePost, id: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("posts")
    .update(post)
    .eq("id", id);
  return { data, error };
}
export async function createPost(post: CreatePost) {
  const supabase = createClient();
  const insertData: CreatePost = {
    content: post.content,
    user_id: post.user_id,
    mission_instance_id: post.mission_instance_id,
    title: post.title,
    score: post.score,
  };
  const { data, error } = await supabase
    .from("posts")
    .insert(insertData)
    .select("id")
    .single();
  return { data, error, id: data?.id };
}

