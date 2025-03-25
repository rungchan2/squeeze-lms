"use client";
import { Suspense, useEffect, useState, useCallback, memo } from "react";
import Text from "@/components/Text/Text";
import Heading from "@/components/Text/Heading";
import { useRouter } from "next/navigation";
import { getJourney } from "../../clientActions";
import Spinner from "@/components/common/Spinner";
import { useWeeks } from "@/hooks/useWeeks";
import styled from "@emotion/styled";
import WeekCard from "./WeekCard";
import { AdminOnly } from "@/components/auth/AdminOnly";
import { FloatingButton } from "@/components/common/FloatingButton";
import { FaWandMagicSparkles } from "react-icons/fa6";
import { useSearchParams } from "next/navigation";
import { toaster } from "@/components/ui/toaster";
import { useJourneyStore } from "@/store/journey";
import Footer from "@/components/common/Footer";
import Button from "@/components/common/Button";
import { Modal } from "@/components/modal/Modal";

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

export default function PlanTab({ slug }: { slug: string }) {
  const searchParams = useSearchParams();
  const status = searchParams.get("status");
  const router = useRouter();
  const [journeyId, setJourneyId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [weekName, setWeekName] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // 안전하게 객체 가져오기 및 기본값 제공
  const journeyStore = useJourneyStore();
  const setCurrentJourneyUuid = journeyStore?.setCurrentJourneyUuid || (() => {});
  const currentJourneyUuid = journeyStore?.currentJourneyUuid || '';
  const getCurrentJourneyId = journeyStore?.getCurrentJourneyId || (() => Promise.resolve(null));
  
  useEffect(() => {
    if (status === "success") {
      toaster.create({
        title: "환영합니다! 클라스에 참여하셨습니다.",
        type: "success",
      });
      setCurrentJourneyUuid(slug);
      router.push(`/journey/${slug}`);
    }
  }, [status, router, slug, setCurrentJourneyUuid]);

  // 여행 ID 가져오기
  useEffect(() => {
    const fetchJourneyId = async () => {
      if (!slug) {
        setIsLoading(false);
        return;
      }
      
      try {
        const result = await getJourney(slug);
        const { data, error } = result || { data: null, error: null };
        
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

  // Journey UUID 설정을 위한 별도 useEffect
  useEffect(() => {
    if (!slug || !setCurrentJourneyUuid) return;
    
    // 이미 같은 UUID가 설정되어 있는지 확인
    if (currentJourneyUuid === slug) return;
    
    try {
      setCurrentJourneyUuid(slug);
    } catch (error) {
      console.error("Error setting current journey UUID:", error);
    }
  }, [slug, currentJourneyUuid, setCurrentJourneyUuid]);

  // useWeeks 훅 사용 - 안전한 값 제공
  const {
    weeks = [],
    isLoading: weeksLoading = false,
    error: weeksError = null,
    createWeek,
    updateWeek,
    deleteWeek,
  } = useWeeks(journeyId || 0) || {};

  // 새 주차 추가 핸들러 예시
  const handleAddWeek = useCallback(async () => {
    if (!journeyId || !createWeek || !weekName) return;
    
    try {
      await createWeek({
        journey_id: journeyId,
        name: weekName || `Week ${weeks.length + 1}`,
        week_number: weeks.length + 1,
      });
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
  }, [journeyId, weeks, createWeek, weekName]);

  const openModal = useCallback(() => {
    setWeekName(`Week ${weeks.length + 1}`);
    setIsModalOpen(true);
  }, [weeks]);

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
                  updateWeek={updateWeek || (() => {})}
                  deleteWeek={deleteWeek || (() => {})}
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
      </AdminOnly>
      <Footer />
    </PlanContainer>
  );
}
