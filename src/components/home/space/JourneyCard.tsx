"use client";

import styled from "@emotion/styled";
import Image from "next/image";
import { Journey } from "@/types";
import { HiDotsVertical } from "react-icons/hi";
import { useRouter } from "next/navigation";
import Text from "@/components/Text/Text";
import { useJourneyUser } from "@/hooks/useJourneyUser";
import { AdminOnly } from "@/components/auth/AdminOnly";
import { Menu, Portal } from "@chakra-ui/react";
import { useJourney } from "@/hooks/useJourney";
import { toaster } from "@/components/ui/toaster";
import { useAuth } from "@/components/AuthProvider";
import { useJourneyStore } from "@/store/journey";

export default function JourneyCard({ journey }: { journey: Journey }) {
  const defaultImage = "https://picsum.photos/200/200";
  const router = useRouter();
  const { role } = useAuth();
  const { adminNum, participantNum, teacherNum, isUserJoined } = useJourneyUser(
    journey.id
  );
  const { removeJourney } = useJourney();
  const { setCurrentJourneyUuid, getCurrentJourneyId } = useJourneyStore();

  const handleClick = async () => {
    if (isUserJoined || role === "admin") {
      try {
        console.log("JourneyCard: UUID 설정 시작", journey.uuid);
        // UUID 먼저 설정
        setCurrentJourneyUuid(journey.uuid);
        
        // ID가 설정될 때까지 기다림
        console.log("JourneyCard: ID 설정 대기 중");
        await new Promise(resolve => {
          // 최대 5번, 50ms 간격으로 시도
          let attempts = 0;
          const checkId = async () => {
            attempts++;
            // ID 가져오기 시도
            const id = await getCurrentJourneyId();
            console.log("JourneyCard: ID 확인 결과", id, `(시도 ${attempts}/5)`);
            
            if (id || attempts >= 5) {
              // ID가 설정되었거나 최대 시도 횟수에 도달하면 계속 진행
              resolve(true);
            } else {
              // 아직 설정되지 않았으면 재시도
              setTimeout(checkId, 50);
            }
          };
          checkId();
        });
        
        // 이제 라우팅
        console.log("JourneyCard: 라우팅 시작", journey.uuid);
        router.push(`/journey/${journey.uuid}`);
      } catch (error) {
        console.error("JourneyCard 클릭 처리 중 오류:", error);
        // 에러가 있어도 라우팅은 진행
        router.push(`/journey/${journey.uuid}`);
      }
    } else {
      toaster.create({
        title: "초대되지 않은 클라스 입니다. 담당 선생님에게 초대를 요구해주세요.",
        type: "warning",
        duration: 1400,
      });
    }
  };
  return (
    <Container onClick={handleClick}>
      <InnerContainer>
        <Image
          src={journey.image_url || defaultImage}
          alt="space"
          width={65}
          height={65}
          style={{ borderRadius: "10px" }}
        />
        <TextContainer>
          <Text variant="body" fontWeight="bold">
            {journey.name}
          </Text>
          <DateContainer>
            <Text variant="small" color="var(--grey-500)">
              관리자 {adminNum} • 학생 {participantNum} • 선생님 {teacherNum}
            </Text>
            <Text variant="small" color="var(--grey-500)">
              기간 : {journey.date_start} ~ {journey.date_end}
            </Text>
          </DateContainer>
        </TextContainer>
      </InnerContainer>
      <AdminOnly>
        <Menu.Root>
          <Menu.Trigger asChild onClick={(e) => e.stopPropagation()}>
            <div className="menu-trigger">
              <HiDotsVertical />
            </div>
          </Menu.Trigger>
          <Portal>
            <Menu.Positioner>
              <Menu.Content>
                <Menu.Item
                  style={{ cursor: "pointer" }}
                  value="edit"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/journey/${journey.uuid}/edit`);
                  }}
                >
                  수정
                </Menu.Item>
                <Menu.Item
                  style={{ cursor: "pointer" }}
                  value="delete"
                  color="fg.error"
                  _hover={{ bg: "bg.error", color: "fg.error" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm("삭제하시겠습니까?")) {
                      removeJourney(journey.id);
                    }
                  }}
                >
                  삭제
                </Menu.Item>
              </Menu.Content>
            </Menu.Positioner>
          </Portal>
        </Menu.Root>
      </AdminOnly>
    </Container>
  );
}

const Container = styled.div`
  width: 100%;
  padding: 14px;
  gap: 16px;
  justify-content: space-between;
  border: 1px solid var(--grey-500);
  background: var(--white);
  border-radius: 10px;
  align-items: center;
  display: flex;
  cursor: pointer;
  transition: background 0.3s ease;
  box-shadow: 0 0 10px 0 rgba(0, 0, 0, 0.1);

  &:hover {
    background: var(--gray-100);
  }

  .menu-trigger {
    cursor: pointer;
    padding: 6px;

    &:hover {
      background: var(--grey-200);
      border-radius: 50%;
    }
  }
`;

const InnerContainer = styled.div`
  justify-content: flex-start;
  align-items: center;
  gap: 8px;
  display: flex;
`;

const TextContainer = styled.div`
  flex-direction: column;
  justify-content: space-between;
  display: flex;
  gap: 4px;
`;

const DateContainer = styled.div`
  height: 100%;
  justify-content: space-between;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;
