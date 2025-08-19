"use client";

import { useState, useMemo, useEffect } from "react";
import styled from "@emotion/styled";
import { Box, Select, Grid, GridItem } from "@chakra-ui/react";
import Text from "@/components/Text/Text";
import Heading from "@/components/Text/Heading";
import { useJourneyUser } from "@/hooks/useJourneyUser";
import { useWeeks } from "@/hooks/useWeeks";

export interface FilterState {
  viewMode: 'individual' | 'journey';
  selectedUserId?: string;
  selectedWeekIds: string[];
  timeRange: 'all' | 'recent' | 'custom';
}

export interface FilterControlsProps {
  journeyId: string;
  onFilterChange: (filters: FilterState) => void;
  isLoading?: boolean;
}

export default function FilterControls({ 
  journeyId, 
  onFilterChange, 
  isLoading = false 
}: FilterControlsProps) {
  const [filters, setFilters] = useState<FilterState>({
    viewMode: 'journey',
    selectedUserId: undefined,
    selectedWeekIds: [],
    timeRange: 'all',
  });

  const { data: journeyUsers, isLoading: usersLoading } = useJourneyUser(journeyId);
  const { weeks: journeyWeeks, isLoading: weeksLoading } = useWeeks(journeyId);

  // 학생 목록 필터링 (teacher, admin 제외)
  const students = useMemo(() => {
    if (!journeyUsers) return [];
    return journeyUsers.filter(userJourney => 
      userJourney.role_in_journey === 'student' || 
      userJourney.role_in_journey === 'user' ||
      !userJourney.role_in_journey
    );
  }, [journeyUsers]);

  // 주차 목록 정렬
  const sortedWeeks = useMemo(() => {
    if (!journeyWeeks) return [];
    return [...journeyWeeks].sort((a: any, b: any) => (a.week_number || 0) - (b.week_number || 0));
  }, [journeyWeeks]);
  
  // 주차 데이터가 로드되면 기본적으로 전체 주차 선택
  useEffect(() => {
    console.log('📝 FilterControls useEffect triggered:', { 
      weeksLength: sortedWeeks.length, 
      selectedWeekIdsLength: filters.selectedWeekIds.length, 
      weeks: sortedWeeks.map(w => ({ id: w.id, week_number: w.week_number })) 
    });
    
    if (sortedWeeks.length > 0 && filters.selectedWeekIds.length === 0) {
      console.log('📝 Auto-selecting all weeks:', sortedWeeks.length, 'weeks');
      const allWeekIds = sortedWeeks.map((week: any) => week.id);
      console.log('📝 All week IDs:', allWeekIds);
      
      const updatedFilters = { ...filters, selectedWeekIds: allWeekIds };
      setFilters(updatedFilters);
      onFilterChange(updatedFilters);
    }
  }, [sortedWeeks, filters.selectedWeekIds]);

  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    onFilterChange(updatedFilters);
  };

  const handleViewModeChange = (viewMode: 'individual' | 'journey') => {
    const updates: Partial<FilterState> = { viewMode };
    
    // Journey 모드로 변경하면 특정 사용자 선택 해제
    if (viewMode === 'journey') {
      updates.selectedUserId = undefined;
    }
    
    handleFilterChange(updates);
  };

  const handleUserSelect = (userId: string) => {
    handleFilterChange({ 
      selectedUserId: userId === '' ? undefined : userId,
      viewMode: userId === '' ? 'journey' : 'individual'
    });
  };

  const handleWeeksSelect = (weekSelection: string) => {
    let selectedWeekIds: string[] = [];
    
    if (weekSelection === 'all') {
      selectedWeekIds = sortedWeeks.map((week: any) => week.id);
    } else if (weekSelection === 'recent') {
      selectedWeekIds = sortedWeeks.slice(-4).map((week: any) => week.id);
    } else if (weekSelection === 'none') {
      selectedWeekIds = [];
    }
    
    handleFilterChange({ selectedWeekIds });
  };

  const isControlsDisabled = isLoading || usersLoading || weeksLoading;

  return (
    <FilterContainer>
      <FilterHeader>
        <Heading level={5}>분석 필터</Heading>
        <Text variant="caption" color="var(--grey-600)">
          분석할 범위와 대상을 선택하세요
        </Text>
      </FilterHeader>

      <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={4}>
        <GridItem>
          <FilterGroup>
            <FilterLabel>
              <Text variant="body" fontWeight="bold">분석 범위</Text>
            </FilterLabel>
            <select
              value={filters.viewMode}
              onChange={(e) => handleViewModeChange(e.target.value as 'individual' | 'journey')}
              disabled={isControlsDisabled}
              style={{
                padding: '0.5rem',
                border: '1px solid var(--grey-300)',
                borderRadius: '4px',
                background: 'white'
              }}
            >
              <option value="journey">전체 학생</option>
              <option value="individual">개별 학생</option>
            </select>
          </FilterGroup>
        </GridItem>

        {filters.viewMode === 'individual' && (
          <GridItem>
            <FilterGroup>
              <FilterLabel>
                <Text variant="body" fontWeight="bold">학생 선택</Text>
                <Text variant="caption" color="var(--grey-500)">
                  총 {students.length}명
                </Text>
              </FilterLabel>
              <select
                value={filters.selectedUserId || ''}
                onChange={(e) => handleUserSelect(e.target.value)}
                disabled={isControlsDisabled}
                style={{
                  padding: '0.5rem',
                  border: '1px solid var(--grey-300)',
                  borderRadius: '4px',
                  background: 'white'
                }}
              >
                <option value="">전체 학생</option>
                {students.map((userJourney) => (
                  <option key={userJourney.user_id} value={userJourney.user_id || ''}>
                    {userJourney.profiles?.last_name}{userJourney.profiles?.first_name}
                  </option>
                ))}
              </select>
            </FilterGroup>
          </GridItem>
        )}

        <GridItem>
          <FilterGroup>
            <FilterLabel>
              <Text variant="body" fontWeight="bold">분석 기간</Text>
              <Text variant="caption" color="var(--grey-500)">
                총 {sortedWeeks.length}주차
              </Text>
            </FilterLabel>
            <select
              value={
                filters.selectedWeekIds.length === 0 ? 'none' :
                filters.selectedWeekIds.length === sortedWeeks.length ? 'all' :
                filters.selectedWeekIds.length <= 4 ? 'recent' : 'custom'
              }
              onChange={(e) => handleWeeksSelect(e.target.value)}
              disabled={isControlsDisabled}
              style={{
                padding: '0.5rem',
                border: '1px solid var(--grey-300)',
                borderRadius: '4px',
                background: 'white'
              }}
            >
              <option value="none">기간 선택</option>
              <option value="all">전체 기간</option>
              <option value="recent">최근 4주차</option>
            </select>
          </FilterGroup>
        </GridItem>
      </Grid>

      {filters.selectedWeekIds.length > 0 && (
        <SelectedInfo>
          <Text variant="caption" color="var(--primary-600)">
            선택된 주차: {filters.selectedWeekIds.length}개 
            {filters.viewMode === 'individual' && filters.selectedUserId && (
              <span> | 선택된 학생: {
                students.find(s => s.user_id === filters.selectedUserId)?.profiles?.first_name
              } {
                students.find(s => s.user_id === filters.selectedUserId)?.profiles?.last_name
              }</span>
            )}
          </Text>
        </SelectedInfo>
      )}
    </FilterContainer>
  );
}

const FilterContainer = styled(Box)`
  background: var(--white);
  border: 1px solid var(--grey-200);
  border-radius: 8px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const FilterHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const FilterGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const FilterLabel = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const SelectedInfo = styled.div`
  padding: 0.75rem;
  background: var(--primary-50);
  border-radius: 6px;
  border-left: 3px solid var(--primary-500);
`;