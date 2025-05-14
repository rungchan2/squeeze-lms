import { createClient } from "./client";

// 게시물 타입 정의
interface PostNavItem {
  id: string;
  title: string;
  created_at: string | null;
}

/**
 * 현재 게시물의 created_at을 기준으로 이전 게시물을 가져옵니다.
 * @param currentPostId 현재 게시물 ID
 * @param currentCreatedAt 현재 게시물 생성 시간
 */
export async function getPreviousPost(currentPostId: string, currentCreatedAt: string, journeyId: string): Promise<PostNavItem | null> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from("posts")
    .select("id, title, created_at")
    .eq("journey_id", journeyId)
    .lt("created_at", currentCreatedAt) // 현재 게시물보다 이전에 생성된 게시물
    .neq("id", currentPostId) // 현재 게시물 제외
    .order("created_at", { ascending: false }) // 가장 최근 것부터
    .limit(1);
  
  if (error) {
    console.error("이전 게시물 조회 오류:", error);
    return null;
  }
  
  return data?.[0] || null;
}

/**
 * 현재 게시물의 created_at을 기준으로 다음 게시물을 가져옵니다.
 * @param currentPostId 현재 게시물 ID
 * @param currentCreatedAt 현재 게시물 생성 시간
 */
export async function getNextPost(currentPostId: string, currentCreatedAt: string, journeyId: string): Promise<PostNavItem | null> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from("posts")
    .select("id, title, created_at")
    .eq("journey_id", journeyId)
    .gt("created_at", currentCreatedAt) // 현재 게시물보다 나중에 생성된 게시물
    .neq("id", currentPostId) // 현재 게시물 제외
    .order("created_at", { ascending: true }) // 가장 빠른 것부터
    .limit(1);
  
  if (error) {
    console.error("다음 게시물 조회 오류:", error);
    return null;
  }
  
  return data?.[0] || null;
} 