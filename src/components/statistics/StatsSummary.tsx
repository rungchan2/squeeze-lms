"use client";

import { useMemo } from "react";
import styled from "@emotion/styled";
import { Box, Grid, GridItem, Progress } from "@chakra-ui/react";
import Text from "@/components/Text/Text";
import Heading from "@/components/Text/Heading";
import { WordFrequencyResponse } from "@/hooks/useWordFrequencyAnalysis";
import { WordGroupingResponse } from "@/hooks/useWordGrouping";

export interface StatsSummaryProps {
  wordFrequencyData: WordFrequencyResponse[];
  wordGroupData?: WordGroupingResponse;
  isLoading?: boolean;
  title?: string;
}

export default function StatsSummary({
  wordFrequencyData,
  wordGroupData,
  isLoading = false,
  title = "분석 요약"
}: StatsSummaryProps) {
  const stats = useMemo(() => {
    if (!wordFrequencyData || wordFrequencyData.length === 0) {
      return {
        totalPosts: 0,
        totalWeeks: 0,
        totalUniqueWords: 0,
        averageWordsPerWeek: 0,
        mostFrequentWord: { word: '', frequency: 0 },
        wordGrowthTrend: 0,
        topWords: [],
        analysisProgress: 0,
        dataQuality: 'low' as 'low' | 'medium' | 'high'
      };
    }

    // 기본 통계 계산
    const totalPosts = wordFrequencyData.reduce((sum, week) => sum + week.total_posts, 0);
    const totalWeeks = wordFrequencyData.length;
    
    // 모든 단어와 빈도 수집
    const allWords = new Map<string, number>();
    const weeklyWordCounts: number[] = [];
    
    wordFrequencyData.forEach(week => {
      let weekWordCount = 0;
      week.word_frequency.forEach(([word, freq]) => {
        allWords.set(word, (allWords.get(word) || 0) + freq);
        weekWordCount += freq;
      });
      weeklyWordCounts.push(weekWordCount);
    });

    const totalUniqueWords = allWords.size;
    const averageWordsPerWeek = weeklyWordCounts.length > 0 
      ? Math.round(weeklyWordCounts.reduce((sum, count) => sum + count, 0) / weeklyWordCounts.length)
      : 0;

    // 가장 빈번한 단어
    const mostFrequentWord = Array.from(allWords.entries())
      .sort(([, a], [, b]) => b - a)[0] || ['', 0];

    // 단어 증가 트렌드 계산 (첫 절반 vs 후 절반 주차)
    const firstHalf = weeklyWordCounts.slice(0, Math.floor(weeklyWordCounts.length / 2));
    const secondHalf = weeklyWordCounts.slice(Math.floor(weeklyWordCounts.length / 2));
    
    const firstHalfAvg = firstHalf.length > 0 
      ? firstHalf.reduce((sum, count) => sum + count, 0) / firstHalf.length 
      : 0;
    const secondHalfAvg = secondHalf.length > 0 
      ? secondHalf.reduce((sum, count) => sum + count, 0) / secondHalf.length 
      : 0;
    
    const wordGrowthTrend = firstHalfAvg > 0 
      ? Math.round(((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100)
      : 0;

    // 상위 단어들
    const topWords = Array.from(allWords.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([word, freq]) => ({ word, frequency: freq }));

    // 분석 진행률 (주차 수에 따라)
    const analysisProgress = Math.min(100, (totalWeeks / 12) * 100);

    // 데이터 품질 평가
    let dataQuality: 'low' | 'medium' | 'high' = 'low';
    if (totalPosts >= 50 && totalUniqueWords >= 100) dataQuality = 'high';
    else if (totalPosts >= 20 && totalUniqueWords >= 50) dataQuality = 'medium';

    return {
      totalPosts,
      totalWeeks,
      totalUniqueWords,
      averageWordsPerWeek,
      mostFrequentWord: { word: mostFrequentWord[0], frequency: mostFrequentWord[1] },
      wordGrowthTrend,
      topWords,
      analysisProgress,
      dataQuality
    };
  }, [wordFrequencyData]);

  const groupStats = useMemo(() => {
    if (!wordGroupData) return null;
    
    const totalGroups = wordGroupData.total_groups;
    const averageWordsPerGroup = wordGroupData.groups.length > 0
      ? Math.round(
          wordGroupData.groups.reduce((sum, group) => sum + group.words.length, 0) / 
          wordGroupData.groups.length * 10
        ) / 10
      : 0;
    
    const largestGroup = wordGroupData.groups.reduce((largest, group) => 
      group.words.length > largest.words.length ? group : largest,
      { label: '', words: [] }
    );

    return {
      totalGroups,
      averageWordsPerGroup,
      largestGroup
    };
  }, [wordGroupData]);

  if (isLoading) {
    return (
      <SummaryContainer>
        <Text>통계를 계산하는 중...</Text>
      </SummaryContainer>
    );
  }

  return (
    <SummaryContainer>
      <SummaryHeader>
        <Heading level={4}>{title}</Heading>
        <Text variant="caption" color="var(--grey-600)">
          전체 분석 결과의 핵심 지표를 확인하세요
        </Text>
      </SummaryHeader>

      <StatsGrid>
        {/* 기본 통계 */}
        <StatCard>
          <StatCardHeader>
            <Heading level={5}>분석 범위</Heading>
          </StatCardHeader>
          <StatValue>
            <Text variant="body" fontWeight="bold" color="var(--primary-600)" style={{ fontSize: '2rem' }}>
              {stats.totalWeeks}
            </Text>
            <Text variant="caption" color="var(--grey-500)">주차</Text>
          </StatValue>
          <StatDescription>
            <Text variant="body">총 {stats.totalPosts}개의 게시글 분석</Text>
          </StatDescription>
        </StatCard>

        <StatCard>
          <StatCardHeader>
            <Heading level={5}>어휘 다양성</Heading>
          </StatCardHeader>
          <StatValue>
            <Text variant="body" fontWeight="bold" color="var(--positive-600)" style={{ fontSize: '2rem' }}>
              {stats.totalUniqueWords}
            </Text>
            <Text variant="caption" color="var(--grey-500)">개 단어</Text>
          </StatValue>
          <StatDescription>
            <Text variant="body">주차당 평균 {stats.averageWordsPerWeek}개 단어</Text>
          </StatDescription>
        </StatCard>

        <StatCard>
          <StatCardHeader>
            <Heading level={5}>최빈 단어</Heading>
          </StatCardHeader>
          <StatValue>
            <Text variant="body" fontWeight="bold" color="var(--warning-600)" style={{ fontSize: '1.5rem' }}>
              &quot;{stats.mostFrequentWord.word}&quot;
            </Text>
            <Text variant="caption" color="var(--grey-500)">
              {stats.mostFrequentWord.frequency}회 출현
            </Text>
          </StatValue>
        </StatCard>

        <StatCard>
          <StatCardHeader>
            <Heading level={5}>변화 추이</Heading>
          </StatCardHeader>
          <StatValue>
            <TrendValue trend={stats.wordGrowthTrend}>
              {stats.wordGrowthTrend > 0 ? '+' : ''}{stats.wordGrowthTrend}%
            </TrendValue>
            <Text variant="caption" color="var(--grey-500)">
              {stats.wordGrowthTrend > 0 ? '증가' : stats.wordGrowthTrend < 0 ? '감소' : '유지'}
            </Text>
          </StatValue>
          <StatDescription>
            <Text variant="body">전반부 대비 후반부 변화</Text>
          </StatDescription>
        </StatCard>

        {/* 그룹 통계 */}
        {groupStats && (
          <>
            <StatCard>
              <StatCardHeader>
                <Heading level={5}>주제 그룹</Heading>
              </StatCardHeader>
              <StatValue>
                <Text variant="body" fontWeight="bold" color="var(--purple-600)" style={{ fontSize: '2rem' }}>
                  {groupStats.totalGroups}
                </Text>
                <Text variant="caption" color="var(--grey-500)">개 그룹</Text>
              </StatValue>
              <StatDescription>
                <Text variant="body">그룹당 평균 {groupStats.averageWordsPerGroup}개 단어</Text>
              </StatDescription>
            </StatCard>

            <StatCard>
              <StatCardHeader>
                <Heading level={5}>주요 주제</Heading>
              </StatCardHeader>
              <StatValue>
                <Text variant="body" fontWeight="bold" color="var(--blue-600)" style={{ fontSize: '1.25rem' }}>
                  {groupStats.largestGroup.label}
                </Text>
                <Text variant="caption" color="var(--grey-500)">
                  {groupStats.largestGroup.words.length}개 단어
                </Text>
              </StatValue>
            </StatCard>
          </>
        )}
      </StatsGrid>

      {/* 분석 진행률 */}
      <ProgressSection>
        <ProgressHeader>
          <Heading level={5}>분석 완성도</Heading>
          <Text variant="caption" color="var(--grey-500)">
            {Math.round(stats.analysisProgress)}% 완료
          </Text>
        </ProgressHeader>
        <div style={{
          width: '100%',
          height: '12px',
          backgroundColor: 'var(--grey-200)',
          borderRadius: '4px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${stats.analysisProgress}%`,
            height: '100%',
            backgroundColor: 'var(--primary-500)',
            transition: 'width 0.3s ease'
          }} />
        </div>
        <DataQuality quality={stats.dataQuality}>
          <Text variant="caption">
            데이터 품질: {
              stats.dataQuality === 'high' ? '높음' :
              stats.dataQuality === 'medium' ? '보통' : '낮음'
            }
          </Text>
        </DataQuality>
      </ProgressSection>

      {/* 상위 단어 목록 */}
      {stats.topWords.length > 0 && (
        <TopWordsSection>
          <Heading level={5}>상위 단어 목록</Heading>
          <TopWordsList>
            {stats.topWords.slice(0, 8).map((item, index) => (
              <TopWordItem key={item.word} rank={index + 1}>
                <WordRank>{index + 1}</WordRank>
                <WordInfo>
                  <Text variant="body" fontWeight="bold">{item.word}</Text>
                  <Text variant="caption" color="var(--grey-500)">
                    {item.frequency}회
                  </Text>
                </WordInfo>
              </TopWordItem>
            ))}
          </TopWordsList>
        </TopWordsSection>
      )}
    </SummaryContainer>
  );
}

const SummaryContainer = styled(Box)`
  background: var(--white);
  border: 1px solid var(--grey-200);
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const SummaryHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const StatsGrid = styled(Grid)`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
`;

const StatCard = styled(GridItem)`
  background: var(--grey-25);
  border: 1px solid var(--grey-100);
  border-radius: 8px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  transition: all 0.2s ease;

  &:hover {
    border-color: var(--primary-200);
    background: var(--primary-25);
  }
`;

const StatCardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const StatValue = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const StatDescription = styled.div`
  border-top: 1px solid var(--grey-200);
  padding-top: 0.5rem;
`;

const TrendValue = styled(Text)<{ trend: number }>`
  font-size: 1.5rem;
  font-weight: bold;
  color: ${props => 
    props.trend > 0 ? 'var(--positive-600)' :
    props.trend < 0 ? 'var(--negative-600)' :
    'var(--grey-600)'
  };
`;

const ProgressSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
  background: var(--grey-25);
  border-radius: 8px;
`;

const ProgressHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const DataQuality = styled.div<{ quality: string }>`
  align-self: flex-end;
  color: ${props => 
    props.quality === 'high' ? 'var(--positive-600)' :
    props.quality === 'medium' ? 'var(--warning-600)' :
    'var(--negative-600)'
  };
`;

const TopWordsSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const TopWordsList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 0.75rem;
`;

const TopWordItem = styled.div<{ rank: number }>`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: ${props => 
    props.rank <= 3 ? 'var(--primary-50)' : 'var(--grey-50)'
  };
  border: 1px solid ${props => 
    props.rank <= 3 ? 'var(--primary-200)' : 'var(--grey-200)'
  };
  border-radius: 6px;
`;

const WordRank = styled.div`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--primary-500);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: bold;
  flex-shrink: 0;
`;

const WordInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
`;