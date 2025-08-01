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
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";

export default function JourneyCard({ journey }: { journey: Journey }) {
  const defaultImage = "https://picsum.photos/200/200";
  const router = useRouter();
  const { role } = useSupabaseAuth();
  const { adminNum, participantNum, teacherNum, isUserJoined } = useJourneyUser(
    journey.id
  );
  const { removeJourney } = useJourney();

  const handleClick = async () => {
    if (isUserJoined || role === "admin") {
      try {
        router.push(`/journey/${journey.id}`);
      } catch (error) {
        console.error("JourneyCard 클릭 처리 중 오류:", error);
        router.push(`/journey/${journey.id}`);
      }
    } else {
      toaster.create({
        title:
          "초대되지 않은 클라스 입니다. 담당 선생님에게 초대를 요구해주세요.",
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
          style={{ 
            borderRadius: "10px", 
            objectFit: "cover",
            width: "65px",
            height: "65px"
          }}
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
                    router.push(`/journey/${journey.id}/edit`);
                  }}
                >
                  수정
                </Menu.Item>
                <AdminOnly>
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
                </AdminOnly>
              </Menu.Content>
            </Menu.Positioner>
          </Portal>
        </Menu.Root>
    </Container>
  );
}

const Container = styled.div`
  width: 100%;
  min-height: 120px;
  padding: 16px;
  gap: 16px;
  justify-content: space-between;
  border: 1px solid var(--grey-300);
  background: var(--white);
  border-radius: 12px;
  align-items: center;
  display: flex;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

  &:hover {
    background: var(--grey-50);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
    border-color: var(--grey-400);
    transform: translateY(-2px);
  }

  .menu-trigger {
    cursor: pointer;
    padding: 8px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--grey-500);
    transition: all 0.2s ease;

    &:hover {
      background: var(--grey-200);
      color: var(--grey-700);
    }
  }
`;

const InnerContainer = styled.div`
  justify-content: flex-start;
  align-items: center;
  gap: 12px;
  display: flex;
  flex: 1;
  min-width: 0; /* 텍스트 overflow를 위해 필요 */
`;

const TextContainer = styled.div`
  flex-direction: column;
  justify-content: space-between;
  display: flex;
  gap: 6px;
  flex: 1;
  min-width: 0; /* 텍스트 overflow를 위해 필요 */
`;

const DateContainer = styled.div`
  justify-content: flex-start;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;
