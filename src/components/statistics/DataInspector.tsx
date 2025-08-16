"use client";

import { useState } from "react";
import styled from "@emotion/styled";
import { Box, Button, Flex } from "@chakra-ui/react";
import Text from "@/components/Text/Text";
import Heading from "@/components/Text/Heading";
import { WordFrequencyResponse } from "@/hooks/useWordFrequencyAnalysis";

interface PostData {
  postId: string;
  userId: string;
  userName: string;
  weekName: string;
  missionType: string;
  extractedText: string;
  originalLength: number;
  processedLength: number;
}

interface DataInspectorProps {
  data: WordFrequencyResponse[];
  weekNames: string[];
  isLoading?: boolean;
  title?: string;
}

export default function DataInspector({
  data,
  weekNames,
  isLoading = false,
  title = "분석 데이터 검토"
}: DataInspectorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState<number>(0);

  if (isLoading) {
    return (
      <InspectorContainer>
        <Text>데이터를 불러오는 중...</Text>
      </InspectorContainer>
    );
  }

  if (data.length === 0) {
    return (
      <InspectorContainer>
        <InspectorHeader>
          <Heading level={5}>{title}</Heading>
          <Text variant="caption" color="var(--grey-500)">분석할 데이터가 없습니다</Text>
        </InspectorHeader>
      </InspectorContainer>
    );
  }

  const currentWeekData = data[selectedWeek];

  return (
    <InspectorContainer>
      <InspectorHeader>
        <HeaderInfo>
          <Heading level={5}>{title}</Heading>
          <Text variant="caption" color="var(--grey-600)">
            실제 분석에 사용된 텍스트 데이터를 확인할 수 있습니다
          </Text>
        </HeaderInfo>
        
        <HeaderActions>
          <Text variant="caption" color="var(--grey-500)" style={{ marginRight: '1rem' }}>
            총 {data.reduce((sum, week) => sum + (week?.total_posts || 0), 0)}개 포스트 분석
          </Text>
          <Button 
            size="sm" 
            variant={isExpanded ? "solid" : "outline"}
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? "접기" : "자세히 보기"}
          </Button>
        </HeaderActions>
      </InspectorHeader>

      {isExpanded && (
        <InspectorContent>
          {/* 주차 선택 */}
          <WeekSelector>
            <Text variant="body" fontWeight="medium" style={{ marginBottom: '0.5rem' }}>
              주차별 데이터 보기:
            </Text>
            <WeekTabs>
              {weekNames.map((weekName, index) => (
                <WeekTab
                  key={index}
                  isActive={selectedWeek === index}
                  onClick={() => setSelectedWeek(index)}
                >
                  {weekName}
                  <span className="post-count">
                    ({data[index]?.total_posts || 0}개)
                  </span>
                </WeekTab>
              ))}
            </WeekTabs>
          </WeekSelector>

          {/* 선택된 주차 데이터 */}
          {currentWeekData && (
            <WeekDataView>
              <DataSummary>
                <SummaryCard>
                  <Text variant="caption" color="var(--grey-500)">분석 범위</Text>
                  <Text variant="body" fontWeight="medium">{currentWeekData.scope}</Text>
                </SummaryCard>
                <SummaryCard>
                  <Text variant="caption" color="var(--grey-500)">총 포스트</Text>
                  <Text variant="body" fontWeight="medium">{currentWeekData.total_posts}개</Text>
                </SummaryCard>
                <SummaryCard>
                  <Text variant="caption" color="var(--grey-500)">추출된 단어</Text>
                  <Text variant="body" fontWeight="medium">{currentWeekData.word_frequency.length}개</Text>
                </SummaryCard>
                <SummaryCard>
                  <Text variant="caption" color="var(--grey-500)">캐시 히트</Text>
                  <CacheStatus isHit={currentWeekData.cache_hit}>
                    {currentWeekData.cache_hit ? "Yes" : "No"}
                  </CacheStatus>
                </SummaryCard>
              </DataSummary>

              {/* 단어 빈도 미리보기 */}
              <WordFrequencyPreview>
                <Text variant="body" fontWeight="medium" style={{ marginBottom: '0.75rem' }}>
                  추출된 단어 빈도 (상위 10개):
                </Text>
                <WordGrid>
                  {currentWeekData.word_frequency.slice(0, 10).map(([word, frequency]) => (
                    <WordItem key={word}>
                      <WordText>{word}</WordText>
                      <WordCount>{frequency}회</WordCount>
                    </WordItem>
                  ))}
                </WordGrid>
              </WordFrequencyPreview>

              {/* 텍스트 처리 정보 */}
              <TextProcessingInfo>
                <Text variant="body" fontWeight="medium" style={{ marginBottom: '0.75rem' }}>
                  텍스트 처리 상태:
                </Text>
                <ProcessingDetails>
                  <DetailRow>
                    <Text variant="caption" color="var(--grey-500)">필터링:</Text>
                    <Text variant="caption">essay, mixed 타입만 분석</Text>
                  </DetailRow>
                  <DetailRow>
                    <Text variant="caption" color="var(--grey-500)">HTML 정제:</Text>
                    <Text variant="caption" color="var(--positive-600)">태그 제거 및 엔티티 변환 적용됨</Text>
                  </DetailRow>
                  <DetailRow>
                    <Text variant="caption" color="var(--grey-500)">데이터 형식:</Text>
                    <Text variant="caption">
                      {currentWeekData.total_posts > 0 ? '현대 mission (answers_data JSONB)' : '레거시 (content 텍스트)'}
                    </Text>
                  </DetailRow>
                </ProcessingDetails>
              </TextProcessingInfo>

              {/* API 요청 정보 */}
              <ApiInfo>
                <Text variant="body" fontWeight="medium" style={{ marginBottom: '0.75rem' }}>
                  API 요청 정보:
                </Text>
                <ApiDetails>
                  <DetailRow>
                    <Text variant="caption" color="var(--grey-500)">분석 시각:</Text>
                    <Text variant="caption">{new Date(currentWeekData.analyzed_at).toLocaleString('ko-KR')}</Text>
                  </DetailRow>
                  <DetailRow>
                    <Text variant="caption" color="var(--grey-500)">요청 범위:</Text>
                    <Text variant="caption">{JSON.stringify(currentWeekData.range, null, 2)}</Text>
                  </DetailRow>
                </ApiDetails>
              </ApiInfo>

              {/* 경고 메시지 */}
              {currentWeekData.total_posts > 0 && currentWeekData.word_frequency.length === 0 && (
                <WarningBox>
                  <Text variant="body" color="var(--warning-700)">
                    ⚠️ 포스트가 {currentWeekData.total_posts}개 있지만 추출된 단어가 없습니다. 
                    텍스트 추출 과정에서 문제가 있을 수 있습니다.
                  </Text>
                </WarningBox>
              )}

              {/* 샘플 텍스트 감지 경고 */}
              {currentWeekData.word_frequency.some(([word]) => word === "팀워크는" || word === "소통과") && (
                <WarningBox>
                  <Text variant="body" color="var(--negative-700)">
                    🚨 샘플 데이터가 감지되었습니다. 실제 posts 테이블 데이터가 분석되지 않고 있을 수 있습니다.
                  </Text>
                </WarningBox>
              )}
            </WeekDataView>
          )}
        </InspectorContent>
      )}
    </InspectorContainer>
  );
}

