"use client";

import { useEffect, useState } from "react";
import styled from "@emotion/styled";
import { createClient } from "@/utils/supabase/client";
import Text from "@/components/Text/Text";
import Spinner from "@/components/common/Spinner";
import { FaTrophy } from "react-icons/fa";
import { ProfileImage } from "@/components/navigation/ProfileImage";
import { useAuth } from "@/components/AuthProvider";
import { Box } from "@chakra-ui/react";
import { z } from "zod";
import { useJourneyStore } from "@/store/journey";
import { getUserPointsByJourneyId } from "@/app/journey/actions";
import { useJourneyMissionInstances } from "@/hooks/useJourneyMissionInstances";
import { useWeeks } from "@/hooks/useWeeks";
import Heading from "@/components/Text/Heading";

// Zod 스키마 정의
const leaderboardUserSchema = z.object({
  id: z.number(),
  first_name: z.string().nullable(),
  last_name: z.string().nullable(),
  profile_image: z.string().nullable(),
  organization_name: z.string().nullable(),
  total_score: z.number(),
  rank: z.number(),
  isCurrentUser: z.boolean(),
});

const submissionStatsSchema = z.object({
  totalPosts: z.number(),
  completedPosts: z.number(),
  pendingPosts: z.number(),
  completionRate: z.number(),
});

// 타입 정의
type LeaderboardUser = z.infer<typeof leaderboardUserSchema>;
type SubmissionStats = z.infer<typeof submissionStatsSchema>;

interface WeekProgress {
  id: number;
  name: string;
  weekNumber: number;
  totalMissions: number;
  completedMissions: number;
  completionRate: number;
}

