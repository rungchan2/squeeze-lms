"use client";
import { Suspense, useEffect, useState, useCallback, memo } from "react";
import Text from "@/components/Text/Text";
import Heading from "@/components/Text/Heading";
import { useRouter } from "next/navigation";
import Spinner from "@/components/common/Spinner";
import { useWeeks } from "@/hooks/useWeeks";
import styled from "@emotion/styled";
import WeekCard from "./WeekCard";
import { TeacherOnly } from "@/components/auth/AdminOnly";
import { FloatingButton } from "@/components/common/FloatingButton";
import { FaWandMagicSparkles } from "react-icons/fa6";
import { useSearchParams } from "next/navigation";
import { toaster } from "@/components/ui/toaster";
import Footer from "@/components/common/Footer";
import Button from "@/components/common/Button";
import { Modal } from "@/components/modal/Modal";
import { CreateJourneyWeek } from "@/types";
const MemoizedWeekCard = memo(WeekCard);

export default function PlanTab({ slug }: { slug: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const status = searchParams.get("status");

  const [weekName, setWeekName] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (status === "success") {
      toaster.create({
        title: "환영합니다! 클라스에 참여하셨습니다.",
        type: "success",
      });
      router.push(`/journey/${slug}`);
    }
  }, [status, router, slug]);

  const {
    weeks = [],
    isLoading: weeksLoading = false,
    error: weeksError = null,
    createWeek,
    updateWeek,
    deleteWeek,
  } = useWeeks(slug || "") || {};

  // 새 주차 추가 핸들러 예시
  const handleAddWeek = useCallback(async () => {
    if (!slug || !createWeek || !weekName) return;
    
    try {
      await createWeek({
        journey_id: slug,
        name: weekName || `Week ${weeks.length + 1}`,
        week_number: weeks.length + 1,
      } as CreateJourneyWeek);
      toaster.create({
        title: "주차가 추가되었습니다.",
        type: "success",
      });
      setWeekName("");
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error adding week:", error);
      toaster.create({
        title: "주차 추가 중 오류가 발생했습니다.",
        type: "error",
      });
    }
  }, [slug, weeks, createWeek, weekName]);

  const openModal = useCallback(() => {
    setWeekName(`Week ${weeks.length + 1}`);
    setIsModalOpen(true);
  }, [weeks]);

  if (weeksLoading) {
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
        <Heading level={3}>여행 일정</Heading>
      </div>

      <Suspense fallback={<Spinner />}>
        {weeksLoading ? (
          <Spinner />
        ) : weeks && weeks.length > 0 ? (
          <div className="weeks-list">
            {weeks
              .sort((a, b) => (a.week_number ?? 0) - (b.week_number ?? 0))
              .map((week, index) => (
                <MemoizedWeekCard
                  key={week.id}
                  week={week}
                  deleteWeek={deleteWeek}
                  index={index}
                  journeyId={slug}
                />
              ))}
          </div>
        ) : (
          <div className="empty-state">
            <Text color="var(--grey-500)">등록된 주차가 없습니다. 새 주차를 추가해보세요.</Text>
          </div>
        )}
      </Suspense>
      <TeacherOnly>
        <FloatingButton onClick={openModal}>
          <FaWandMagicSparkles />
          <Text variant="body" fontWeight="bold" color="var(--white)">
            새 주차
          </Text>
        </FloatingButton>
        
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
          <div style={{ width: '100%' }}>
            <Heading level={4}>새 주차 추가</Heading>
            <div style={{ marginBottom: '16px' }}></div>
            <Text style={{ marginBottom: '8px' }}>추가할 주차의 이름을 입력하세요</Text>
            <input
              value={weekName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWeekName(e.target.value)}
              placeholder="예: Week 1"
              style={{
                width: '100%', 
                padding: '8px 12px',
                border: '1px solid var(--grey-300)',
                borderRadius: '4px',
                marginBottom: '16px'
              }}
              autoFocus
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>취소</Button>
              <Button 
                variant="flat"
                onClick={handleAddWeek}
                disabled={!weekName.trim()}
              >
                추가
              </Button>
            </div>
          </div>
        </Modal>
      </TeacherOnly>
      <Footer />
    </PlanContainer>
  );
}

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
    color: var(--grey-500);
  }
`;
