"use server";

import { CreatePost, CreateJourney, UpdatePost, CreateMission } from "@/types";
import { createClient } from "@/utils/supabase/server";

export async function getJourney(uuid: string) {
  console.log("[SERVER] getJourney 호출됨:", uuid);
  
  if (!uuid) {
    console.error("[SERVER] getJourney: uuid가 제공되지 않았습니다");
    return { data: null, error: new Error("UUID가 제공되지 않았습니다") };
  }
  
  try {
    const supabase = await createClient();
    console.log("[SERVER] supabase 클라이언트 생성됨");
    
    const response = await supabase
      .from("journeys")
      .select("*")
      .eq("uuid", uuid)
      .single();
    
    console.log("[SERVER] 쿼리 완료:", 
      response ? "응답 있음" : "응답 없음",
      "데이터:", response?.data ? "있음" : "없음", 
      "에러:", response?.error ? "있음" : "없음");
    
    return response;
  } catch (error) {
    console.error("[SERVER] getJourney 오류:", error);
    return { data: null, error };
  }
}

export async function getJourneyWeeks(journeyId: number) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("journey_weeks")
    .select("*")
    .eq("journey_id", journeyId);
  return { data, error };
}

export async function getMissionTypes() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc(
    "get_distinct_mission_types" as any
  );
  return { data, error };
}

export async function getMissionInstanceById(id: number) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("journey_mission_instances")
    .select("*")
    .eq("id", id);
  return { data, error };
}

export async function getMissionInstanceByWeekId(weekId: number) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("journey_mission_instances")
    .select("*")
    .eq("journey_week_id", weekId);
  return { data, error };
}

export async function createPost(post: CreatePost) {
  const supabase = await createClient();
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

export async function updatePost(post: UpdatePost, id: number) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .update(post)
    .eq("id", id);
  return { data, error };
}

export async function createJourney(journey: CreateJourney) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("journeys").insert(journey);
  return { data, error };
}

export async function updateJourney(id: number, journey: CreateJourney) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("journeys")
    .update(journey)
    .eq("id", id);
  return { data, error };
}

export async function deleteJourney(id: number) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("journeys").delete().eq("id", id);
  return { data, error };
}

export async function getUserPointsByJourneyId(journeyId: number | null) {
  if (!journeyId) {
    return { data: [], error: null };
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_points")
    .select("*")
    .eq("journey_id", journeyId);
  return { data, error };
}

export async function getJourneyUserbyJourneyId(journeyId: number) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_journeys")
    .select("*")
    .eq("journey_id", journeyId);
  return { data, error };
}

export async function deleteUserFromJourney(journeyId: number, userId: number) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_journeys")
    .delete()
    .eq("journey_id", journeyId)
    .eq("user_id", userId);
  return { data, error };
}

export async function deletePost(postId: number) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("posts").delete().eq("id", postId);
  return { data, error };
} 

export async function createMission(mission: CreateMission) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("missions").insert(mission);
  return { data, error };
}

export async function getMission(id: number) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("missions").select("*").eq("id", id).single();
  return { data, error };
}