export default function DashboardTab() {
  const { id: userId } = useAuth();
  const { currentJourneyId } = useJourneyStore();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [leaderboardUsers, setLeaderboardUsers] = useState<LeaderboardUser[]>(
    []
  );
  const [weekProgress, setWeekProgress] = useState<WeekProgress[]>([]);
  const [totalCompletionRate, setTotalCompletionRate] = useState(0);

  // 주차 데이터 가져오기
  const { weeks, isLoading: weeksLoading } = useWeeks(currentJourneyId || 0);

  // 전체 미션 인스턴스 가져오기
  const { missionInstances, isLoading: missionsLoading } =
    useJourneyMissionInstances(0);

  useEffect(() => {
    if (!userId || !currentJourneyId) {
      return;
    }

    async function fetchDashboardData() {
      try {
        setIsLoading(true);
        setError(null);

        const supabase = createClient();

        // 1. 점수 데이터 가져오기
        const { data: pointsData, error: pointsError } =
          await getUserPointsByJourneyId(currentJourneyId);
        if (pointsError) {
          console.error("포인트 데이터 가져오기 오류:", pointsError);
          throw new Error("포인트 데이터를 가져오는 중 오류 발생");
        }

        // 2. 사용자별 점수 계산 및 리더보드 생성
        // 모든 사용자 프로필 가져오기
        const { data: profiles, error: profilesError } = await supabase.from(
          "profiles"
        ).select(`
            id, 
            first_name, 
            last_name, 
            profile_image,
            organizations (
              id,
              name
            )
          `);

        if (profilesError)
          throw new Error("프로필 데이터를 가져오는 중 오류 발생");

        // 사용자별 점수 계산
        const userScores: Record<number, number> = {};

        if (pointsData) {
          pointsData.forEach((point: any) => {
            const userId = point.profile_id;
            const score = point.total_points || 0;

            if (!userScores[userId]) {
              userScores[userId] = 0;
            }
            userScores[userId] += score;
          });
        }

        // 리더보드 데이터 구성
        const leaderboard = Object.keys(userScores).map((userIdStr) => {
          const profileId = Number(userIdStr);
          const profile = profiles?.find((p) => p.id === profileId);

          return {
            id: profileId,
            first_name: profile?.first_name || null,
            last_name: profile?.last_name || null,
            profile_image: profile?.profile_image || null,
            organization_name: profile?.organizations?.name || null,
            total_score: userScores[profileId] || 0,
            rank: 0, // 초기값, 아래에서 계산
            isCurrentUser: profileId === userId,
          };
        });


        // 점수별 내림차순 정렬 및 순위 할당
        leaderboard.sort((a, b) => b.total_score - a.total_score);
        leaderboard.forEach((user, index) => {
          user.rank = index + 1;
        });

        setLeaderboardUsers(leaderboard);

        // 3. 주차별 진행 상황 계산
        if (weeks && missionInstances && pointsData) {
          const weekProgressData: WeekProgress[] = weeks.map((week) => {
            // 해당 주차의 미션 인스턴스 찾기
            const weekMissions = missionInstances.filter(
              (instance) => instance.journey_week_id === week.id
            );

            // 완료된 미션 수 계산 (user_points 기준)
            const weekMissionsIds = weekMissions.map((mission) => mission.id);
            const completedMissions = pointsData.filter((point: any) => {
              return (
                point.profile_id === userId &&
                point.mission_instance_id &&
                weekMissionsIds.includes(point.mission_instance_id)
              );
            }).length;

            const totalMissions = weekMissions.length;
            const completionRate =
              totalMissions > 0
                ? Math.round((completedMissions / totalMissions) * 100)
                : 0;

            return {
              id: week.id,
              name: week.name || `Week ${week.week_number}`,
              weekNumber: week.week_number || 0,
              totalMissions,
              completedMissions,
              completionRate,
            };
          });

          // 주차 번호 기준 정렬
          weekProgressData.sort((a, b) => a.weekNumber - b.weekNumber);
          setWeekProgress(weekProgressData);

          // 전체 완료율 계산
          const totalMissions = weekProgressData.reduce(
            (sum, week) => sum + week.totalMissions,
            0
          );
          const totalCompleted = weekProgressData.reduce(
            (sum, week) => sum + week.completedMissions,
            0
          );
          const overallRate =
            totalMissions > 0
              ? Math.round((totalCompleted / totalMissions) * 100)
              : 0;

          setTotalCompletionRate(overallRate);
        }
      } catch (err) {
        console.error("대시보드 데이터를 가져오는 중 오류 발생:", err);
        setError(
          err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다."
        );
      } finally {
        setIsLoading(false);
      }
    }

    // 주차 및 미션 데이터가 로딩되었거나 로딩 중이 아닐때 대시보드 데이터 가져오기
    if (weeks && missionInstances) {
      fetchDashboardData();
    }
  }, [currentJourneyId, userId, weeks, missionInstances]);

  if (isLoading || weeksLoading || missionsLoading) {
    return <Spinner />;
  }

  if (error) {
    return (
      <ErrorContainer>
        <Text color="var(--negative-500)">오류: {error}</Text>
      </ErrorContainer>
    );
  }

  return (
    <DashboardTabContainer>
      {/* 전체 미션 진행 상황 */}
      <SectionContainer>
        <Text variant="body" fontWeight="bold" className="section-title">
          전체 미션 진행 상황
        </Text>

        <StatsContainer>
          <CircularProgressWrapper>
            <Box position="relative" width="120px" height="120px">
              <svg viewBox="0 0 36 36" className="circular-chart">
                <path
                  className="circle-bg"
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="circle"
                  strokeDasharray={`${totalCompletionRate}, 100`}
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <text x="18" y="20.35" className="percentage">
                  {totalCompletionRate}%
                </text>
              </svg>
            </Box>
            <Text variant="caption">전체 미션 완료율</Text>
          </CircularProgressWrapper>

          <StatsDetailsContainer>
            <StatItem>
              <Text variant="body" color="var(--grey-500)">
                전체 미션 수
              </Text>
              <Text variant="body" fontWeight="bold">
                {weekProgress.reduce(
                  (sum, week) => sum + week.totalMissions,
                  0
                )}
                개
              </Text>
            </StatItem>
            <StatItem>
              <Text variant="body" color="var(--grey-500)">
                완료한 미션 수
              </Text>
              <Text variant="body" fontWeight="bold" color="var(--primary-500)">
                {weekProgress.reduce(
                  (sum, week) => sum + week.completedMissions,
                  0
                )}
                개
              </Text>
            </StatItem>
            <StatItem>
              <Text variant="body" color="var(--grey-500)">
                남은 미션 수
              </Text>
              <Text variant="body" fontWeight="bold" color="var(--warning-500)">
                {weekProgress.reduce(
                  (sum, week) =>
                    sum + (week.totalMissions - week.completedMissions),
                  0
                )}
                개
              </Text>
            </StatItem>
          </StatsDetailsContainer>
        </StatsContainer>
      </SectionContainer>

      {/* 주차별 진행 상황 */}
      <SectionContainer>
        <Text variant="body" fontWeight="bold" className="section-title">
          주차별 진행 상황
        </Text>

        {weekProgress.length > 0 ? (
          <WeekProgressContainer>
            {weekProgress.map((week) => (
              <WeekProgressItem key={week.id}>
                <WeekHeader>
                  <Heading level={4}>{week.name}</Heading>
                  <Text
                    variant="body"
                    fontWeight="bold"
                    color={
                      week.completionRate >= 100
                        ? "var(--primary-500)"
                        : "var(--warning-500)"
                    }
                  >
                    {week.completionRate}%
                  </Text>
                </WeekHeader>

                <ProgressBarContainer>
                  <ProgressBar progress={week.completionRate} />
                </ProgressBarContainer>

                <WeekDetailsContainer>
                  <MissionCountItem>
                    <Text variant="caption">총 미션</Text>
                    <Text variant="body" fontWeight="bold">
                      {week.totalMissions}개
                    </Text>
                  </MissionCountItem>
                  <MissionCountItem>
                    <Text variant="caption">완료</Text>
                    <Text
                      variant="body"
                      fontWeight="bold"
                      color="var(--primary-500)"
                    >
                      {week.completedMissions}개
                    </Text>
                  </MissionCountItem>
                  <MissionCountItem>
                    <Text variant="caption">남음</Text>
                    <Text
                      variant="body"
                      fontWeight="bold"
                      color="var(--warning-500)"
                    >
                      {week.totalMissions - week.completedMissions}개
                    </Text>
                  </MissionCountItem>
                </WeekDetailsContainer>
              </WeekProgressItem>
            ))}
          </WeekProgressContainer>
        ) : (
          <EmptyState>
            <Text color="var(--grey-500)">주차 데이터가 없습니다.</Text>
          </EmptyState>
        )}
      </SectionContainer>

      {/* 리더보드 섹션 */}
      <SectionContainer>
        <Text variant="body" fontWeight="bold" className="section-title">
          리더보드
        </Text>

        {leaderboardUsers.length > 0 ? (
          <LeaderboardContainer>
            {leaderboardUsers.map((user) => (
              <LeaderboardItem
                key={user.id}
                rank={user.rank}
                isCurrentUser={user.isCurrentUser}
              >
                <div className="rank-container">
                  {user.rank <= 3 ? (
                    <FaTrophy className={`trophy rank-${user.rank}`} />
                  ) : (
                    <div className="rank-number">{user.rank}</div>
                  )}
                </div>

                <div className="user-info">
                  <ProfileImage
                    profileImage={user.profile_image || ""}
                    width={40}
                  />
                  <div className="user-details">
                    <Text variant="body" fontWeight="bold">
                      {user.first_name} {user.last_name}
                      {user.isCurrentUser && (
                        <span className="current-user-badge">나</span>
                      )}
                    </Text>
                    <Text variant="caption" color="var(--grey-500)">
                      {user.organization_name || "소속 없음"}
                    </Text>
                  </div>
                </div>

                <div className="score-container">
                  <Text variant="body" fontWeight="bold">
                    {user.total_score}점
                  </Text>
                </div>
              </LeaderboardItem>
            ))}
          </LeaderboardContainer>
        ) : (
          <EmptyState>
            <Text color="var(--grey-500)">
              아직 리더보드 데이터가 없습니다.
            </Text>
          </EmptyState>
        )}
      </SectionContainer>
    </DashboardTabContainer>
  );
}

const DashboardTabContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

const SectionContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;

  .section-title {
    margin-bottom: 0.5rem;
  }
`;

const StatsContainer = styled.div`
  display: flex;
  flex-direction: row;
  gap: 2rem;
  background-color: var(--white);
  border-radius: 8px;
  border: 1px solid var(--grey-200);
  padding: 1.5rem;
  align-items: center;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: center;
  }
`;

const CircularProgressWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;

  .circular-chart {
    display: block;
    margin: 0 auto;
    max-width: 100%;
    max-height: 100%;
  }

  .circle-bg {
    fill: none;
    stroke: var(--grey-200);
    stroke-width: 3;
  }

  .circle {
    fill: none;
    stroke: var(--primary-500);
    stroke-width: 3;
    stroke-linecap: round;
    animation: progress 1s ease-out forwards;
  }

  .percentage {
    fill: var(--grey-700);
    font-size: 0.5em;
    text-anchor: middle;
    font-weight: bold;
  }

  @keyframes progress {
    0% {
      stroke-dasharray: 0 100;
    }
  }
`;

const StatsDetailsContainer = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  flex: 1;
`;

const StatItem = styled.div`
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--grey-100);

  &:last-child {
    border-bottom: none;
  }
`;

// 주차별 진행 상황 스타일
const WeekProgressContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const WeekProgressItem = styled.div`
  background-color: var(--white);
  border-radius: 8px;
  border: 1px solid var(--grey-200);
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const WeekHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ProgressBarContainer = styled.div`
  width: 100%;
  height: 8px;
  background-color: var(--grey-200);
  border-radius: 4px;
  overflow: hidden;
`;

