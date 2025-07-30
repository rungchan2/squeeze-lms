"use client";

import { useEffect, useRef, useCallback, useState, useMemo } from "react";
import { Table, Input, Stack } from "@chakra-ui/react";
import { Tabs } from "@chakra-ui/react";
import styled from "@emotion/styled";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { FaRegTrashAlt, FaSearch, FaEye, FaFileAlt } from "react-icons/fa";
import { LuRefreshCw } from "react-icons/lu";
import { HiOutlineDocumentDownload } from "react-icons/hi";
import { ImBooks } from "react-icons/im";
import { MdOutlineCalendarViewWeek } from "react-icons/md";
import { deletePost, hidePost, unhidePost } from "@/utils/data/posts";
import dayjs from "@/utils/dayjs/dayjs";
import { toaster } from "@/components/ui/toaster";
import { Loading } from "@/components/common/Loading";
import { Error } from "@/components/common/Error";
import WeeklySubmissionChart from "./WeeklySubmissionChart";
import Text from "@/components/Text/Text";
import { usePosts } from "@/hooks/usePosts";
import { useWeeks } from "@/hooks/useWeeks";
import { useJourneyMissionInstances } from "@/hooks/useJourneyMissionInstances";
import { PostWithRelations } from "@/types";
import AnswersViewer from "@/components/common/AnswersViewer";
import { exportPostsToExcel } from "@/utils/excel/exportPosts";
import Button from "@/components/common/Button";
import { Dialog, CloseButton, Portal } from "@chakra-ui/react";

