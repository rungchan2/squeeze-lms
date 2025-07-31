import { CreateJourney, Journey } from "@/types";
import { createClient } from "@/utils/supabase/client";

export async function getAllJourneys() {
  const supabase = createClient();
  const { data, error } = await supabase.from("journeys").select("*");
  if (error) {
    throw new Error(error.message);
  }
  return data;
}

export async function getJourney(journeyId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("journeys")
    .select("*")
    .eq("id", journeyId);
  if (error) {
    throw new Error(error.message);
  }
  return data;
}

// 단일 여정 조회 (single 사용)
export async function getJourneyById(journeyId: string): Promise<Journey> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("journeys")
    .select("*")
    .eq("id", journeyId)
    .single();
  if (error) {
    throw error;
  }
  return data as Journey;
}

// 슬러그로 여정 조회 (ID를 슬러그로 사용)
export async function getJourneyBySlug(slug: string): Promise<Journey> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("journeys")
    .select("*")
    .eq("id", slug) // 현재 구현에서는 ID를 slug로 사용
    .single();
  if (error) {
    throw error;
  }
  return data as Journey;
}

// 실제 슬러그 필드로 여정 조회
export async function getJourneyByActualSlug(slug: string): Promise<Journey> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("journeys")
    .select("*")
    .eq("slug", slug) // 실제 slug 필드 사용
    .single();
  if (error) {
    throw error;
  }
  return data as Journey;
}

// 여정 상세 정보 조회 (관련 데이터 포함)
export async function getJourneyDetailsById(journeyId: string) {
  const supabase = createClient();
  
  // 기본 여정 정보와 관련 데이터
  const { data, error } = await supabase
    .from("journeys")
    .select(`
      *,
      organizations (
        id,
        name
      ),
      journey_weeks (
        id,
        title,
        week_number,
        start_date,
        end_date
      )
    `)
    .eq("id", journeyId)
    .single();

  if (error) {
    throw error;
  }

  // 참여자 수 조회
  const { count: userCount } = await supabase
    .from("user_journeys")
    .select("*", { count: "exact", head: true })
    .eq("journey_id", journeyId);

  return {
    ...data,
    user_journeys_count: userCount || 0,
  };
}

// 여정 진행 상황 정보 조회
export async function getJourneyProgressById(journeyId: string) {
  const supabase = createClient();
  
  // 기본 여정 정보
  const { data: journey, error: journeyError } = await supabase
    .from("journeys")
    .select("*")
    .eq("id", journeyId)
    .single();

  if (journeyError) throw journeyError;

  // 전체 주차 수
  const { count: totalWeeks } = await supabase
    .from("journey_weeks")
    .select("*", { count: "exact", head: true })
    .eq("journey_id", journeyId);

  // 전체 미션 수
  const { count: totalMissions } = await supabase
    .from("journey_mission_instances")
    .select("*", { count: "exact", head: true })
    .eq("journey_id", journeyId);

  // 전체 게시물 수
  const { count: totalPosts } = await supabase
    .from("posts")
    .select("journey_mission_instances!inner(*)", { count: "exact", head: true })
    .eq("journey_mission_instances.journey_id", journeyId);

  // 참여자 수
  const { count: participantCount } = await supabase
    .from("user_journeys")
    .select("*", { count: "exact", head: true })
    .eq("journey_id", journeyId);

  // 현재 활성 주차 계산 (현재 날짜 기준)
  const now = new Date();
  const { data: currentWeek } = await supabase
    .from("journey_weeks")
    .select("*")
    .eq("journey_id", journeyId)
    .lte("start_date", now.toISOString())
    .gte("end_date", now.toISOString())
    .maybeSingle();

  return {
    journey: journey as Journey,
    stats: {
      totalWeeks: totalWeeks || 0,
      totalMissions: totalMissions || 0,
      totalPosts: totalPosts || 0,
      participantCount: participantCount || 0,
    },
    currentWeek: currentWeek || null,
    progress: {
      weeksCompleted: 0, // 완료된 주차 수 (별도 계산 필요)
      missionsCompleted: 0, // 완료된 미션 수 (별도 계산 필요)
      completionRate: 0, // 전체 완료율 (별도 계산 필요)
    },
  };
}

// 여정 검색 (슬러그 또는 제목 매칭)
export async function searchJourneysBySlug(searchTerm: string): Promise<Journey[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("journeys")
    .select("*")
    .or(`slug.ilike.%${searchTerm}%,title.ilike.%${searchTerm}%`)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    throw error;
  }
  return (data || []) as Journey[];
}

export async function getJourneyByUuidRetrieveId(journeyUuid: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("journeys")
    .select("id")
    .eq("id", journeyUuid);
  if (error) {
    throw error;
  }
  return data as { id: string }[];
}

export async function deleteJourney(id: string) {
  const supabase = createClient();
  const { data, error } = await supabase.from("journeys").delete().eq("id", id);
  return { data, error };
}

export async function updateJourney(id: string, journey: CreateJourney) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("journeys")
    .update(journey)
    .eq("id", id);
  return { data, error };
}

export async function createJourney(journey: CreateJourney) {
  const supabase = createClient();
  const { data, error } = await supabase.from("journeys").insert(journey);
  return { data, error };
}