const ProgressBar = styled.div<{ progress: number }>`
  height: 100%;
  width: ${(props) => props.progress}%;
  background-color: var(--primary-500);
  border-radius: 4px;
  transition: width 0.5s ease-in-out;
`;

const WeekDetailsContainer = styled.div`
  display: flex;
  justify-content: space-between;
`;

const MissionCountItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
`;

// 리더보드 스타일
const LeaderboardContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  background-color: var(--white);
  border-radius: 8px;
  border: 1px solid var(--grey-200);
  overflow: hidden;
`;

const LeaderboardItem = styled.div<{ rank: number; isCurrentUser: boolean }>`
  display: flex;
  align-items: center;
  padding: 1rem;
  background-color: ${(props) =>
    props.isCurrentUser
      ? "var(--primary-50)"
      : props.rank === 1
      ? "var(--gold-50)"
      : props.rank === 2
      ? "var(--silver-50)"
      : props.rank === 3
      ? "var(--bronze-50)"
      : "var(--white)"};
  border-bottom: 1px solid var(--grey-100);

  &:last-child {
    border-bottom: none;
  }

  .rank-container {
    width: 40px;
    display: flex;
    justify-content: center;
    align-items: center;

    .trophy {
      font-size: 1.5rem;

      &.rank-1 {
        color: var(--gold-500);
      }

      &.rank-2 {
        color: var(--silver-500);
      }

      &.rank-3 {
        color: var(--bronze-500);
      }
    }

    .rank-number {
      font-size: 1.2rem;
      font-weight: bold;
      color: var(--grey-700);
    }
  }

  .user-info {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-left: 1rem;

    .user-details {
      display: flex;
      flex-direction: column;

      .current-user-badge {
        margin-left: 0.5rem;
        padding: 0.1rem 0.4rem;
        background-color: var(--primary-500);
        color: white;
        border-radius: 4px;
        font-size: 0.7rem;
        vertical-align: middle;
      }
    }
  }

  .score-container {
    margin-left: auto;
    padding-left: 1rem;
  }
`;

const EmptyState = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  background-color: var(--grey-50);
  border-radius: 8px;
  border: 1px dashed var(--grey-300);
`;

const ErrorContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  background-color: var(--negative-50);
  border-radius: 8px;
  border: 1px dashed var(--negative-300);
`;
