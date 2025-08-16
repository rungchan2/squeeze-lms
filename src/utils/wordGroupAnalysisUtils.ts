import { WordFrequencyResponse } from "@/hooks/useWordFrequencyAnalysis";
import { WordGroupingResponse, WordGroup } from "@/hooks/useWordGrouping";

export interface GroupFrequencyData {
  groupLabel: string;
  totalFrequency: number;
  words: Array<{
    word: string;
    frequency: number;
  }>;
}

export interface WeekGroupFrequency {
  weekIndex: number;
  weekName: string;
  groups: { [groupLabel: string]: number }; // 그룹 라벨을 키로, 빈도를 값으로
}

export interface ChartGroupData {
  weekName: string;
  [groupLabel: string]: number | string; // 그룹 라벨을 키로, 빈도를 값으로
}

/**
 * 단어 빈도 데이터와 그룹핑 데이터를 결합하여 그룹별 빈도 합계를 계산
 */
export function calculateGroupFrequencies(
  wordFrequencyData: WordFrequencyResponse[],
  wordGroupData: WordGroupingResponse | undefined,
  weekNames: string[]
): WeekGroupFrequency[] {
  if (!wordGroupData?.groups || wordFrequencyData.length === 0) {
    return [];
  }

  const result: WeekGroupFrequency[] = [];

  wordFrequencyData.forEach((weekData, weekIndex) => {
    if (!weekData?.word_frequency) return;

    const weekFrequencyMap = new Map(weekData.word_frequency);
    const groups: { [groupLabel: string]: number } = {};

    // 각 그룹별로 빈도 합계 계산
    wordGroupData.groups.forEach(group => {
      let totalFrequency = 0;

      group.words.forEach(word => {
        const frequency = weekFrequencyMap.get(word) || 0;
        if (frequency > 0) {
          totalFrequency += frequency;
        }
      });

      if (totalFrequency > 0) {
        groups[group.label] = totalFrequency;
      }
    });

    result.push({
      weekIndex,
      weekName: weekNames[weekIndex] || `${weekIndex + 1}주차`,
      groups
    });
  });

  return result;
}

/**
 * 주차별 그룹 빈도 데이터를 차트용 데이터로 변환
 */
export function transformToChartData(
  weekGroupFrequencies: WeekGroupFrequency[],
  selectedGroups: Set<string>
): ChartGroupData[] {
  return weekGroupFrequencies.map(week => {
    const chartData: ChartGroupData = {
      weekName: week.weekName
    };

    // 선택된 그룹만 차트 데이터에 포함
    Object.entries(week.groups).forEach(([groupLabel, totalFrequency]) => {
      if (selectedGroups.has(groupLabel)) {
        chartData[groupLabel] = totalFrequency;
      }
    });

    return chartData;
  });
}

/**
 * 모든 가능한 그룹 라벨을 추출
 */
export function extractAllGroupLabels(weekGroupFrequencies: WeekGroupFrequency[]): string[] {
  const groupLabels = new Set<string>();
  
  weekGroupFrequencies.forEach(week => {
    Object.keys(week.groups).forEach(groupLabel => {
      groupLabels.add(groupLabel);
    });
  });

  return Array.from(groupLabels).sort();
}

/**
 * 그룹별 전체 기간 통계 계산
 */
export function calculateGroupStatistics(weekGroupFrequencies: WeekGroupFrequency[]) {
  const groupStats = new Map<string, {
    totalFrequency: number;
    averageFrequency: number;
    maxFrequency: number;
    weeksAppeared: number;
  }>();

  weekGroupFrequencies.forEach(week => {
    Object.entries(week.groups).forEach(([groupLabel, totalFrequency]) => {
      if (!groupStats.has(groupLabel)) {
        groupStats.set(groupLabel, {
          totalFrequency: 0,
          averageFrequency: 0,
          maxFrequency: 0,
          weeksAppeared: 0
        });
      }

      const stats = groupStats.get(groupLabel)!;
      stats.totalFrequency += totalFrequency;
      stats.maxFrequency = Math.max(stats.maxFrequency, totalFrequency);
      stats.weeksAppeared += 1;
    });
  });

  // 평균 계산
  groupStats.forEach(stats => {
    stats.averageFrequency = stats.weeksAppeared > 0 
      ? Math.round(stats.totalFrequency / stats.weeksAppeared)
      : 0;
  });

  return groupStats;
}

/**
 * 차트에 사용할 색상 팔레트
 */
export const GROUP_COLOR_PALETTE = [
  '#8884d8', // 보라
  '#82ca9d', // 초록
  '#ffc658', // 노랑
  '#ff7c7c', // 분홍
  '#8dd1e1', // 하늘색
  '#d084d0', // 연보라
  '#87d068', // 연초록  
  '#ffb347', // 주황
] as const;

/**
 * 그룹에 색상 할당
 */
export function assignColorsToGroups(groupLabels: string[]): Record<string, string> {
  const colorMap: Record<string, string> = {};
  
  groupLabels.forEach((label, index) => {
    colorMap[label] = GROUP_COLOR_PALETTE[index % GROUP_COLOR_PALETTE.length];
  });

  return colorMap;
}