export default function TeacherPostsPage() {
  const { slug } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // URL 파라미터로부터 현재 탭 값 결정 (JourneyClient와 동일한 로직)
  const getCurrentTab = () => {
    const tab = searchParams.get("postsTab");
    if (tab && ["week", "all"].includes(tab)) {
      return tab;
    }
    return "week";
  };

  const currentTab = getCurrentTab();

  // 탭 변경 핸들러 (JourneyClient와 동일한 로직)
  const handleTabChange = useCallback((details: any) => {
    const newTab = typeof details === 'string' ? details : details.value;
    const params = new URLSearchParams(searchParams);
    params.set("postsTab", newTab);
    router.push(`/journey/${slug}/teacher/posts?${params.toString()}`, { scroll: false });
  }, [router, searchParams, slug]);

  // 필터 상태 관리
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [selectedWeekId, setSelectedWeekId] = useState<string>("");
  const [searchTitle, setSearchTitle] = useState<string>("");

  // usePosts 훅 사용 - slug를 사용
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

  // useWeeks 훅 사용 - slug를 사용
  const { weeks = [], isLoading: weeksLoading = false } = useWeeks(slug as string) || {};

  // useJourneyMissionInstances 훅 사용 (주차 필터링을 위해)
  const { missionInstances = [], isLoading: missionInstancesLoading = false } = useJourneyMissionInstances(slug as string) || {};

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

    // 주차 필터 적용 (journey_week_id를 통해 직접 필터링)
    if (selectedWeekId) {
      filtered = filtered.filter((post: PostWithRelations) => {
        // PostWithRelations에서 journey_mission_instances.journey_week_id를 통해 필터링
        return post.journey_mission_instances?.journey_week_id === selectedWeekId;
      });
    }

    // 제목 검색 필터 적용
    if (searchTitle.trim()) {
      filtered = filtered.filter((post: PostWithRelations) => 
        post.title.toLowerCase().includes(searchTitle.toLowerCase().trim())
      );
    }

    return filtered;
  }, [allPosts, selectedStudentId, selectedWeekId, searchTitle]);

  // 통계 데이터 계산
  const postsStats = useMemo(() => {
    return {
      total: totalPosts || 0,
      filtered: filteredPosts.length,
      students: studentOptions.length,
      hidden: allPosts.filter(post => post.is_hidden).length
    };
  }, [totalPosts, filteredPosts.length, studentOptions.length, allPosts]);

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
    if (!weeks || !missionInstances) {
      toaster.create({
        title: "데이터를 불러오는 중입니다. 잠시 후 다시 시도해주세요.",
        type: "error",
      });
      return;
    }

    try {
      const filename = exportPostsToExcel({
        posts: filteredPosts,
        journeyName: slug as string,
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
    <AdminContainer>
      <Tabs.Root 
        value={currentTab} 
        onValueChange={handleTabChange}
        variant="line"
      >
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
          {/* 헤더 영역 */}
          <HeaderSection>
            <HeaderInfo>
              <Stack direction="row" alignItems="center" gap={2}>
                <FaFileAlt size={20} color="var(--primary-600)" />
                <Text variant="body" fontWeight="bold" style={{ fontSize: "18px" }}>제출된 미션</Text>
              </Stack>
              <StatsGrid>
                <StatCard>
                  <StatValue>{postsStats.total}</StatValue>
                  <StatLabel>전체 제출</StatLabel>
                </StatCard>
                <StatCard>
                  <StatValue>{postsStats.filtered}</StatValue>
                  <StatLabel>검색 결과</StatLabel>
                </StatCard>
                <StatCard>
                  <StatValue>{postsStats.students}</StatValue>
                  <StatLabel>참여 학생</StatLabel>
                </StatCard>
                <StatCard>
                  <StatValue>{postsStats.hidden}</StatValue>
                  <StatLabel>숨김 처리</StatLabel>
                </StatCard>
              </StatsGrid>
            </HeaderInfo>
            
            <ActionButtons>
              <Button
                variant="outline"
                onClick={() => refetch()}
                disabled={isLoading}
                style={{ width: "fit-content" }}
              >
                <LuRefreshCw />
                새로고침
              </Button>
              <Button
                variant="outline"
                onClick={handleExportToExcel}
                disabled={filteredPosts.length === 0}
                style={{ width: "fit-content" }}
              >
                <HiOutlineDocumentDownload />
                Excel 내보내기
              </Button>
            </ActionButtons>
          </HeaderSection>

          {/* 검색 및 필터 영역 */}
          <FilterSection>
            <SearchBar>
              <SearchInput>
                <FaSearch color="var(--grey-400)" />
                <Input
                  placeholder="제목으로 검색..."
                  value={searchTitle}
                  onChange={(e) => setSearchTitle(e.target.value)}
                  variant="subtle"
                  style={{ border: 'none', boxShadow: 'none' }}
                />
              </SearchInput>
            </SearchBar>
            
            <FilterControls>
              <FilterGroup>
                <FilterLabel>학생 선택</FilterLabel>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  style={{
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid var(--grey-300)',
                    fontSize: '14px',
                    minWidth: '150px'
                  }}
                >
                  <option value="">전체 학생</option>
                  {studentOptions.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.name}
                    </option>
                  ))}
                </select>
              </FilterGroup>

              <FilterGroup>
                <FilterLabel>주차 선택</FilterLabel>
                <select
                  value={selectedWeekId}
                  onChange={(e) => setSelectedWeekId(e.target.value)}
                  disabled={weeksLoading || missionInstancesLoading}
                  style={{
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid var(--grey-300)',
                    fontSize: '14px',
                    minWidth: '150px'
                  }}
                >
                  <option value="">전체 주차</option>
                  {weekOptions.map((week) => (
                    <option key={week.id} value={week.id}>
                      {week.week_number ? `${week.week_number}주차: ` : ''}{week.name}
                    </option>
                  ))}
                </select>
              </FilterGroup>
            </FilterControls>
          </FilterSection>

          {/* 테이블 영역 */}
          <TableContainer>
            <Table.Root size="sm" variant="outline" backgroundColor="var(--white)">
              <Table.ColumnGroup>
                <Table.Column htmlWidth="30%" />
                <Table.Column htmlWidth="15%" />
                <Table.Column htmlWidth="10%" />
                <Table.Column htmlWidth="15%" />
                <Table.Column htmlWidth="15%" />
                <Table.Column htmlWidth="15%" />
              </Table.ColumnGroup>
              <Table.Header>
                <Table.Row backgroundColor="var(--grey-50)">
                  <Table.ColumnHeader>제목</Table.ColumnHeader>
                  <Table.ColumnHeader>작성자</Table.ColumnHeader>
                  <Table.ColumnHeader>상태</Table.ColumnHeader>
                  <Table.ColumnHeader>제출날짜</Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="center">제출내용</Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="center">관리</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {filteredPosts.map((post: PostWithRelations, index: number) => (
                  <Table.Row
                    key={`post-${post.id}-${index}`}
                    _hover={{ backgroundColor: "var(--grey-50)", cursor: "pointer" }}
                    onClick={() => router.push(`/post/${post.id}`)}
                  >
                    <Table.Cell>
                      <PostTitleCell>
                        <div style={{ fontWeight: 500, marginBottom: '4px' }}>{post.title}</div>
                        {post.journey_mission_instances?.missions && (
                          <Text variant="caption" color="var(--grey-500)">
                            {post.journey_mission_instances.missions.name}
                          </Text>
                        )}
                      </PostTitleCell>
                    </Table.Cell>
                    <Table.Cell>
                      <StudentCell>
                        {post.profiles?.last_name}{post.profiles?.first_name}
                      </StudentCell>
                    </Table.Cell>
                    <Table.Cell onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                      <StatusSelect
                        defaultValue={post.is_hidden ? "hide" : "show"}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                          handleHide(post.id, e.target.value)
                        }
                      >
                        <option value="show">보임</option>
                        <option value="hide">숨김</option>
                      </StatusSelect>
                    </Table.Cell>
                    <Table.Cell>
                      <DateCell>
                        {dayjs(post.created_at).format("YYYY-MM-DD")}
                      </DateCell>
                    </Table.Cell>
                    <Table.Cell textAlign="center">
                      <Dialog.Root placement="center" motionPreset="slide-in-bottom">
                        <Dialog.Trigger asChild>
                          <Button
                            variant="plain"
                            onClick={(e: React.MouseEvent) => e.stopPropagation()}
                          >
                            <FaEye />
                          </Button>
                        </Dialog.Trigger>
                        <Portal>
                          <Dialog.Backdrop />
                          <Dialog.Positioner>
                            <Dialog.Content 
                              onClick={(e: React.MouseEvent) => e.stopPropagation()}
                              style={{ maxWidth: '90vw', width: '800px' }}
                            >
                              <Dialog.Header>
                                <Dialog.Title>
                                  {post.title} - {post.profiles?.last_name}{post.profiles?.first_name}
                                </Dialog.Title>
                              </Dialog.Header>
                              <Dialog.Body>
                                <AnswersViewer 
                                  answersData={post.answers_data || null} 
                                  legacyContent={post.content}
                                />
                              </Dialog.Body>
                              <Dialog.CloseTrigger asChild>
                                <CloseButton size="sm" />
                              </Dialog.CloseTrigger>
                            </Dialog.Content>
                          </Dialog.Positioner>
                        </Portal>
                      </Dialog.Root>
                    </Table.Cell>
                    <Table.Cell textAlign="center">
                      <ActionButtonGroup>
                        <Button
                          variant="plain"
                          onClick={(e: React.MouseEvent) => {
                            e.stopPropagation();
                            handleDelete(post.id);
                          }}
                        >
                          <FaRegTrashAlt />
                        </Button>
                      </ActionButtonGroup>
                    </Table.Cell>
                  </Table.Row>
                ))}
                
                {filteredPosts.length === 0 && (
                  <Table.Row>
                    <Table.Cell colSpan={6} textAlign="center">
                      <EmptyState>
                        <FaFileAlt size={32} color="var(--grey-400)" />
                        <Text variant="body" color="var(--grey-500)">
                          {searchTitle || selectedStudentId || selectedWeekId
                            ? '검색 조건에 맞는 제출이 없습니다'
                            : '제출된 미션이 없습니다'
                          }
                        </Text>
                      </EmptyState>
                    </Table.Cell>
                  </Table.Row>
                )}
              </Table.Body>
            </Table.Root>

            <div ref={loadMoreRef} className="load-more">
              {isFetchingNextPage && <Loading />}
              {!hasNextPage && filteredPosts.length > 0 && (
                <Text
                  variant="caption"
                  color="var(--grey-500)"
                  style={{ textAlign: 'center', padding: '1rem' }}
                >
                  모든 데이터를 불러왔습니다.
                </Text>
              )}
            </div>
          </TableContainer>
        </Tabs.Content>
      </Tabs.Root>
    </AdminContainer>
  );
}

