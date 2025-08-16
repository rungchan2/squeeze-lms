"use client";

import { useMemo, useState } from "react";
import styled from "@emotion/styled";
import { Box, Button, Flex } from "@chakra-ui/react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer
} from "recharts";
import Text from "@/components/Text/Text";
import Heading from "@/components/Text/Heading";
import Spinner from "@/components/common/Spinner";
import { WordFrequencyResponse } from "@/hooks/useWordFrequencyAnalysis";
import { WordGroupingResponse } from "@/hooks/useWordGrouping";
import {
  transformToChartData,
  calculateGroupStatistics,
  assignColorsToGroups,
  WeekGroupFrequency
} from "@/utils/wordGroupAnalysisUtils";
import { CustomWordGroup } from "./CustomWordGroupEditor";

export interface WordFrequencyChartProps {
  data: WordFrequencyResponse[];
  wordGroupData: WordGroupingResponse | undefined;
  customGroups?: CustomWordGroup[];
  weekNames: string[];
  isLoading?: boolean;
  error?: Error | null;
  title?: string;
  subtitle?: string;
}

export default function WordFrequencyChart({
  data,
  wordGroupData,
  customGroups = [],
  weekNames,
  isLoading = false,
  error = null,
  title = "주제별 단어 그룹 빈도 변화 추이",
  subtitle = "시간에 따른 주요 주제들의 출현 빈도를 확인하세요"
}: WordFrequencyChartProps) {
  const [visibleGroups, setVisibleGroups] = useState<Set<string>>(new Set());

  // 그룹 기반 차트 데이터 계산 (API 그룹 + 커스텀 그룹)
  const { chartData, allGroups, groupStats, groupColors, weekGroupFrequencies } = useMemo(() => {
    if (!data || data.length === 0) {
      return { 
        chartData: [], 
        allGroups: [] as string[], 
        groupStats: new Map(), 
        groupColors: {},
        weekGroupFrequencies: []
      };
    }

    console.group('📊 Combined Group-based Chart Data Calculation');
    console.log('📝 Word Frequency Data:', data.length, 'weeks');
    console.log('🏷️ API Word Groups:', wordGroupData?.groups?.length || 0, 'groups');
    console.log('🔧 Custom Groups:', customGroups.length, 'groups');

    let weekGroupFrequencies: WeekGroupFrequency[] = [];
    let calculatedGroups: string[] = [];

    // 1. 기본 빈 구조 생성
    weekGroupFrequencies = weekNames.map((weekName, weekIndex) => ({
      weekIndex,
      weekName,
      groups: {}
    }));

    // 2. 모든 그룹 (수정된 API + 커스텀) 빈도 계산 및 추가
    if (customGroups.length > 0) {
      customGroups.forEach(group => {
        // 각 주차별로 그룹의 빈도 계산
        weekGroupFrequencies.forEach(weekData => {
          const weekWordData = data[weekData.weekIndex];
          if (weekWordData?.word_frequency) {
            let groupFreq = 0;
            
            // word_frequency는 [string, number][] 형태
            const weekWordMap = new Map(weekWordData.word_frequency);
            
            // 그룹에 포함된 단어들의 빈도 합계 계산
            group.words.forEach(word => {
              const wordCount = weekWordMap.get(word);
              if (wordCount) {
                groupFreq += wordCount;
              }
            });
            
            // 그룹 빈도 추가
            if (groupFreq > 0) {
              weekData.groups[group.name] = groupFreq;
            }
          }
        });
        
        // 그룹을 전체 그룹 목록에 추가
        if (!calculatedGroups.includes(group.name)) {
          calculatedGroups.push(group.name);
        }
      });
    }

    console.log('📈 Combined Week Group Frequencies:', weekGroupFrequencies);
    console.log('🎯 All Groups (API + Custom):', calculatedGroups);

    // 3. 그룹별 통계 계산
    const groupStats = calculateGroupStatistics(weekGroupFrequencies);
    console.log('📊 Group Statistics:', groupStats);

    // 4. 그룹에 색상 할당 (커스텀 그룹은 기존 색상 유지)
    const groupColors = assignColorsToGroups(calculatedGroups);
    
    // 커스텀 그룹의 색상을 지정된 색상으로 덮어쓰기
    customGroups.forEach(customGroup => {
      groupColors[customGroup.name] = customGroup.color;
    });
    
    console.log('🎨 Group Colors (with custom colors):', groupColors);

    // 5. 차트 데이터는 초기에는 모든 그룹 선택된 상태로
    const chartData = transformToChartData(weekGroupFrequencies, new Set(calculatedGroups));
    console.log('📊 Combined Chart Data:', chartData);
    
    console.groupEnd();

    return {
      chartData,
      allGroups: calculatedGroups,
      groupStats,
      groupColors,
      weekGroupFrequencies
    };
  }, [data, wordGroupData, customGroups, weekNames]);

  // 초기 선택된 그룹 설정 (모든 그룹을 기본으로 표시)
  useMemo(() => {
    if (allGroups.length > 0) {
      // 기존 선택된 그룹과 새로운 그룹을 합침
      const currentVisible = new Set(visibleGroups);
      let hasChanges = false;
      
      // 새로운 그룹이 추가되었거나 기존 그룹이 제거되었는지 확인
      allGroups.forEach(group => {
        if (!currentVisible.has(group)) {
          currentVisible.add(group);
          hasChanges = true;
        }
      });
      
      // 존재하지 않는 그룹은 제거
      Array.from(currentVisible).forEach(group => {
        if (!allGroups.includes(group)) {
          currentVisible.delete(group);
          hasChanges = true;
        }
      });
      
      // 변화가 있거나 첫 로드시에만 업데이트
      if (hasChanges || visibleGroups.size === 0) {
        setVisibleGroups(currentVisible);
      }
    }
  }, [allGroups]);

  // 실제 차트에 표시할 데이터 (선택된 그룹만)
  const displayChartData = useMemo(() => {
    return transformToChartData(weekGroupFrequencies, visibleGroups);
  }, [weekGroupFrequencies, visibleGroups]);

  const handleGroupToggle = (groupLabel: string) => {
    const newVisibleGroups = new Set(visibleGroups);
    if (newVisibleGroups.has(groupLabel)) {
      newVisibleGroups.delete(groupLabel);
    } else {
      newVisibleGroups.add(groupLabel);
    }
    setVisibleGroups(newVisibleGroups);
  };

  const handleShowAll = () => {
    setVisibleGroups(new Set(allGroups));
  };

  const handleClearAll = () => {
    setVisibleGroups(new Set());
  };

  if (isLoading) {
    return (
      <ChartContainer>
        <Spinner />
        <Text>차트 데이터를 불러오는 중...</Text>
      </ChartContainer>
    );
  }

  if (error) {
    return (
      <ChartContainer>
        <Text color="var(--negative-600)">
          차트를 불러오는 중 오류가 발생했습니다: {error.message}
        </Text>
      </ChartContainer>
    );
  }

  if (displayChartData.length === 0 || allGroups.length === 0) {
    return (
      <ChartContainer>
        <Text color="var(--grey-500)">
          단어 그룹핑 데이터가 없거나 표시할 데이터가 없습니다.
        </Text>
      </ChartContainer>
    );
  }

  return (
    <ChartContainer>
      <ChartHeader>
        <div>
          <Heading level={4}>{title}</Heading>
          <Text variant="caption" color="var(--grey-600)">{subtitle}</Text>
        </div>
        
        <QuickActions>
          <Button size="sm" variant="outline" onClick={handleShowAll}>
            전체 표시
          </Button>
          <Button size="sm" variant="ghost" onClick={handleClearAll}>
            전체 숨김
          </Button>
        </QuickActions>
      </ChartHeader>

      <ChartWrapper>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={displayChartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--grey-200)" />
            <XAxis 
              dataKey="weekName" 
              stroke="var(--grey-600)"
              fontSize={12}
            />
            <YAxis 
              stroke="var(--grey-600)"
              fontSize={12}
              label={{ value: '주제별 빈도 합계', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'var(--white)',
                border: '1px solid var(--grey-200)',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
              }}
              formatter={(value: number, name: string) => [
                `${value}회`,
                name
              ]}
              labelFormatter={(label: string) => `${label}`}
            />
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="line"
            />
            
            {Array.from(visibleGroups).map((groupLabel) => (
              <Line
                key={groupLabel}
                type="monotone"
                dataKey={groupLabel}
                stroke={(groupColors as Record<string, string>)[groupLabel] || '#cccccc'}
                strokeWidth={3}
                dot={{ r: 5 }}
                activeDot={{ r: 7 }}
                connectNulls={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </ChartWrapper>

      <GroupControls>
        <ControlsHeader>
          <Heading level={5}>주제 그룹 표시 설정</Heading>
          <Text variant="caption" color="var(--grey-500)">
            {visibleGroups.size}개 / {allGroups.length}개 주제 표시 중
          </Text>
        </ControlsHeader>
        
        <GroupGrid>
          {allGroups.map((groupLabel) => {
            const stats = groupStats.get(groupLabel);
            const isVisible = visibleGroups.has(groupLabel);
            
            return (
              <GroupItem key={groupLabel} isVisible={isVisible}>
                <GroupCheckbox>
                  <input 
                    type="checkbox"
                    checked={isVisible}
                    onChange={() => handleGroupToggle(groupLabel)}
                    style={{ marginRight: '0.75rem' }}
                  />
                  <GroupColorIndicator color={(groupColors as Record<string, string>)[groupLabel] || '#cccccc'} />
                </GroupCheckbox>
                
                <GroupInfo>
                  <Text variant="body" fontWeight={isVisible ? "bold" : "regular"}>
                    {groupLabel}
                  </Text>
                  <GroupStats>
                    <Text variant="caption" color="var(--grey-500)">
                      총 {stats?.totalFrequency || 0}회
                    </Text>
                    <Text variant="caption" color="var(--grey-400)">
                      평균 {stats?.averageFrequency || 0}회
                    </Text>
                    <Text variant="caption" color="var(--grey-400)">
                      {stats?.weeksAppeared || 0}주차 출현
                    </Text>
                  </GroupStats>
                </GroupInfo>
              </GroupItem>
            );
          })}
        </GroupGrid>
      </GroupControls>
    </ChartContainer>
  );
}

const ChartContainer = styled(Box)`
  background: var(--white);
  border: 1px solid var(--grey-200);
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const ChartHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const QuickActions = styled(Flex)`
  gap: 0.5rem;
  flex-wrap: wrap;
`;

const ChartWrapper = styled.div`
  width: 100%;
  height: 400px;
  border: 1px solid var(--grey-100);
  border-radius: 8px;
  padding: 1rem;
  background: var(--grey-25);
`;

const GroupControls = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const ControlsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--grey-200);
`;

const GroupGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 0.75rem;
  max-height: 300px;
  overflow-y: auto;
  padding: 0.5rem;
  border: 1px solid var(--grey-100);
  border-radius: 6px;
  background: var(--grey-25);
`;

const GroupItem = styled.div<{ isVisible: boolean }>`
  display: flex;
  align-items: center;
  padding: 0.75rem;
  border-radius: 6px;
  background: ${props => props.isVisible ? 'var(--primary-50)' : 'var(--white)'};
  border: 1px solid ${props => props.isVisible ? 'var(--primary-200)' : 'var(--grey-200)'};
  transition: all 0.2s ease;

  &:hover {
    border-color: var(--primary-300);
    background: var(--primary-25);
  }
`;

const GroupCheckbox = styled.div`
  display: flex;
  align-items: center;
  flex-shrink: 0;
`;

const GroupColorIndicator = styled.div<{ color: string }>`
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background-color: ${props => props.color};
  border: 2px solid var(--white);
  box-shadow: 0 0 0 1px var(--grey-300);
  flex-shrink: 0;
`;

const GroupInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
`;

const GroupStats = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
`;