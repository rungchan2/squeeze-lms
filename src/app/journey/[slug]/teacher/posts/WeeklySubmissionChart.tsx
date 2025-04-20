"use client";

import { useState, useMemo, memo } from "react";
import styled from "@emotion/styled";
import { useJourneyWeeklyStats, WeeklyStat } from "@/hooks/useJourneyWeeklyStats";
import Heading from "@/components/Text/Heading";
import Text from "@/components/Text/Text";
import Spinner from "@/components/common/Spinner";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { useParams } from "next/navigation";

// 미제출 상세 정보 표시 컴포넌트
const IncompleteDetailsList = styled.ul`
  list-style: none;
  padding: 0;
  max-height: 150px; /* 스크롤 추가 */
  overflow-y: auto;
  border-top: 1px solid var(--grey-200);
  padding-top: 1rem;

  li {
    font-size: 0.875rem; /* caption과 비슷하게 */
    color: var(--grey-700);

    strong {
      color: var(--grey-900);
    }
  }
`;

// 토글 버튼
const ToggleDetailsButton = styled.button`
  background: none;
  border: none;
  color: var(--primary-500);
  cursor: pointer;
  font-weight: bold;
  padding: 0.5rem 0;
  margin-top: 0.5rem;
  align-self: flex-start; /* 왼쪽 정렬 */

  &:hover {
    text-decoration: underline;
  }
`;

// 도넛 차트 컴포넌트 (메모이제이션)
const DonutChart = memo(({ weekStat }: { weekStat: WeeklyStat }) => {
  const [isDetailsVisible, setIsDetailsVisible] = useState(false);

  // 차트 데이터를 메모이제이션
  const chartData = useMemo(() => [
    { name: "제출완료", value: weekStat.submissionRate },
    { name: "미제출", value: weekStat.remainingRate }
  ], [weekStat.submissionRate, weekStat.remainingRate]);

  // 미제출 상세 정보 메모이제이션
  const incompleteDetails = useMemo(() => {
    if (!weekStat.incompleteMissionList || weekStat.incompleteMissionList.length === 0) {
      return <Text variant="caption" color="var(--grey-500)">모든 학생이 모든 미션을 제출했습니다.</Text>;
    }
    return (
      <IncompleteDetailsList>
        {weekStat.incompleteMissionList.map((item, index) => (
          <li key={`${item.user_id}-${item.mission_name}-${index}`}>
            <strong>{item.user_name}</strong> - {item.mission_name}
          </li>
        ))}
      </IncompleteDetailsList>
    );
  }, [weekStat.incompleteMissionList]);

  const toggleDetails = () => {
    setIsDetailsVisible(prev => !prev);
  };

  return (
    <WeekChartContainer>
      <WeekHeader>
        <Heading level={5}>{weekStat.name}</Heading>
        <StatsInfoContainer>
          <StatItem>
            <Text variant="caption">전체 미션</Text>
            <Text variant="body" fontWeight="bold">{weekStat.totalMissions}개</Text>
          </StatItem>
          <StatItem>
            <Text variant="caption">전체 학생</Text>
            <Text variant="body" fontWeight="bold">{weekStat.totalStudents}명</Text>
          </StatItem>
        </StatsInfoContainer>
      </WeekHeader>
      
      <ChartContainer>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              innerRadius={45}
              outerRadius={70}
              fill="#8884d8"
              dataKey="value"
              isAnimationActive={false}
            >
              <Cell key="cell-0" fill="var(--primary-500)" />
              <Cell key="cell-1" fill="var(--grey-300)" />
            </Pie>
            <Tooltip 
              formatter={(value: number) => [`${value}%`, '제출률']}
              contentStyle={{ 
                backgroundColor: 'var(--white)',
                border: '1px solid var(--grey-200)',
                borderRadius: '4px'
              }}
            />
            <Legend 
              layout="horizontal" 
              verticalAlign="bottom"
              align="center"
            />
          </PieChart>
        </ResponsiveContainer>
        
        <PercentageDisplay submissionRate={weekStat.submissionRate}>
          <div className="percentage">{weekStat.submissionRate}%</div>
          <Text variant="caption">제출률</Text>
        </PercentageDisplay>
      </ChartContainer>
      
      <SubmissionDetails>
        <StatItem>
          <Text variant="caption">총 제출 가능 횟수</Text>
          <Text variant="body" fontWeight="bold">
            {weekStat.totalPossibleSubmissions}회
          </Text>
        </StatItem>
        <StatItem>
          <Text variant="caption">제출 완료</Text>
          <Text variant="body" fontWeight="bold" color="var(--primary-500)">
            {weekStat.submittedMissions}회 ({weekStat.submissionRate}%)
          </Text>
        </StatItem>
        <StatItem>
          <Text variant="caption">미제출</Text>
          <Text variant="body" fontWeight="bold" color="var(--grey-600)">
            {weekStat.totalPossibleSubmissions - weekStat.submittedMissions}회 ({weekStat.remainingRate}%)
          </Text>
        </StatItem>
      </SubmissionDetails>

      {/* 미제출 상세 정보 토글 버튼 및 리스트 */}      
      <ToggleDetailsButton onClick={toggleDetails}>
        {isDetailsVisible ? '미제출 상세 숨기기' : '미제출 상세 보기'}
      </ToggleDetailsButton>

      {isDetailsVisible && incompleteDetails}

    </WeekChartContainer>
  );
});

