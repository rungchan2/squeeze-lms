"use client";

// TODO: 1. 제출된 과제 통계 확인할 수 있게 하기

import { useEffect, useRef, useCallback, useState, useMemo } from "react";
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
import { usePosts } from "@/hooks/usePosts";
import { useWeeks } from "@/hooks/useWeeks";
import { useJourneyMissionInstances } from "@/hooks/useJourneyMissionInstances";
import { useJourneyBySlug } from "@/hooks/useJourneyBySlug";
import { PostWithRelations } from "@/types";
import RichTextViewer from "@/components/richTextInput/RichTextViewer";
import { exportPostsToExcel } from "@/utils/excel/exportPosts";


import Button from "@/components/common/Button";
import { Dialog, CloseButton, Portal } from "@chakra-ui/react";
import { HiOutlineDocumentDownload } from "react-icons/hi";

export default function TeacherPostsPage() {
  const { slug } = useParams();
  const router = useRouter();
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // 필터 상태 관리
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [selectedWeekId, setSelectedWeekId] = useState<string>("");
  const [searchTitle, setSearchTitle] = useState<string>("");

  // usePosts 훅 사용
  const {
    data: allPosts,
    error,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    refetch,
    total: totalPosts,
  } = usePosts(10, slug as string, true);

  // useWeeks 훅 사용
  const { weeks = [], isLoading: weeksLoading = false } = useWeeks(slug as string) || {};

  // useJourneyMissionInstances 훅 사용 (주차 필터링을 위해)
  const { missionInstances = [], isLoading: missionInstancesLoading = false } = useJourneyMissionInstances(slug as string) || {};

  // useJourneyBySlug 훅 사용 (여정 정보 가져오기)
  const { journey, isLoading: journeyLoading } = useJourneyBySlug(slug as string);

  // 학생 목록 추출 (memoized)
  const studentOptions = useMemo(() => {
    const uniqueStudents = new Map();
    allPosts.forEach((post: PostWithRelations) => {
      if (post.profiles) {
        const studentId = post.profiles.id;
        if (!uniqueStudents.has(studentId)) {
          uniqueStudents.set(studentId, {
            id: studentId,
            name: `${post.profiles.last_name}${post.profiles.first_name}`,
            first_name: post.profiles.first_name,
            last_name: post.profiles.last_name
          });
        }
      }
    });
    return Array.from(uniqueStudents.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [allPosts]);

  // 주차 목록 추출 (memoized)
  const weekOptions = useMemo(() => {
    return weeks
      .sort((a, b) => (a.week_number || 0) - (b.week_number || 0))
      .map(week => ({
        id: week.id,
        name: week.name,
        week_number: week.week_number
      }));
  }, [weeks]);

  // 필터링된 포스트 데이터 (memoized)
  const filteredPosts = useMemo(() => {
    let filtered = allPosts;

    // 학생 필터 적용
    if (selectedStudentId) {
      filtered = filtered.filter((post: PostWithRelations) => 
        post.profiles?.id === selectedStudentId
      );
    }

    // 주차 필터 적용 (mission_instance_id를 통해 필터링)
    if (selectedWeekId) {
      // 선택된 주차에 속한 mission instance들의 ID 목록 가져오기
      const weekMissionInstanceIds = missionInstances
        .filter(instance => instance.journey_week_id === selectedWeekId)
        .map(instance => instance.id);
      
      filtered = filtered.filter((post: PostWithRelations) => {
        // PostWithRelations에서 mission_instance_id는 mission 객체이므로 원본 post에서 가져와야 함
        const missionInstanceId = (post as any).mission_instance_id;
        return typeof missionInstanceId === 'string' 
          ? weekMissionInstanceIds.includes(missionInstanceId)
          : false;
      });
    }

    // 제목 검색 필터 적용
    if (searchTitle.trim()) {
      filtered = filtered.filter((post: PostWithRelations) => 
        post.title.toLowerCase().includes(searchTitle.toLowerCase().trim())
      );
    }

    return filtered;
  }, [allPosts, selectedStudentId, selectedWeekId, searchTitle, missionInstances]);

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
      threshold: 0.1,
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
      refetch(); // 데이터 다시 불러오기
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
    refetch(); // 데이터 다시 불러오기
  };

  const handleExportToExcel = () => {
    if (!journey || !weeks || !missionInstances) {
      toaster.create({
        title: "데이터를 불러오는 중입니다. 잠시 후 다시 시도해주세요.",
        type: "error",
      });
      return;
    }

    try {
      const filename = exportPostsToExcel({
        posts: filteredPosts,
        journeyName: journey.name,
        weeks: weekOptions,
        missionInstances: missionInstances,
      });
      
      toaster.create({
        title: `${filename} 파일이 다운로드되었습니다.`,
        type: "success",
      });
    } catch (error) {
      console.error('Excel export error:', error);
      toaster.create({
        title: "Excel 파일 내보내기에 실패했습니다.",
        type: "error",
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
              전체 {totalPosts}개 중 {filteredPosts.length}개 표시 중
            </Text>

            {/* 필터 영역 */}
            <div className="filter-container">
              <div className="filter-group">
                <Button
                  onClick={handleExportToExcel}
                  variant="outline"
                  disabled={journeyLoading || !journey || filteredPosts.length === 0}
                >
                  <HiOutlineDocumentDownload style={{ marginRight: '8px' }} />
                  Excel로 내보내기
                </Button>
              </div>
              <div className="filter-group">
                <label htmlFor="search-title">제목 검색:</label>
                <input
                  id="search-title"
                  type="text"
                  value={searchTitle}
                  onChange={(e) => setSearchTitle(e.target.value)}
                  placeholder="제목으로 검색..."
                  className="filter-input"
                />
              </div>

              <div className="filter-group">
                <label htmlFor="student-filter">학생 선택:</label>
                <select
                  id="student-filter"
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="filter-select"
                >
                  <option value="">전체 학생</option>
                  {studentOptions.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label htmlFor="week-filter">주차 선택:</label>
                <select
                  id="week-filter"
                  value={selectedWeekId}
                  onChange={(e) => setSelectedWeekId(e.target.value)}
                  className="filter-select"
                  disabled={weeksLoading || missionInstancesLoading}
                >
                  <option value="">전체 주차</option>
                  {weekOptions.map((week) => (
                    <option key={week.id} value={week.id}>
                      {week.week_number ? `${week.week_number}주차: ` : ''}{week.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <Table.Root
              key="outline"
              size="sm"
              variant="outline"
              interactive
              backgroundColor="var(--white)"
            >
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeader>제목</Table.ColumnHeader>
                  <Table.ColumnHeader>작성자</Table.ColumnHeader>
                  <Table.ColumnHeader>숨김</Table.ColumnHeader>
                  <Table.ColumnHeader>제출날짜</Table.ColumnHeader>
                  <Table.ColumnHeader>제출내용</Table.ColumnHeader>
                  <Table.ColumnHeader></Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {filteredPosts.map((post: PostWithRelations, index: number) => (
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
                      onClick={(e: React.MouseEvent) => e.stopPropagation()}
                    >
                      <select
                        defaultValue={post.is_hidden ? "hide" : "show"}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                          handleHide(post.id, e.target.value)
                        }
                        className="select-box"
                      >
                        <option value="show">보임</option>
                        <option value="hide">숨김</option>
                      </select>
                    </Table.Cell>
                    <Table.Cell>
                      {dayjs(post.created_at).format("YYYY-MM-DD")}
                    </Table.Cell>
                    <Table.Cell>
                    
                    <Dialog.Root
                      key="center"
                      placement="center"
                      motionPreset="slide-in-bottom"
                    >
                      <Dialog.Trigger asChild>
                      <Button
                        maxWidth={100}
                        variant="plain"
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                        }}
                      >
                        제출내용 보기
                      </Button>
                      </Dialog.Trigger>
                      <Portal>
                        <Dialog.Backdrop />
                        <Dialog.Positioner>
                          <Dialog.Content onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                            <Dialog.Header>
                              <Dialog.Title>
                                {post.title} / {post.profiles?.last_name}{post.profiles?.first_name}
                              </Dialog.Title>
                            </Dialog.Header>
                            <Dialog.Body >
                              <RichTextViewer content={post.content} />
                            </Dialog.Body>
                            <Dialog.CloseTrigger asChild>
                              <CloseButton size="sm" />
                            </Dialog.CloseTrigger>
                          </Dialog.Content>
                        </Dialog.Positioner>
                      </Portal>
                    </Dialog.Root>
                    </Table.Cell>
                    <Table.Cell textAlign="right">
                      <IconContainer
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          handleDelete(post.id);
                        }}
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
              {!hasNextPage && filteredPosts.length > 0 && (
                <Text
                  variant="caption"
                  color="var(--grey-500)"
                  className="no-more"
                >
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

  .filter-container {
    display: flex;
    gap: 1rem;
    margin-bottom: 1rem;
    padding: 1rem;
    background-color: var(--grey-50);
    border-radius: 8px;
    border: 1px solid var(--grey-200);
    flex-wrap: wrap;
  }

  .filter-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    min-width: 200px;
    flex: 1;
    
    &:first-child {
      flex: 0 0 auto;
      min-width: auto;
      align-items: flex-start;
      justify-content: flex-end;
    }
  }

  .filter-group label {
    font-size: 14px;
    font-weight: 500;
    color: var(--grey-700);
  }

  .filter-select,
  .filter-input {
    border: 1px solid var(--grey-300);
    background-color: var(--white);
    color: var(--grey-700);
    font-size: 14px;
    padding: 8px 12px;
    border-radius: 6px;
    transition: border-color 0.2s ease;

    &:hover {
      border-color: var(--grey-400);
    }

    &:focus {
      outline: none;
      border-color: var(--primary-500);
      box-shadow: 0 0 0 2px var(--primary-100);
    }

    &:disabled {
      background-color: var(--grey-100);
      color: var(--grey-500);
      cursor: not-allowed;
    }
  }

  .filter-select {
    cursor: pointer;
  }

  .filter-input {
    &::placeholder {
      color: var(--grey-500);
    }
  }

  @media (max-width: 768px) {
    .filter-container {
      flex-direction: column;
      gap: 0.75rem;
    }

    .filter-group {
      min-width: unset;
    }
  }
`;
