"use client";

import { useMemo } from "react";
import styled from "@emotion/styled";
import { Box, Badge, Grid, GridItem } from "@chakra-ui/react";
import Text from "@/components/Text/Text";
import Heading from "@/components/Text/Heading";
import Spinner from "@/components/common/Spinner";
import { WordGroupingResponse } from "@/hooks/useWordGrouping";

export interface WordGroupDisplayProps {
  data?: WordGroupingResponse;
  isLoading?: boolean;
  error?: Error | null;
  title?: string;
  subtitle?: string;
}

const GROUP_COLORS = [
  { bg: "var(--primary-50)", border: "var(--primary-200)", text: "var(--primary-700)" },
  { bg: "var(--positive-50)", border: "var(--positive-200)", text: "var(--positive-700)" },
  { bg: "var(--warning-50)", border: "var(--warning-200)", text: "var(--warning-700)" },
  { bg: "var(--negative-50)", border: "var(--negative-200)", text: "var(--negative-700)" },
  { bg: "var(--purple-50)", border: "var(--purple-200)", text: "var(--purple-700)" },
  { bg: "var(--blue-50)", border: "var(--blue-200)", text: "var(--blue-700)" },
  { bg: "var(--green-50)", border: "var(--green-200)", text: "var(--green-700)" },
  { bg: "var(--orange-50)", border: "var(--orange-200)", text: "var(--orange-700)" },
];

