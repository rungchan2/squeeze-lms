import type { MetadataRoute } from 'next'
import { createClient, createSitemapClient } from "@/utils/supabase/server";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.squeezeedu.com';

async function getJourneys() {
  try {
    // 사이트맵 전용 클라이언트 사용
    const supabase = await createSitemapClient();
    const { data: journeys, error } = await supabase
      .from("journeys")
      .select("id, updated_at");
    
    if (error) {
      console.error("Journey 로드 오류:", error);
      return [];
    }
    
    console.log(`Journey 로드 성공: ${journeys?.length || 0}개 항목`);
    return journeys || [];
  } catch (e) {
    console.error("Journey 로드 중 예외 발생:", e);
    return [];
  }
}

async function getPosts() {
  try {
    // 사이트맵 전용 클라이언트 사용
    const supabase = await createSitemapClient();
    const { data: posts, error } = await supabase
      .from("posts")
      .select("id, updated_at");
    
    if (error) {
      console.error("Post 로드 오류:", error);
      return [];
    }
    
    console.log(`Post 로드 성공: ${posts?.length || 0}개 항목`);
    return posts || [];
  } catch (e) {
    console.error("Post 로드 중 예외 발생:", e);
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  console.log("사이트맵 생성 시작");
  
  // 정적 경로
  const staticRoutes = [
    {
      url: `${BASE_URL}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${BASE_URL}/bug-report`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/login`,
      lastModified: new Date(),
      changeFrequency: 'yearly' as const,
      priority: 0.3,
    },
  ];
  
  console.log("정적 경로 설정 완료:", staticRoutes.length);

  // 동적 경로 - 여정
  const journeys = await getJourneys();
  const journeyRoutes = journeys
    .filter(journey => journey.updated_at)
    .map((journey) => ({
      url: `${BASE_URL}/journey/${journey.id}`,
      lastModified: new Date(journey.updated_at!),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));
  
  console.log("여정 경로 설정 완료:", journeyRoutes.length);

  // 동적 경로 - 포스트
  const posts = await getPosts();
  const postRoutes = posts
    .filter(post => post.updated_at)
    .map((post) => ({
      url: `${BASE_URL}/post/${post.id}`,
      lastModified: new Date(post.updated_at!),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));
  
  console.log("포스트 경로 설정 완료:", postRoutes.length);
  
  const allRoutes = [...staticRoutes, ...journeyRoutes, ...postRoutes];
  console.log("총 사이트맵 URL 수:", allRoutes.length);
  
  return allRoutes;
} 