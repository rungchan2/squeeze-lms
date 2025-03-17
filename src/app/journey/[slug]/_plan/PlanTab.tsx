"use client";
import { Suspense, useEffect, useState, useCallback, memo } from "react";
import Text from "@/components/Text/Text";
import Heading from "@/components/Text/Heading";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { getJourney } from "../../clientActions";
import Spinner from "@/components/common/Spinner";
import { useWeeks } from "@/hooks/useWeeks";
import styled from "@emotion/styled";
import WeekCard from "./WeekCard";
import { AdminOnly } from "@/components/auth/AdminOnly";
import { FloatingButton } from "@/components/common/FloatingButton";
import { FaWandMagicSparkles } from "react-icons/fa6";

// WeekCard 컴포넌트를 메모이제이션
const MemoizedWeekCard = memo(WeekCard);

// 최상위 컨테이너만 styled component로 정의
const PlanContainer = styled.div`
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .add-button {
    padding: 0.5rem 1rem;
    background-color: var(--blue-500);
    color: var(--white);
    border-radius: 0.25rem;
    border: none;
    cursor: pointer;
    transition: background-color 0.2s;

    &:hover {
      background-color: var(--blue-600);
    }
  }

  .weeks-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .empty-state {
    text-align: center;
    padding: 2rem 0;
  }
`;

export default function PlanTab() {
  const router = useRouter();
  const pathname = usePathname();
  const slug = pathname.split("/").pop() ?? "";
  const [journeyId, setJourneyId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 여행 ID 가져오기
  useEffect(() => {
    const fetchJourneyId = async () => {
      try {
        const { data, error } = await getJourney(slug);
        if (error) {
          console.error("Error fetching journey ID:", error);
          router.push("/");
          return;
        }
        setJourneyId(data?.id || null);
      } catch (error) {
        console.error("Error:", error);
        router.push("/");
      } finally {
        setIsLoading(false);
      }
    };

    fetchJourneyId();
  }, [slug, router]);

  // useWeeks 훅 사용
  const {
    weeks,
    isLoading: weeksLoading,
    error: weeksError,
    createWeek,
    updateWeek,
    deleteWeek,
  } = useWeeks(journeyId || 0);

  // 새 주차 추가 핸들러 예시
  const handleAddWeek = useCallback(async () => {
    try {
      if (!journeyId) return;

      await createWeek({
        journey_id: journeyId,
        name: `Week ${weeks.length + 1}`,
        week_number: weeks.length + 1,
      });
    } catch (error) {
      console.error("Error adding week:", error);
    }
  }, [journeyId, weeks, createWeek]);

  if (isLoading) {
    return (
      <div>
        <Spinner />
      </div>
    );
  }

  if (weeksError) {
    return (
      <div>
        <Heading level={2}>오류 발생</Heading>
        <Text>주차 정보를 불러오는 중 오류가 발생했습니다.</Text>
      </div>
    );
  }

  return (
    <PlanContainer>
      <div className="header">
        <Heading level={2}>여행 일정</Heading>
      </div>

      <Suspense fallback={<Spinner />}>
        {weeksLoading ? (
          <Spinner />
        ) : weeks.length > 0 ? (
          <div className="weeks-list">
            {weeks
              .sort((a, b) => (a.week_number ?? 0) - (b.week_number ?? 0))
              .map((week, index) => (
                <MemoizedWeekCard
                  key={week.id}
                  week={week}
                  updateWeek={updateWeek}
                  deleteWeek={deleteWeek}
                  index={index}
                  journeyId={journeyId || 0}
                />
              ))}
          </div>
        ) : (
          <div className="empty-state">
            <Text>등록된 주차가 없습니다. 새 주차를 추가해보세요.</Text>
          </div>
        )}
      </Suspense>
      <AdminOnly>
        <FloatingButton onClick={handleAddWeek}>
          <FaWandMagicSparkles />
          <Text variant="body" fontWeight="bold" color="var(--white)">
            새 주차
          </Text>
        </FloatingButton>
      </AdminOnly>
    </PlanContainer>
  );
}
