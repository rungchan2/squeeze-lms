import useSWR from "swr";
import useSWRInfinite from "swr/infinite";
import { createClient } from "@/utils/supabase/client";
import { PostWithRelations } from "@/types";
import { useState, useCallback, useEffect } from "react";
import { getTeamMembers } from "@/utils/data/team";

// 포스트 페이지 결과 타입
interface PostsPage {
  data: PostWithRelations[];
  nextPage: number | null;
  total: number;
}

// 게시물을 페이지네이션으로 가져오는 함수
async function getPosts(
  key: string,
  pageIndex: number,
  pageSize: number,
  journeySlug?: string,
  showHidden = false,
  userId?: string
): Promise<PostsPage> {
  const supabase = createClient();

  const from = pageIndex * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("posts")
    .select(
      `
      *,
      profiles (
        id, email, first_name, last_name, organization_id, profile_image, created_at,
        organizations (
          id, name
        )
      ),
      teams (
        id, name
      ),
      journey_mission_instances!mission_instance_id (
        id,
        journey_week_id,
        missions (
          id, name, description, points, mission_type
        )
      )
    `,
      { count: "exact" }
    )
    .order("created_at", { ascending: false });

  if (!showHidden) {
    query = query.eq("is_hidden", false);
  }
  if (journeySlug) {
    query = query.eq("journey_id", journeySlug);
  }
  if (userId) {
    query = query.eq("user_id", userId);
  }
  const { data, error, count } = await query.range(from, to);

  
  if (error) throw error;

  const hasNextPage = count ? from + pageSize < count : false;
  const nextPage = hasNextPage ? pageIndex + 1 : null;

  return {
    data: data as unknown as PostWithRelations[],
    nextPage,
    total: count ?? 0,
  };
}

async function getCompletedMissionIds(
  key: string,
  userId: string,
  journeySlug?: string
) {
  if (!userId) return [];

  const supabase = createClient();

  try {
    // 방법 1: posts 테이블에서 직접 완료된 미션 확인
    let query = supabase
      .from("posts")
      .select("mission_instance_id")
      .eq("user_id", userId)
      .eq("is_hidden", false); // 숨겨진 게시물 제외

    // journeySlug가 제공된 경우 해당 journey의 게시물만 필터링
    if (journeySlug) {
      // mission_instance_id를 통해 journey와 연결
      const { data: missionInstances, error: instanceError } = await supabase
        .from("journey_mission_instances")
        .select("id")
        .eq("journey_id", journeySlug);

      if (instanceError) {
        console.error("미션 인스턴스 조회 오류:", instanceError);
      }

      if (missionInstances && missionInstances.length > 0) {
        const instanceIds = missionInstances.map((instance) => instance.id);
        query = query.in("mission_instance_id", instanceIds);
      } else {
        // 해당 journey에 대한 mission instance가 없으면 빈 결과 반환
        return [];
      }
    }

    const { data: postsData, error: postsError } = await query;

    if (postsError) {
      console.error("Posts 조회 오류:", postsError);
      return [];
    }

    // 방법 2: 추가로 user_points 테이블에서도 완료된 미션 확인 (더 정확한 결과)
    const { data: pointsData, error: pointsError } = await supabase
      .from("user_points")
      .select("mission_instance_id")
      .eq("profile_id", userId)
      .not("mission_instance_id", "is", null);

    if (pointsError) {
      console.error("User points 조회 오류:", pointsError);
    }

    // 두 결과 병합
    const completedFromPosts = postsData
      .filter((post) => post.mission_instance_id !== null)
      .map((post) => post.mission_instance_id as string);

    const completedFromPoints = pointsData
      ? pointsData
          .filter((point) => point.mission_instance_id !== null)
          .map((point) => point.mission_instance_id as string)
      : [];

    // 중복 제거하여 병합
    const completedIds = [
      ...new Set([...completedFromPosts, ...completedFromPoints]),
    ];

    return completedIds;
  } catch (error) {
    console.error("완료된 미션 조회 중 예외 발생:", error);
    return [];
  }
}

export function usePosts(
  pageSize = 10,
  journeySlug?: string,
  showHidden = false,
  userId?: string
) {
  const [posts, setPosts] = useState<PostWithRelations[]>([]);
  const [total, setTotal] = useState(0);

  const getKey = (pageIndex: number, previousPageData: PostsPage | null) => {
    // 이전 페이지 데이터가 없거나 더 불러올 페이지가 있는 경우
    if (previousPageData === null || previousPageData.nextPage !== null) {
      return [
        `posts-${journeySlug || "all"}-${showHidden ? "hidden" : "visible"}-${userId || "all"}`,
        pageIndex,
        pageSize,
        journeySlug,
        showHidden,
        userId,
      ];
    }
    return null; // 더 이상 데이터가 없으면 null 반환
  };


  const { data, error, size, setSize, isLoading, isValidating, mutate } =
    useSWRInfinite<PostsPage>(
      getKey,
      ([key, pageIndex, pageSize, journeySlug, showHiddenParam, userId]) =>
        getPosts(key, pageIndex, pageSize, journeySlug, showHiddenParam, userId),
      {
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
        revalidateIfStale: false,
        dedupingInterval: 60000, // 60초 동안 중복 요청 방지
        keepPreviousData: true,
      }
    );

  // 데이터가 로드되면 상태 업데이트
  useEffect(() => {
    if (data) {
      const allPosts = data.flatMap((page) => page.data);
      setPosts(allPosts);

      if (data.length > 0 && data[0].total !== undefined) {
        setTotal(data[0].total);
      }
    }
  }, [data]);

  // 다음 페이지 불러오기 함수
  const fetchNextPage = useCallback(() => {
    setSize(size + 1);
  }, [size, setSize]);

  // 다음 페이지가 있는지 확인
  const hasNextPage = data ? data[data.length - 1]?.nextPage !== null : false;

  return {
    data: posts,
    error,
    isLoading,
    isFetchingNextPage: isValidating && !isLoading,
    fetchNextPage,
    hasNextPage,
    refetch: mutate,
    total,
  };
}

// ✅ SWR을 사용한 useCompletedMissions 훅
export function useCompletedMissions(userId: string, journeySlug?: string) {
  const { data, error, isLoading, mutate } = useSWR(
    userId ? [`completed-missions-${userId}`, userId, journeySlug] : null,
    ([key, id, slug]) => getCompletedMissionIds(key, id, slug),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
      dedupingInterval: 5 * 60 * 1000, // 5분 동안 중복 요청 방지
      keepPreviousData: true,
    }
  );

  return {
    completedMissionIds: data || [],
    error,
    isLoading,
    refetch: mutate,
  };
}