const InspectorContainer = styled(Box)`
  background: var(--white);
  border: 1px solid var(--grey-200);
  border-radius: 8px;
  overflow: hidden;
`;

const InspectorHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1rem 1.25rem;
  background: var(--grey-25);
  border-bottom: 1px solid var(--grey-200);
  gap: 1rem;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const HeaderInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
`;

const HeaderActions = styled(Flex)`
  align-items: center;
  flex-shrink: 0;
`;

const InspectorContent = styled.div`
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const WeekSelector = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const WeekTabs = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const WeekTab = styled.button<{ isActive: boolean }>`
  padding: 0.5rem 0.75rem;
  border: 1px solid ${props => props.isActive ? 'var(--primary-300)' : 'var(--grey-300)'};
  background: ${props => props.isActive ? 'var(--primary-50)' : 'var(--white)'};
  color: ${props => props.isActive ? 'var(--primary-700)' : 'var(--grey-600)'};
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: ${props => props.isActive ? 'medium' : 'regular'};
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &:hover {
    border-color: var(--primary-300);
    background: var(--primary-25);
  }

  .post-count {
    font-size: 0.75rem;
    opacity: 0.8;
  }
`;

const WeekDataView = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding: 1rem;
  background: var(--grey-25);
  border-radius: 6px;
`;

const DataSummary = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 1rem;
`;

const SummaryCard = styled.div`
  padding: 0.75rem;
  background: var(--white);
  border: 1px solid var(--grey-200);
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const CacheStatus = styled.span<{ isHit: boolean }>`
  color: ${props => props.isHit ? 'var(--positive-600)' : 'var(--warning-600)'};
  font-weight: medium;
`;

const WordFrequencyPreview = styled.div`
  display: flex;
  flex-direction: column;
`;

const WordGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 0.5rem;
  max-height: 200px;
  overflow-y: auto;
`;

const WordItem = styled.div`
  padding: 0.5rem;
  background: var(--white);
  border: 1px solid var(--grey-200);
  border-radius: 4px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const WordText = styled.span`
  font-size: 0.875rem;
  font-weight: medium;
  color: var(--grey-700);
  margin-right: 0.5rem;
`;

const WordCount = styled.span`
  font-size: 0.75rem;
  color: var(--primary-600);
  background: var(--primary-50);
  padding: 0.125rem 0.375rem;
  border-radius: 3px;
`;

const TextProcessingInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

const ProcessingDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.75rem;
  background: var(--positive-25);
  border: 1px solid var(--positive-200);
  border-radius: 4px;
`;

const ApiInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

const ApiDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.75rem;
  background: var(--white);
  border: 1px solid var(--grey-200);
  border-radius: 4px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
`;

const DetailRow = styled.div`
  display: flex;
  gap: 1rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 0.25rem;
  }
`;

const WarningBox = styled.div`
  padding: 0.75rem;
  background: var(--warning-50);
  border: 1px solid var(--warning-200);
  border-radius: 6px;
  margin-top: 0.5rem;

  &:has([color*="negative"]) {
    background: var(--negative-50);
    border-color: var(--negative-200);
  }
`;