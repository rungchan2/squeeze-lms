"use client";

import { useState, useMemo, useEffect } from "react";
import { useParams } from "next/navigation";
import { Box, VStack } from "@chakra-ui/react";
import styled from "@emotion/styled";

import Heading from "@/components/Text/Heading";
import Text from "@/components/Text/Text";
import Spinner from "@/components/common/Spinner";
import RoleGuard from "@/app/journey/[slug]/teacher/RoleGuard";

import FilterControls, { FilterState } from "@/components/statistics/FilterControls";
import WordFrequencyChart from "@/components/statistics/WordFrequencyChart";
import WordGroupDisplay from "@/components/statistics/WordGroupDisplay";
import StatsSummary from "@/components/statistics/StatsSummary";
import DataInspector from "@/components/statistics/DataInspector";
import CustomWordGroupEditor, { CustomWordGroup, WordFrequency } from "@/components/statistics/CustomWordGroupEditor";

import { useJourneyBySlug } from "@/hooks/useJourneyBySlug";
import { useWeeks } from "@/hooks/useWeeks";
import { useMultiWeekWordFrequency, WordFrequencyResponse } from "@/hooks/useWordFrequencyAnalysis";
import { useAutoWordGrouping } from "@/hooks/useWordGrouping";

export default function StatisticsPage() {
  const { slug } = useParams();
  const [filters, setFilters] = useState<FilterState>({
    viewMode: 'journey',
    selectedUserId: undefined,
    selectedWeekIds: [],
    timeRange: 'all',
  });
  
  // 커스텀 그룹들
  const [customGroups, setCustomGroups] = useState<CustomWordGroup[]>([]);

  // Journey 데이터 가져오기
  const { journey, isLoading: journeyLoading, error: journeyError } = useJourneyBySlug(
    slug as string
  );

  // Journey weeks 데이터 가져오기
  const { weeks, isLoading: weeksLoading } = useWeeks(journey?.id || "");
  
  // 주차 데이터가 로드되면 기본적으로 전체 주차 선택
  useEffect(() => {
    if (weeks && weeks.length > 0 && filters.selectedWeekIds.length === 0) {
      console.log('📝 StatisticsPage: Auto-selecting all weeks:', weeks.length);
      const allWeekIds = weeks.map((week: any) => week.id);
      console.log('📝 All week IDs:', allWeekIds);
      setFilters(prev => ({ ...prev, selectedWeekIds: allWeekIds }));
    }
  }, [weeks, filters.selectedWeekIds.length]);

  // 선택된 주차들의 단어 빈도 분석
  const { 
    results: wordFrequencyResults, 
    isLoading: analysisLoading, 
    error: analysisError 
  } = useMultiWeekWordFrequency(
    journey?.id || '',
    filters.selectedWeekIds,
    filters.selectedUserId
  );

  // 차트용 데이터 변환
  const chartData = useMemo(() => {
    return wordFrequencyResults
      .map(result => result.data)
      .filter(Boolean);
  }, [wordFrequencyResults]);

  // 주차 이름 배열 생성
  const weekNames = useMemo(() => {
    if (!weeks || filters.selectedWeekIds.length === 0) return [];
    
    return filters.selectedWeekIds.map(weekId => {
      const week = weeks.find((w: any) => w.id === weekId);
      return week ? `${week.week_number}주차` : `주차`;
    });
  }, [weeks, filters.selectedWeekIds]);

  // 전체 단어 빈도 데이터 합치기 (그룹핑용)
  const combinedWordFrequency = useMemo(() => {
    if (chartData.length === 0) return [];
    
    const wordMap = new Map<string, number>();
    chartData.forEach(weekData => {
      if (weekData) {
        weekData.word_frequency.forEach(([word, freq]) => {
          wordMap.set(word, (wordMap.get(word) || 0) + freq);
        });
      }
    });

    return Array.from(wordMap.entries()).sort(([, a], [, b]) => b - a);
  }, [chartData]);

  // CustomWordGroupEditor용 WordFrequency 포맷으로 변환
  const wordFrequenciesForEditor: WordFrequency[] = useMemo(() => {
    return combinedWordFrequency.map(([word, count]) => ({
      word,
      count
    }));
  }, [combinedWordFrequency]);

  // 단어 그룹핑 분석
  const { 
    data: groupingData, 
    isLoading: groupingLoading 
  } = useAutoWordGrouping(combinedWordFrequency, 1, 20);
  
  // API 그룹들 자동 로딩
  const apiGroups: CustomWordGroup[] = useMemo(() => {
    if (!groupingData?.groups) return [];
    
    // 사용할 그룹 색상
    const groupColors = [
      "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7",
      "#DDA0DD", "#98D8C8", "#FFB6C1", "#87CEEB", "#F0E68C",
      "#FFE4B5", "#D8BFD8", "#B0E0E6", "#F5DEB3", "#E0E0E0"
    ];
    
    return groupingData.groups.map((group, index) => {
      // group.words는 string[] 타입이므로 직접 사용
      const words = group.words;
      
      // 각 단어의 빈도수를 combinedWordFrequency에서 찾기
      const apiWordsData = words.map(word => {
        const freq = combinedWordFrequency.find(([w]) => w === word)?.[1] || 0;
        return {
          word,
          frequency: freq
        };
      });
      
      // 총 빈도수 계산
      const totalCount = apiWordsData.reduce((sum, w) => sum + w.frequency, 0);
      
      return {
        id: `api-${group.label}`,
        name: group.label,
        words: words,
        color: groupColors[index % groupColors.length],
        totalCount: totalCount,
        isApiGroup: true,
        apiWordsData: apiWordsData
      };
    });
  }, [groupingData, combinedWordFrequency]);

  const handleFilterChange = (newFilters: FilterState) => {
    console.log('📝 Filter change received:', newFilters);
    setFilters(newFilters);
  };

  // 로딩 상태
  if (journeyLoading || weeksLoading) {
    return (
      <PageContainer>
        <LoadingState>
          <Spinner />
          <Text>Journey 정보를 불러오는 중...</Text>
        </LoadingState>
      </PageContainer>
    );
  }

  // 에러 상태
  if (journeyError) {
    return (
      <PageContainer>
        <ErrorMessage>
          Journey를 불러오는 중 오류가 발생했습니다: {journeyError.message}
        </ErrorMessage>
      </PageContainer>
    );
  }

  if (!journey) {
    return (
      <PageContainer>
        <ErrorMessage>
          해당 Journey를 찾을 수 없습니다.
        </ErrorMessage>
      </PageContainer>
    );
  }

  return (
    <RoleGuard>
      <PageContainer>
        <PageHeader>
          <Heading level={2}>📊 학습 분석 통계</Heading>
          <Text variant="body" color="var(--grey-600)">
            {journey.name} - 학생들의 주관식 답변을 분석하여 학습 변화를 추적합니다
          </Text>
        </PageHeader>

        <ContentContainer>
          <FilterControls
            journeyId={journey.id}
            onFilterChange={handleFilterChange}
            isLoading={analysisLoading}
          />

          {filters.selectedWeekIds.length === 0 ? (
            <EmptyState>
              <Text color="var(--grey-500)">
                분석할 주차를 선택해주세요. 최소 1개 주차 이상 선택해야 분석이 가능합니다.
              </Text>
            </EmptyState>
          ) : (
            <AnalysisResults>
              {/* 요약 통계 */}
              <StatsSummary
                wordFrequencyData={chartData.filter((data): data is WordFrequencyResponse => data !== undefined)}
                wordGroupData={groupingData}
                isLoading={analysisLoading}
                title="분석 요약"
              />

              {/* 단어 그룹 관리 */}
              <CustomWordGroupEditor
                wordFrequencies={wordFrequenciesForEditor}
                customGroups={customGroups}
                onGroupsChange={(newCustomGroups) => {
                  console.log('📝 Custom groups updated:', newCustomGroups);
                  setCustomGroups(newCustomGroups);
                }}
                apiGroups={apiGroups}
                onApiGroupsChange={(newApiGroups) => {
                  console.log('📝 API groups updated:', newApiGroups);
                  // API 그룹 수정은 현재 지원하지 않음
                }}
              />

              {/* 주제별 단어 그룹 빈도 차트 */}
              <WordFrequencyChart
                data={chartData.filter((data): data is WordFrequencyResponse => data !== undefined)}
                wordGroupData={groupingData}
                customGroups={[...apiGroups, ...customGroups]}
                weekNames={weekNames}
                isLoading={analysisLoading}
                error={analysisError}
                title={
                  filters.viewMode === 'individual' 
                    ? "개별 학생 주제별 빈도 변화" 
                    : "전체 학생 주제별 빈도 변화"
                }
                subtitle={
                  filters.viewMode === 'individual'
                    ? "선택된 학생의 회차별 주제별 관심사 변화를 분석합니다"
                    : "전체 학생들의 회차별 주제별 관심사 변화를 분석합니다"
                }
              />

              {/* 단어 그룹 분석 */}
              {combinedWordFrequency.length > 0 && (
                <WordGroupDisplay
                  data={groupingData}
                  isLoading={groupingLoading}
                  title="주제별 단어 그룹"
                  subtitle="유사한 의미의 단어들을 자동으로 분류하여 주요 학습 주제를 파악합니다"
                />
              )}

              {/* 데이터 검증 및 디버깅 정보 */}
              <DataInspector
                data={chartData.filter((data): data is WordFrequencyResponse => data !== undefined)}
                weekNames={weekNames}
                isLoading={analysisLoading}
                title="분석 데이터 검증"
              />

              {/* 분석 에러 표시 */}
              {analysisError && (
                <ErrorMessage>
                  분석 중 오류가 발생했습니다: {analysisError.message}
                </ErrorMessage>
              )}
            </AnalysisResults>
          )}
        </ContentContainer>
      </PageContainer>
    </RoleGuard>
  );
}

const PageContainer = styled(Box)`
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

const PageHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1.5rem;
  background: var(--white);
  border: 1px solid var(--grey-200);
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
`;

const ContentContainer = styled(VStack)`
  width: 100%;
  spacing: 2rem;
  align-items: stretch;
`;

const LoadingState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 3rem;
  color: var(--grey-500);
`;

const EmptyState = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 3rem;
  background: var(--grey-50);
  border: 1px dashed var(--grey-300);
  border-radius: 12px;
  text-align: center;
`;

const AnalysisResults = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
  width: 100%;
`;

const ErrorMessage = styled.div`
  padding: 1rem;
  background: var(--negative-50);
  border: 1px solid var(--negative-200);
  border-radius: 8px;
  color: var(--negative-700);
  text-align: center;
`;
