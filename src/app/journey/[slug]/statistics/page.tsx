"use client";

import { useState, useMemo, useEffect } from "react";
import { useParams } from "next/navigation";
import { Box, VStack, Button, useDisclosure, HStack } from "@chakra-ui/react";
import styled from "@emotion/styled";
import { FaEnvelope } from "react-icons/fa";
import { FiSave, FiFolder } from "react-icons/fi";

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
import EmailReportModal from "@/components/statistics/EmailReportModal";
import { SaveReportModal } from "@/components/statistics/SaveReportModal";
import { ReportListDrawer } from "@/components/statistics/ReportListDrawer";
import { WordGroupsConfig, StatisticsReport } from "@/types/statistics-report";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";

import { useJourneyBySlug } from "@/hooks/useJourneyBySlug";
import { useWeeks } from "@/hooks/useWeeks";
import { useMultiWeekWordFrequency, WordFrequencyResponse } from "@/hooks/useWordFrequencyAnalysis";
import { useAutoWordGrouping } from "@/hooks/useWordGrouping";

export default function StatisticsPage() {
  const { slug } = useParams();
  const { user } = useSupabaseAuth();
  const [filters, setFilters] = useState<FilterState>({
    viewMode: 'journey',
    selectedUserId: undefined,
    selectedWeekIds: [],
    timeRange: 'all',
  });
  
  // 커스텀 그룹들
  const [customGroups, setCustomGroups] = useState<CustomWordGroup[]>([]);
  // API 그룹들 (수정 가능한 state로 관리)
  const [apiGroups, setApiGroups] = useState<CustomWordGroup[]>([]);
  // 이메일 모달 상태
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  
  // Report modal/drawer states
  const saveReportModal = useDisclosure();
  const reportListDrawer = useDisclosure();

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
  
  // API 그룹들 자동 로딩 (groupingData 변경 시 apiGroups state 업데이트)
  useEffect(() => {
    if (!groupingData?.groups) {
      setApiGroups([]);
      return;
    }
    
    // 사용할 그룹 색상
    const groupColors = [
      "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7",
      "#DDA0DD", "#98D8C8", "#FFB6C1", "#87CEEB", "#F0E68C",
      "#FFE4B5", "#D8BFD8", "#B0E0E6", "#F5DEB3", "#E0E0E0"
    ];
    
    const newApiGroups = groupingData.groups.map((group, index) => {
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
        id: `api-${group.label}-${index}`,
        name: group.label,
        words: words,
        color: groupColors[index % groupColors.length],
        totalCount: totalCount,
        isApiGroup: true,
        apiWordsData: apiWordsData
      };
    });
    
    setApiGroups(newApiGroups);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupingData]);

  const handleFilterChange = (newFilters: FilterState) => {
    console.log('📝 Filter change received:', newFilters);
    setFilters(newFilters);
  };

  // Report 적용 핸들러
  const handleApplyReport = (report: StatisticsReport, data: any) => {
    // 보고서의 word groups를 CustomWordGroup 형식으로 변환
    const convertedGroups: CustomWordGroup[] = report.word_groups.groups.map(group => ({
      id: group.id,
      name: group.name,
      words: group.words,
      color: group.color,
      totalCount: data.groupedData?.find((g: any) => g.id === group.id)?.totalFrequency || 0,
      isApiGroup: false,
      apiWordsData: group.words.map(word => {
        const freq = combinedWordFrequency.find(([w]) => w === word)?.[1] || 0;
        return { word, frequency: freq };
      })
    }));

    // 커스텀 그룹으로 설정
    setCustomGroups(convertedGroups);
    
    // 설정도 적용
    if (report.word_groups.settings) {
      // 필터 상태 업데이트 (minFrequency 등)
      console.log('Applied report settings:', report.word_groups.settings);
    }
  };

  // 현재 word groups configuration 가져오기
  const getCurrentWordGroupsConfig = (): WordGroupsConfig => {
    const allGroups = [...customGroups, ...apiGroups.filter(g => !g.isHidden)];
    
    return {
      groups: allGroups.map(group => ({
        id: group.id,
        name: group.name,
        color: group.color,
        words: group.words,
        isVisible: !group.isHidden,
        order: 0,
      })),
      settings: {
        minFrequency: 2,
        showQuestionText: true,
        excludedWords: [],
      }
    };
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
          <HeaderContent>
            <Heading level={2}>📊 학습 분석 통계</Heading>
            <Text variant="body" color="var(--grey-600)">
              {journey.name} - 학생들의 주관식 답변을 분석하여 학습 변화를 추적합니다
            </Text>
          </HeaderContent>
          <HStack gap={2}>
            <Button
              onClick={reportListDrawer.onOpen}
              colorScheme="teal"
              variant="outline"
              size="sm"
            >
              저장된 보고서 <FiFolder />
            </Button>
            <Button
              onClick={saveReportModal.onOpen}
              colorScheme="blue"
              variant="outline"
              size="sm"
              disabled={customGroups.length === 0 && apiGroups.length === 0}
            >
              보고서 저장 <FiSave />
            </Button>
            <EmailButton
              onClick={() => setIsEmailModalOpen(true)}
              colorScheme="blue"
              variant="outline"
              size="sm"
              disabled={filters.selectedWeekIds.length === 0}
            >
              <FaEnvelope />
              이메일 전송
            </EmailButton>
          </HStack>
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
                  setApiGroups(newApiGroups);
                }}
              />

              {/* 주제별 단어 그룹 빈도 차트 */}
              <WordFrequencyChart
                data={chartData.filter((data): data is WordFrequencyResponse => data !== undefined)}
                wordGroupData={groupingData}
                customGroups={[...apiGroups.filter(group => !group.isHidden), ...customGroups]}
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
              {/* {combinedWordFrequency.length > 0 && (
                <WordGroupDisplay
                  data={groupingData}
                  isLoading={groupingLoading}
                  title="주제별 단어 그룹"
                  subtitle="유사한 의미의 단어들을 자동으로 분류하여 주요 학습 주제를 파악합니다"
                />
              )} */}

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

        {/* Email Report Modal */}
        <EmailReportModal
          isOpen={isEmailModalOpen}
          onClose={() => setIsEmailModalOpen(false)}
          journeyName={journey.name}
          filters={filters}
          wordFrequencyData={chartData.filter((data): data is WordFrequencyResponse => data !== undefined)}
          customGroups={customGroups}
          apiGroups={apiGroups.filter(group => !group.isHidden)}
          weekNames={weekNames}
        />

        {/* Save Report Modal */}
        <SaveReportModal
          open={saveReportModal.open}
          onOpenChange={(open) => open ? saveReportModal.onOpen() : saveReportModal.onClose()}
          journeyId={journey.id}
          wordGroups={getCurrentWordGroupsConfig()}
          currentSettings={{
            minFrequency: 2,
            showQuestionText: true,
          }}
        />

        {/* Report List Drawer */}
        <ReportListDrawer
          open={reportListDrawer.open}
          onOpenChange={(open) => open ? reportListDrawer.onOpen() : reportListDrawer.onClose()}
          journeyId={journey.id}
          onApplyReport={handleApplyReport}
          onCreateNew={saveReportModal.onOpen}
          currentUserId={user?.id}
        />
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
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  padding: 1.5rem;
  background: var(--white);
  border: 1px solid var(--grey-200);
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const HeaderContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const EmailButton = styled(Button)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
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
