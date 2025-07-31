import {
  CreatePost,
  Post,
  UpdatePost,
} from "@/types";
import { createClient } from "@/utils/supabase/client";

export interface PostsResponse {
  data: Post[];
  nextPage: number | null;
  total: number;
}

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
  
  // Build insert data with all provided fields
  const insertData: any = {
    content: post.content,
    user_id: post.user_id,
    mission_instance_id: post.mission_instance_id,
    title: post.title,
    score: post.score,
    journey_id: post.journey_id,
    team_id: post.team_id,
    is_team_submission: post.is_team_submission,
    file_url: post.file_url,
    achievement_status: post.achievement_status,
    team_points: post.team_points,
  };

  // Include new mission-related fields if provided
  if (post.answers_data !== undefined) {
    insertData.answers_data = post.answers_data;
  }
  if (post.auto_score !== undefined) {
    insertData.auto_score = post.auto_score;
  }
  if (post.manual_score !== undefined) {
    insertData.manual_score = post.manual_score;
  }
  if (post.total_questions !== undefined) {
    insertData.total_questions = post.total_questions;
  }
  if (post.answered_questions !== undefined) {
    insertData.answered_questions = post.answered_questions;
  }
  if (post.completion_rate !== undefined) {
    insertData.completion_rate = post.completion_rate;
  }

  const { data, error } = await supabase
    .from("posts")
    .insert(insertData)
    .select("id")
    .single();
  return { data, error, id: data?.id };
}

export async function fetchPosts({ 
  pageParam = 0, 
  journeySlug, 
  showHidden = false 
}: { 
  pageParam?: number;
  journeySlug?: string;
  showHidden?: boolean;
}): Promise<PostsResponse> {
  const supabase = createClient();
  const pageSize = 10;
  const from = pageParam * pageSize;
  const to = from + pageSize - 1;
  
  let query = supabase
    .from("posts")
    .select(`
      *,
      profiles (
        id, first_name, last_name, organization_id, profile_image,
        organizations (
          id, name
        )
      )
    `, { count: 'exact' })
    .order("created_at", { ascending: false });
    
  if (!showHidden) {
    query = query.eq("is_hidden", false);
  }
  
  // journeySlug가 제공된 경우 해당 journey의 게시물만 필터링
  if (journeySlug) {
    // mission_instance_id를 통해 journey와 연결
    const { data: missionInstances } = await supabase
      .from("journey_mission_instances")
      .select("id")
      .eq("journey_id", journeySlug);
    
    if (missionInstances && missionInstances.length > 0) {
      const instanceIds = missionInstances.map(instance => instance.id);
      query = query.in("mission_instance_id", instanceIds);
    } else {
      // 해당 journey에 대한 mission instance가 없으면 빈 결과 반환
      return {
        data: [],
        nextPage: null,
        total: 0
      };
    }
  }
    
  const { data, error, count } = await query.range(from, to);
    
  if (error) throw error;
  
  const hasNextPage = count ? from + pageSize < count : false;
  const nextPage = hasNextPage ? pageParam + 1 : null;
  
  return {
    data: data as Post[],
    nextPage,
    total: count ?? 0
  };
}

export async function getJourenyPosts(journeyId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("posts")
    .select("*, mission_instance_id(*)")
    .eq("journey_id", journeyId);
  return { data, error };
}

// 페이지네이션된 게시물 조회 (메인 피드용)
export async function getPosts({ 
  pageIndex = 0, 
  pageSize = 10,
  journeySlug, 
  includeTeacher = false 
}: { 
  pageIndex?: number;
  pageSize?: number;
  journeySlug?: string;
  includeTeacher?: boolean;
}): Promise<PostsResponse> {
  const supabase = createClient();
  const from = pageIndex * pageSize;
  const to = from + pageSize - 1;
  
  let query = supabase
    .from("posts")
    .select(`
      *,
      profiles (
        id, first_name, last_name, organization_id, profile_image,
        organizations (
          id, name
        )
      )
    `, { count: 'exact' })
    .order("created_at", { ascending: false });
    
  // 숨겨진 게시물 제외
  query = query.eq("is_hidden", false);
  
  // journeySlug가 제공된 경우 해당 journey의 게시물만 필터링
  if (journeySlug && journeySlug !== 'all') {
    // mission_instance_id를 통해 journey와 연결
    const { data: missionInstances } = await supabase
      .from("journey_mission_instances")
      .select("id")
      .eq("journey_id", journeySlug);
    
    if (missionInstances && missionInstances.length > 0) {
      const instanceIds = missionInstances.map(instance => instance.id);
      query = query.in("mission_instance_id", instanceIds);
    } else {
      // 해당 journey에 대한 mission instance가 없으면 빈 결과 반환
      return {
        data: [],
        nextPage: null,
        total: 0
      };
    }
  }
    
  const { data, error, count } = await query.range(from, to);
    
  if (error) throw error;
  
  const hasNextPage = count ? from + pageSize < count : false;
  const nextPage = hasNextPage ? pageIndex + 1 : null;
  
  return {
    data: data as Post[],
    nextPage,
    total: count ?? 0
  };
}

// 내 게시물 조회
export async function getMyPosts(userId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("posts")
    .select(`
      *,
      profiles (
        id, first_name, last_name, organization_id, profile_image,
        organizations (
          id, name
        )
      )
    `)
    .eq("user_id", userId)
    .eq("is_hidden", false)
    .order("created_at", { ascending: false });
  return { data, error };
}

// 좋아요한 게시물 조회
export async function getMyLikedPosts(userId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("likes")
    .select(`
      posts!inner (
        *,
        profiles (
          id, first_name, last_name, organization_id, profile_image,
          organizations (
            id, name
          )
        )
      )
    `)
    .eq("user_id", userId)
    .eq("posts.is_hidden", false)
    .order("created_at", { ascending: false });
  
  // likes 테이블에서 조회한 결과를 posts 형태로 변환
  const transformedData = data?.map(like => (like as any).posts) || [];
  
  return { data: transformedData, error };
}

// 완료된 미션 조회
export async function getCompletedMissions(userId: string, journeySlug: string) {
  const supabase = createClient();
  
  // 해당 journey에서 사용자가 제출한 게시물의 mission_instance_id 조회
  const { data: posts, error } = await supabase
    .from("posts")
    .select(`
      mission_instance_id,
      journey_mission_instances!inner (
        id,
        mission_id
      )
    `)
    .eq("user_id", userId)
    .eq("journey_mission_instances.journey_id", journeySlug);
  
  if (error) throw error;
  
  // mission_id 목록 반환
  const completedMissionIds = posts
    ?.map(post => (post as any).journey_mission_instances?.mission_id)
    .filter(Boolean) || [];
  
  return { data: completedMissionIds, error: null };
} 