// Modern Admin-Style Styled Components
const AdminContainer = styled.div`
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
  background-color: var(--grey-25);
  min-height: 100vh;

  .load-more {
    padding: 1rem 0;
    display: flex;
    justify-content: center;
    min-height: 60px;
  }
`;

const HeaderSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 16px;
  }
`;

const HeaderInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-top: 8px;

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const StatCard = styled.div`
  background: white;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 16px;
  border-radius: 12px;
  border: 1px solid var(--grey-200);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const StatValue = styled.div`
  font-size: 24px;
  font-weight: bold;
  color: var(--primary-600);
  margin-bottom: 4px;
`;

const StatLabel = styled.div`
  font-size: 14px;
  color: var(--grey-600);
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 12px;
  width: 100%;
  justify-content: flex-end;
`;

const FilterSection = styled.div`
  background: white;
  padding: 20px;
  border-radius: 12px;
  border: 1px solid var(--grey-200);
  margin-bottom: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const SearchBar = styled.div`
  margin-bottom: 20px;
`;

const SearchInput = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--grey-50);
  border-radius: 8px;
  border: 1px solid var(--grey-200);
  
  &:focus-within {
    border-color: var(--primary-300);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const FilterControls = styled.div`
  display: flex;
  gap: 16px;
  align-items: flex-end;
  flex-wrap: wrap;
`;

const FilterGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const FilterLabel = styled.label`
  font-size: 12px;
  font-weight: 600;
  color: var(--grey-600);
  display: flex;
  align-items: center;
  gap: 4px;
`;

const TableContainer = styled.div`
  background: white;
  border-radius: 12px;
  border: 1px solid var(--grey-200);
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const PostTitleCell = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const StudentCell = styled.div`
  color: var(--grey-700);
  font-size: 14px;
  font-weight: 500;
`;

const StatusSelect = styled.select`
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

  &:focus {
    outline: none;
    border-color: var(--primary-500);
  }
`;

const DateCell = styled.div`
  color: var(--grey-600);
  font-size: 14px;
`;

const ActionButtonGroup = styled.div`
  display: flex;
  gap: 4px;
  justify-content: center;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 40px 20px;
`;
