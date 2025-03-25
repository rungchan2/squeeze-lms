"use client";

// TODO: 1. 제출된 과제 통계 확인할 수 있게 하기

import { useEffect, useRef, useCallback } from "react";
import { usePosts } from "@/hooks/usePosts";
import { Table } from "@chakra-ui/react";
import { Tabs } from "@chakra-ui/react";
import { useAuth } from "@/components/AuthProvider";
import styled from "@emotion/styled";
import { useParams, useRouter } from "next/navigation";
import { FaRegTrashAlt } from "react-icons/fa";
import { IconContainer } from "@/components/common/IconContainer";
import { posts } from "@/utils/posts/posts";
import dayjs from "@/utils/dayjs/dayjs";
import { toaster } from "@/components/ui/toaster";
import { Loading } from "@/components/common/Loading";
import { Error } from "@/components/common/Error";
import { ImBooks } from "react-icons/im";
import { MdOutlineCalendarViewWeek } from "react-icons/md";
import Heading from "@/components/Text/Heading";
import WeeklySubmissionChart from "./WeeklySubmissionChart";
import Text from "@/components/Text/Text";
import { useInfiniteQuery } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";

interface Post {
  id: number;
  title: string;
  content: string;
  created_at: string;
  is_hidden: boolean;
  profiles?: {
    first_name: string;
    last_name: string;
  };
}

interface PostsResponse {
  data: Post[];
  nextPage: number | null;
  total: number;
}

// 페이지네이션으로 포스트를 가져오는 함수
async function fetchPosts({ 
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
      .eq("journey_uuid", journeySlug);
    
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

export default function TeacherPostsPage() {
  const { slug } = useParams();
  const { id: userId } = useAuth();
  const router = useRouter();
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useInfiniteQuery({
    queryKey: ['posts', slug, true],
    queryFn: ({ pageParam }) => fetchPosts({ 
      pageParam: pageParam as number, 
      journeySlug: slug as string, 
      showHidden: true 
    }),
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
  });
  
  const allPosts = data?.pages.flatMap(page => page.data) || [];
  const totalPosts = data?.pages[0]?.total || 0;

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage]
  );

  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(handleObserver, {
      rootMargin: "0px 0px 200px 0px",
    });

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [handleObserver, allPosts]);

  const handleDelete = async (postId: number) => {
    if (confirm("정말 삭제하시겠습니까?")) {
      await posts.deletePost(postId);
    }
  };

  const handleHide = async (postId: number, value: string) => {
    if (value === "hide") {
      await posts.hidePost(postId);
      toaster.create({
        title: "게시물이 숨김 처리되었습니다.",
        type: "success",
      });
    } else {
      await posts.unhidePost(postId);
      toaster.create({
        title: "게시물이 숨김 해제되었습니다.",
        type: "success",
      });
    }
  };

  if (isLoading) return <Loading />;
  if (error) return <Error message={(error as Error).message} />;

  return (
    <TeacherPostsPageContainer>
      <Tabs.Root defaultValue="week" variant="plain">
        <Tabs.List bg="bg.muted" rounded="l3" p="1">
          <Tabs.Trigger value="week">
            <MdOutlineCalendarViewWeek />
            주차별 제출률
          </Tabs.Trigger>
          <Tabs.Trigger value="all">
            <ImBooks />
            전체보기
          </Tabs.Trigger>
          <Tabs.Indicator rounded="l2" />
        </Tabs.List>
        
        <Tabs.Content value="week">
          <WeeklySubmissionChart />
        </Tabs.Content>

        <Tabs.Content value="all">
          <div className="posts-container">
            <Heading level={3}>제출된 미션</Heading>
            
            <Text variant="body" color="var(--grey-600)" className="data-count">
              전체 {totalPosts}개 중 {allPosts.length}개 표시 중
            </Text>
            
            <Table.Root key="outline" size="sm" variant="outline" interactive backgroundColor="var(--white)">
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeader>제목</Table.ColumnHeader>
                  <Table.ColumnHeader>작성자</Table.ColumnHeader>
                  <Table.ColumnHeader>숨김</Table.ColumnHeader>
                  <Table.ColumnHeader>제출날짜</Table.ColumnHeader>
                  <Table.ColumnHeader></Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {allPosts.map((post: Post) => (
                  <Table.Row
                    key={post.id}
                    onClick={() => router.push(`/post/${post.id}`)}
                    style={{ cursor: "pointer" }}
                  >
                    <Table.Cell>{post.title}</Table.Cell>
                    <Table.Cell>
                      {post.profiles?.first_name} {post.profiles?.last_name}
                    </Table.Cell>
                    <Table.Cell
                      textAlign="center"
                      onClick={(e: React.MouseEvent) => e.stopPropagation()}
                    >
                      <select
                        defaultValue={post.is_hidden ? "hide" : "show"}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleHide(post.id, e.target.value)}
                        className="select-box"
                      >
                        <option value="show">보임</option>
                        <option value="hide">숨김</option>
                      </select>
                    </Table.Cell>
                    <Table.Cell>
                      {dayjs(post.created_at).format("YYYY-MM-DD")}
                    </Table.Cell>
                    <Table.Cell textAlign="right">
                      <IconContainer
                        onClick={() => handleDelete(post.id)}
                        hoverColor="var(--negative-600)"
                        iconColor="var(--negative-600)"
                      >
                        <FaRegTrashAlt />
                      </IconContainer>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
            
            <div ref={loadMoreRef} className="load-more">
              {isFetchingNextPage && <Loading />}
              {!hasNextPage && allPosts.length > 0 && (
                <Text variant="caption" color="var(--grey-500)" className="no-more">
                  모든 데이터를 불러왔습니다.
                </Text>
              )}
            </div>
          </div>
        </Tabs.Content>
      </Tabs.Root>
    </TeacherPostsPageContainer>
  );
}

const TeacherPostsPageContainer = styled.div`
  max-width: var(--breakpoint-desktop);
  margin: 0 auto;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;

  .select-box {
    border: none;
    background-color: var(--white);
    color: var(--grey-700);
    font-size: 12px;
    padding: 4px 8px;
    border-radius: 4px;
    border: 1px solid var(--grey-200);
    cursor: pointer;
    &:hover {
      background-color: var(--grey-100);
    }
  }
  
  .data-count {
    margin-bottom: 1rem;
  }
  
  .load-more {
    padding: 1rem 0;
    display: flex;
    justify-content: center;
    min-height: 60px;
  }
  
  .no-more {
    padding: 1rem;
  }
`;
