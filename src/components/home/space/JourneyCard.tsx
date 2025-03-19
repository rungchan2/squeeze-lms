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

export default function JourneyCard({ journey }: { journey: Journey }) {
  const defaultImage = "https://picsum.photos/200/200";
  const router = useRouter();
  const { role } = useAuth();
  const { adminNum, participantNum, teacherNum, isUserJoined } = useJourneyUser(
    journey.id
  );
  const { removeJourney } = useJourney();

  const handleClick = () => {
    if (isUserJoined) {
      router.push(`/journey/${journey.uuid}`);
    } else if (role === "admin") {
      router.push(`/journey/${journey.uuid}`);
    } else {
      toaster.create({
        title: "초대되지 않은 클라스 입니다. 담당 선생님에게 초대를 요구해주세요.",
        type: "warning",
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
