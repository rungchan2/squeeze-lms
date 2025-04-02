import type { MetadataRoute } from 'next'
import { createClient } from "@/utils/supabase/server";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://squeezeedu.co.kr';

async function getJourneys() {
  const supabase = await createClient();
  const { data: journeys } = await supabase
    .from("journeys")
    .select("uuid, updated_at");
  return journeys || [];
}

async function getPosts() {
  const supabase = await createClient();
  const { data: posts } = await supabase
    .from("posts")
    .select("id, updated_at");
  return posts || [];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
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

  // 동적 경로 - 여정
  const journeys = await getJourneys();
  const journeyRoutes = journeys
    .filter(journey => journey.updated_at)
    .map((journey) => ({
      url: `${BASE_URL}/journey/${journey.uuid}`,
      lastModified: new Date(journey.updated_at!),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));

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

  return [...staticRoutes, ...journeyRoutes, ...postRoutes];
} 