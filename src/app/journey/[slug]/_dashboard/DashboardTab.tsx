"use client";

import { useEffect, useState } from "react";
import styled from "@emotion/styled";
import { createClient } from "@/utils/supabase/client";
import Text from "@/components/Text/Text";
import Spinner from "@/components/common/Spinner";
import { FaTrophy } from "react-icons/fa";
import { ProfileImage } from "@/components/navigation/ProfileImage";
import { useAuth } from "@/components/AuthProvider";
import { usePathname } from "next/navigation";
import { Box } from "@chakra-ui/react";

// 리더보드 사용자 타입 정의
interface LeaderboardUser {
  id: number;
  first_name: string | null;
  last_name: string | null;
  profile_image: string | null;
  organization_name: string | null;
  total_score: number;
  rank: number;
  isCurrentUser: boolean;
}

// 제출 현황 타입 정의
interface SubmissionStats {
  totalMissions: number;
  completedMissions: number;
  submittedMissions: number;
  inProgressMissions: number;
  notStartedMissions: number;
  completionRate: number;
}

export default function DashboardTab() {
  const [leaderboardUsers, setLeaderboardUsers] = useState<LeaderboardUser[]>(
    []
  );
  const [submissionStats, setSubmissionStats] =
    useState<SubmissionStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { id: userId } = useAuth();
  const pathname = usePathname();

  // 현재 여정 ID 추출
  const getJourneyIdFromPathname = () => {
    const pathParts = pathname.split("/");
    return pathParts.length > 2 ? pathParts[2] : "";
  };

  const journeySlug = getJourneyIdFromPathname();

  useEffect(() => {
    const fetchLeaderboardData = async () => {
      try {
        setIsLoading(true);
        const supabase = createClient();

        // 먼저 journeySlug로 journey_id 가져오기
        const { data: journeyData, error: journeyError } = await supabase
          .from("journeys")
          .select("id")
          .eq("uuid", journeySlug)
          .single();

        if (journeyError) {
          throw new Error(
            `여정 데이터를 가져오는 중 오류 발생: ${journeyError.message}`
          );
        }

        const journeyId = journeyData.id;

        // 1. 현재 여정의 미션 인스턴스 가져오기
        const { data: missionInstances, error: missionsError } =
          await supabase.from("journey_mission_instances").select(`
            id,
            mission_id,
            status,
            missions (
              id,
              points
            )
          `);

        if (missionsError) {
          throw new Error(
            `미션 데이터를 가져오는 중 오류 발생: ${missionsError.message}`
          );
        }

        // 2. 사용자별 점수 계산을 위한 posts 데이터 가져오기
        const { data: posts, error: postsError } = await supabase.from("posts")
          .select(`
            id,
            mission_instance_id,
            user_id,
            score
          `);

        if (postsError) {
          throw new Error(
            `게시물 데이터를 가져오는 중 오류 발생: ${postsError.message}`
          );
        }

        // 3. 사용자별 점수 계산
        const userScores: Record<number, number> = {};

        // 완료된 미션 인스턴스 필터링
        const completedMissionInstances = missionInstances.filter(
          (mission) => mission.status === "completed"
        );

        // 각 완료된 미션에 대해 사용자 점수 계산
        completedMissionInstances.forEach((mission) => {
          // 해당 미션에 대한 게시물 찾기
          const relatedPosts = posts.filter(
            (post) => post.mission_instance_id === mission.id
          );

          relatedPosts.forEach((post) => {
            const postUserId = post.user_id;
            const missionPoints = mission.missions?.points || 0;
            const userScore = post.score || 0;

            // 사용자별 점수 누적
            if (!userScores[postUserId]) {
              userScores[postUserId] = 0;
            }
            userScores[postUserId] += userScore > 0 ? userScore : missionPoints;
          });
        });

        // 4. 사용자 정보 가져오기
        const userIds = Object.keys(userScores).map(Number);

        if (userIds.length === 0) {
          setLeaderboardUsers([]);
          return;
        }

        const { data: usersData, error: usersError } = await supabase
          .from("profiles")
          .select(
            `
            id,
            first_name,
            last_name,
            profile_image,
            organizations (
              name
            )
          `
          )
          .in("id", userIds);

        if (usersError) {
          throw new Error(
            `사용자 데이터를 가져오는 중 오류 발생: ${usersError.message}`
          );
        }

        // 5. 리더보드 데이터 생성 및 정렬
        const leaderboard = usersData.map((user) => ({
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          profile_image: user.profile_image,
          organization_name: user.organizations?.name || null,
          total_score: userScores[user.id] || 0,
          rank: 0, // 초기값, 아래에서 계산
          isCurrentUser: user.id === userId,
        }));

        // 점수 기준 내림차순 정렬
        leaderboard.sort((a, b) => b.total_score - a.total_score);

        // 순위 할당
        leaderboard.forEach((user, index) => {
          user.rank = index + 1;
        });

        // 상위 5명만 선택
        setLeaderboardUsers(leaderboard.slice(0, 5));

        // 6. 제출 현황 통계 계산
        const totalMissionsCount = missionInstances.length;
        const completedMissionsCount = missionInstances.filter(
          (m) => m.status === "completed"
        ).length;
        const submittedMissionsCount = missionInstances.filter(
          (m) => m.status === "submitted"
        ).length;
        const inProgressMissionsCount = missionInstances.filter(
          (m) => m.status === "in_progress"
        ).length;
        const notStartedMissionsCount = missionInstances.filter(
          (m) => m.status === "not_started"
        ).length;

        const completionRate =
          totalMissionsCount > 0
            ? Math.round((completedMissionsCount / totalMissionsCount) * 100)
            : 0;

        setSubmissionStats({
          totalMissions: totalMissionsCount,
          completedMissions: completedMissionsCount,
          submittedMissions: submittedMissionsCount,
          inProgressMissions: inProgressMissionsCount,
          notStartedMissions: notStartedMissionsCount,
          completionRate,
        });
      } catch (err) {
        console.error("리더보드 데이터를 가져오는 중 오류 발생:", err);
        setError(
          err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다."
        );
      } finally {
        setIsLoading(false);
      }
    };

    if (journeySlug) {
      fetchLeaderboardData();
    }
  }, [journeySlug, userId]);

  if (isLoading) {
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
      {/* 제출 현황 섹션 */}
      <SectionContainer>
        <Text variant="body" fontWeight="bold" className="section-title">
          미션 제출 현황
        </Text>

        {submissionStats ? (
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
                    strokeDasharray={`${submissionStats.completionRate}, 100`}
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <text x="18" y="20.35" className="percentage">
                    {submissionStats.completionRate}%
                  </text>
                </svg>
              </Box>
              <Text variant="caption">완료율</Text>
            </CircularProgressWrapper>

            <StatsDetailsContainer>
              <StatItem>
                <Text variant="body">전체 미션</Text>
                <Text variant="body" fontWeight="bold">
                  {submissionStats.totalMissions}개
                </Text>
              </StatItem>
              <StatItem>
                <Text variant="body">완료</Text>
                <Text
                  variant="body"
                  fontWeight="bold"
                  color="var(--primary-500)"
                >
                  {submissionStats.completedMissions}개
                </Text>
              </StatItem>
              <StatItem>
                <Text variant="body">제출됨</Text>
                <Text variant="body" fontWeight="bold" color="var(--info-500)">
                  {submissionStats.submittedMissions}개
                </Text>
              </StatItem>
              <StatItem>
                <Text variant="body">진행 중</Text>
                <Text
                  variant="body"
                  fontWeight="bold"
                  color="var(--warning-500)"
                >
                  {submissionStats.inProgressMissions}개
                </Text>
              </StatItem>
              <StatItem>
                <Text variant="body">시작 전</Text>
                <Text variant="body" fontWeight="bold" color="var(--grey-500)">
                  {submissionStats.notStartedMissions}개
                </Text>
              </StatItem>
            </StatsDetailsContainer>
          </StatsContainer>
        ) : (
          <EmptyState>
            <Text color="var(--grey-500)">미션 데이터가 없습니다.</Text>
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
            <Text color="var(--grey-500)">아직 완료된 미션이 없습니다.</Text>
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
  padding: 1rem;
`;

const SectionContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;

  .section-title {
    margin-bottom: 0.5rem;
  }
`;

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
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  flex: 1;
`;

const StatItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--grey-100);

  &:last-child {
    border-bottom: none;
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
