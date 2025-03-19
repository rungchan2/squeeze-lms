"use server";

import { CreatePost, CreateJourney } from "@/types";
import { createClient } from "@/utils/supabase/server";

export async function getJourney(uuid: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("journeys").select("*").eq("uuid", uuid).single();
  return {data, error};
}

export async function getJourneyWeeks(journeyId: number) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("journey_weeks").select("*").eq("journey_id", journeyId);
  return {data, error};
}

export async function getMissionTypes() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_distinct_mission_types" as any);
  return { data, error };
}

export async function getMissionInstanceById(id: number) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("journey_mission_instances").select("*").eq("id", id);
  return { data, error };
}

export async function getMissionInstanceByWeekId(weekId: number) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("journey_mission_instances").select("*").eq("journey_week_id", weekId);
  return { data, error };
}

export async function createPost(post: CreatePost) {
  const supabase = await createClient();
  const insertData: CreatePost = {
    content: post.content, 
    user_id: post.user_id,
    mission_instance_id: post.mission_instance_id,
    title: post.title,
    file_url: post.file_url,
    score: post.score,
  }
  const { data, error } = await supabase.from("posts").insert(insertData);
  
  console.log("inaction file", data, error);
  return { data, error };
}

export async function createJourney(journey: CreateJourney) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("journeys").insert(journey);
  return { data, error };
}

export async function updateJourney(id: number, journey: CreateJourney) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("journeys").update(journey).eq("id", id);
  return { data, error };
}

export async function deleteJourney(id: number) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("journeys").delete().eq("id", id);
  return { data, error };
}