// 컴포넌트 표시 이름 설정 (개발 도구에서 확인용)
DonutChart.displayName = 'DonutChart';

export default function WeeklySubmissionChart() {
  const { slug } = useParams();
  
  // 사용할 journeyId 결정
  const journeyIdToUse = slug;
  
  const { weeklyStats, isLoading, error } = useJourneyWeeklyStats(
    journeyIdToUse ? journeyIdToUse.toString() : undefined
  );
  
  // 주차 데이터 메모이제이션 - 조건부 렌더링 전에 선언
  const memoizedWeeklyStats = useMemo(() => {
    return weeklyStats || [];
  }, [weeklyStats]);

  if (isLoading) {
    return <Spinner />;
  }

  if (error) {
    // 에러 메시지 추출
    let errorMessage = "데이터를 불러오는 중 오류가 발생했습니다.";
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    
    console.error("[WeeklySubmissionChart] 오류:", error);
    
    return (
      <EmptyAndErrorState>
        <Text fontWeight="bold" color="var(--negative-700)">오류 발생</Text>
        <Text>{errorMessage}</Text>
        <RetryButton onClick={() => window.location.reload()}>
          <Text fontWeight="bold" color="white">다시 시도</Text>
        </RetryButton>
      </EmptyAndErrorState>
    );
  }

  if (memoizedWeeklyStats.length === 0) {
    return (
      <EmptyAndErrorState>
        <Text color="var(--grey-500)">주차 데이터가 없습니다.</Text>
        <Text variant="caption" color="var(--grey-400)">
          {journeyIdToUse 
            ? "이 Journey에 주차 또는 미션 데이터가 없습니다." 
            : "Journey ID를 불러오지 못했습니다."}
        </Text>
      </EmptyAndErrorState>
    );
  }

  return (
    <WeeklyChartContainer>
      <Heading level={4}>주차별, 전체 학생의 과제 제출률</Heading>
      <Text variant="caption">각 주차별로 전체 학생들의 미션 제출률을 확인할 수 있습니다.</Text>
      
      <ChartsGrid>
        {memoizedWeeklyStats.map((weekStat) => (
          <DonutChart key={weekStat.id} weekStat={weekStat} />
        ))}
      </ChartsGrid>
    </WeeklyChartContainer>
  );
}

const WeeklyChartContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem 0;
`;

const ChartsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-top: 1rem;
`;

const WeekChartContainer = styled.div`
  background-color: var(--white);
  border-radius: 8px;
  border: 1px solid var(--grey-200);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
`;

const WeekHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const StatsInfoContainer = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 1rem;
`;

const StatItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const ChartContainer = styled.div`
  position: relative;
  height: 200px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const PercentageDisplay = styled.div<{ submissionRate: number }>`
  position: absolute;
  top: 45%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  
  .percentage {
    font-size: 1.5rem;
    font-weight: bold;
    color: ${(props) => 
      props.submissionRate >= 80 
        ? 'var(--primary-600)' 
        : props.submissionRate >= 50 
          ? 'var(--warning-500)' 
          : 'var(--negative-500)'
    };
  }
`;

const SubmissionDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  border-top: 1px solid var(--grey-200);
  padding-top: 1rem;
  margin-top: 0.5rem;
`;

const EmptyAndErrorState = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 2rem;
  gap: 1rem;
  background-color: var(--grey-50);
  border-radius: 8px;
  border: 1px dashed var(--grey-300);
`;

const RetryButton = styled.button`
  background-color: var(--primary-500);
  color: white;
  border: none;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background-color: var(--primary-600);
  }
`; 