export default function WordGroupDisplay({
  data,
  isLoading = false,
  error = null,
  title = "단어 그룹 분석",
  subtitle = "유사한 의미의 단어들이 자동으로 그룹화되었습니다"
}: WordGroupDisplayProps) {
  const groupsWithColors = useMemo(() => {
    if (!data?.groups) return [];
    
    return data.groups.map((group, index) => ({
      ...group,
      color: GROUP_COLORS[index % GROUP_COLORS.length]
    }));
  }, [data?.groups]);

  const stats = useMemo(() => {
    if (!data?.groups) return { totalWords: 0, totalGroups: 0, avgWordsPerGroup: 0 };
    
    const totalWords = data.groups.reduce((sum, group) => sum + group.words.length, 0);
    const totalGroups = data.groups.length;
    const avgWordsPerGroup = totalGroups > 0 ? Math.round(totalWords / totalGroups * 10) / 10 : 0;
    
    return { totalWords, totalGroups, avgWordsPerGroup };
  }, [data?.groups]);

  if (isLoading) {
    return (
      <GroupContainer>
        <GroupHeader>
          <Heading level={4}>{title}</Heading>
          <Text variant="caption" color="var(--grey-600)">{subtitle}</Text>
        </GroupHeader>
        <LoadingState>
          <Spinner />
          <Text>단어 그룹을 분석하는 중...</Text>
        </LoadingState>
      </GroupContainer>
    );
  }

  if (error) {
    return (
      <GroupContainer>
        <GroupHeader>
          <Heading level={4}>{title}</Heading>
          <Text variant="caption" color="var(--negative-600)">
            그룹 분석 중 오류가 발생했습니다: {error.message}
          </Text>
        </GroupHeader>
      </GroupContainer>
    );
  }

  if (!data || !data.groups || data.groups.length === 0) {
    return (
      <GroupContainer>
        <GroupHeader>
          <Heading level={4}>{title}</Heading>
          <Text variant="caption" color="var(--grey-500)">
            그룹화할 단어가 충분하지 않습니다. 더 많은 데이터가 필요합니다.
          </Text>
        </GroupHeader>
      </GroupContainer>
    );
  }

  return (
    <GroupContainer>
      <GroupHeader>
        <div>
          <Heading level={4}>{title}</Heading>
          <Text variant="caption" color="var(--grey-600)">{subtitle}</Text>
        </div>
        
        <StatsContainer>
          <StatItem>
            <Text variant="caption" color="var(--grey-500)">총 그룹</Text>
            <Text variant="body" fontWeight="bold">{stats.totalGroups}개</Text>
          </StatItem>
          <StatItem>
            <Text variant="caption" color="var(--grey-500)">총 단어</Text>
            <Text variant="body" fontWeight="bold">{stats.totalWords}개</Text>
          </StatItem>
          <StatItem>
            <Text variant="caption" color="var(--grey-500)">평균</Text>
            <Text variant="body" fontWeight="bold">{stats.avgWordsPerGroup}개/그룹</Text>
          </StatItem>
        </StatsContainer>
      </GroupHeader>

      <GroupsGrid>
        {groupsWithColors.map((group, index) => (
          <GroupCard key={index} color={group.color}>
            <GroupCardHeader>
              <GroupLabel>
                <GroupIcon>{index + 1}</GroupIcon>
                <Heading level={5}>{group.label}</Heading>
              </GroupLabel>
              <WordCount>
                <Badge variant="outline" colorScheme="gray">
                  {group.words.length}개 단어
                </Badge>
              </WordCount>
            </GroupCardHeader>
            
            <WordsContainer>
              {group.words.map((word, wordIndex) => (
                <WordBadge key={wordIndex} color={group.color}>
                  {word}
                </WordBadge>
              ))}
            </WordsContainer>
            
            {group.words.length > 6 && (
              <WordOverflow>
                <Text variant="caption" color="var(--grey-500)">
                  +{group.words.length - 6}개 더...
                </Text>
              </WordOverflow>
            )}
          </GroupCard>
        ))}
      </GroupsGrid>

      <GroupInsights>
        <Heading level={5}>분석 인사이트</Heading>
        <InsightsList>
          <InsightItem>
            <Text variant="body">
              <strong>{stats.totalGroups}개의 주요 주제</strong>로 학생들의 답변이 분류되었습니다.
            </Text>
          </InsightItem>
          {stats.avgWordsPerGroup > 3 && (
            <InsightItem>
              <Text variant="body">
                그룹당 평균 <strong>{stats.avgWordsPerGroup}개 단어</strong>로 구성되어 
                주제별 어휘 다양성이 풍부합니다.
              </Text>
            </InsightItem>
          )}
          {groupsWithColors.length > 0 && (
            <InsightItem>
              <Text variant="body">
                가장 큰 그룹은 <strong>&ldquo;{groupsWithColors[0].label}&rdquo;</strong>로 
                {groupsWithColors[0].words.length}개의 관련 단어를 포함합니다.
              </Text>
            </InsightItem>
          )}
        </InsightsList>
      </GroupInsights>
    </GroupContainer>
  );
}

const GroupContainer = styled(Box)`
  background: var(--white);
  border: 1px solid var(--grey-200);
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const GroupHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const StatsContainer = styled.div`
  display: flex;
  gap: 1.5rem;
  
  @media (max-width: 768px) {
    justify-content: space-around;
  }
`;

const StatItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
`;

const LoadingState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 2rem;
  color: var(--grey-500);
`;

const GroupsGrid = styled(Grid)`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
`;

const GroupCard = styled(GridItem)<{ color: any }>`
  background: ${props => props.color.bg};
  border: 1px solid ${props => props.color.border};
  border-radius: 8px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`;

const GroupCardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
`;

const GroupLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const GroupIcon = styled.div`
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
`;

const WordCount = styled.div``;

const WordsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const WordBadge = styled(Badge)<{ color: any }>`
  background: ${props => props.color.bg};
  color: ${props => props.color.text};
  border: 1px solid ${props => props.color.border};
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
`;

const WordOverflow = styled.div`
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid var(--grey-200);
`;

const GroupInsights = styled.div`
  background: var(--grey-50);
  border-radius: 8px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const InsightsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const InsightItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;

  &::before {
    content: "•";
    color: var(--primary-500);
    font-weight: bold;
    margin-top: 0.1rem;
  }
`;