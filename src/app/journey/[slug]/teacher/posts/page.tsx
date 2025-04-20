"use client";

// TODO: 1. 제출된 과제 통계 확인할 수 있게 하기

import { useEffect, useRef, useCallback } from "react";
import { Table } from "@chakra-ui/react";
import { Tabs } from "@chakra-ui/react";
import styled from "@emotion/styled";
import { useParams, useRouter } from "next/navigation";
import { FaRegTrashAlt } from "react-icons/fa";
import { IconContainer } from "@/components/common/IconContainer";
import { deletePost, hidePost, unhidePost } from "@/utils/data/posts";
import dayjs from "@/utils/dayjs/dayjs";
import { toaster } from "@/components/ui/toaster";
import { Loading } from "@/components/common/Loading";
import { Error } from "@/components/common/Error";
import { ImBooks } from "react-icons/im";
import { MdOutlineCalendarViewWeek } from "react-icons/md";
import Heading from "@/components/Text/Heading";
import WeeklySubmissionChart from "./WeeklySubmissionChart";
import Text from "@/components/Text/Text";
import useSWRInfinite from "swr/infinite";
import { PostsResponse, fetchPosts } from "@/utils/data/posts";

interface Post {
  id: string;
  title: string;
  content: string;
  created_at: string;
  is_hidden: boolean;
  profiles?: {
    first_name: string;
    last_name: string;
  };
}


// 페이지네이션으로 포스트를 가져오는 함

export default function TeacherPostsPage() {
  const { slug } = useParams();
  const router = useRouter();
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // SWR 키 생성 함수 정의
  const getKey = (pageIndex: number, previousPageData: PostsResponse | null) => {
    // 이전 페이지 데이터가 없거나 nextPage가 null이 아닌 경우 계속 로드
    if (previousPageData === null || previousPageData.nextPage !== null) {
      return [`posts-${slug}-teacher`, pageIndex];
    }
    return null; // 더 이상 데이터가 없으면 null 반환
  };
  
  // useSWRInfinite 훅 사용
  const {
    data,
    error,
    size,
    setSize,
    isLoading,
    isValidating,
  } = useSWRInfinite<PostsResponse>(
    getKey,
    async (key, pageIndex) => fetchPosts({ 
      pageParam: pageIndex, 
      journeySlug: slug as string, 
      showHidden: true 
    }),
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1분 동안 중복 요청 방지
    }
  );
  
  // 데이터 가공
  const allPosts = data 
    ? data.flatMap(page => page.data)
        .filter((post, index, self) => 
          index === self.findIndex(p => p.id === post.id)
        ) // 중복 제거
    : [];
  const totalPosts = data && data[0] ? data[0].total : 0;
  const hasNextPage = data ? data[data.length - 1]?.nextPage !== null : false;
  const isFetchingNextPage = isValidating && size > 0 && !isLoading;
  
  // 다음 페이지 불러오기 함수
  const fetchNextPage = useCallback(() => {
    if (hasNextPage) {
      setSize(size + 1);
    }
  }, [setSize, size, hasNextPage]);
  
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

  const handleDelete = async (postId: string) => {
    if (confirm("정말 삭제하시겠습니까?")) {
      await deletePost(postId);
    }
  };

  const handleHide = async (postId: string, value: string) => {
    if (value === "hide") {
      await hidePost(postId);
      toaster.create({
        title: "게시물이 숨김 처리되었습니다.",
        type: "success",
      });
    } else {
      await unhidePost(postId);
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
      <Tabs.Root defaultValue="week" variant="line">
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
                {allPosts.map((post: Post, index: number) => (
                  <Table.Row
                    key={`post-${post.id}-${index}`}
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
  max-width: var(--breakpoint-tablet);
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
