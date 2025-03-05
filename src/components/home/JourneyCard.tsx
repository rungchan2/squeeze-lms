"use client";

import styled from "@emotion/styled";
import Image from "next/image";
import { Journey } from "@/types/journeys";
import { HiDotsVertical } from "react-icons/hi";
import { useRouter } from "next/navigation";
import Text from "@/components/Text/Text";
import { useJourneyUser } from "@/hooks/useJourneyUser";
import { AdminOnly } from "@/components/common/auth/AdminOnly";

export default function JourneyCard({ journey }: { journey: Journey }) {
  const defaultImage = "https://picsum.photos/200/200";
  const router = useRouter();
  const { adminNum, participantNum, teacherNum } = useJourneyUser(journey.id);
  return (
    <Container onClick={() => router.push(`/journey/${journey.id}`)}>
      <InnerContainer>
        <Image
          src={journey.image_url || defaultImage}
          alt="space"
          width={65}
          height={65}
          style={{ borderRadius: "10px" }}
        />
        <TextContainer>
          <Text variant="caption" style={{ fontWeight: "bold" }}>
            {journey.name}
          </Text>
          <DateContainer>
            <Text variant="small" color="var(--grey-400)">
              Admin {adminNum} • Participant {participantNum} • Teacher {teacherNum}
            </Text>
            <Text variant="small" color="var(--grey-400)">
              {journey.date_start} ~ {journey.date_end}
            </Text>
          </DateContainer>
        </TextContainer>
      </InnerContainer>
      <AdminOnly>
        <HiDotsVertical />
      </AdminOnly>
    </Container>
  );
}

const Container = styled.div`
  width: 100%;
  padding: 8px 14px;
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
`;

const InnerContainer = styled.div`
  justify-content: flex-start;
  align-items: center;
  gap: 8px;
  display: flex;
`;

const TextContainer = styled.div`
  flex-direction: column;
  display: flex;
  gap: 4px;
`;

const DateContainer = styled.div`
  align-items: flex-start;
  display: flex;
  flex-direction: column;
`;
