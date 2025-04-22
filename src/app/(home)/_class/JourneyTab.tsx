import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useRouter } from "next/navigation";
import { useJourney } from "@/hooks/useJourney";
import { useJourneyUser } from "@/hooks/useJourneyUser";
import { useMemo } from "react";
import NoJourney from "./NoJourney";
import Text from "@/components/Text/Text";
import { Spinner } from "@chakra-ui/react";
import { AdminOnly } from "@/components/auth/AdminOnly";
import JourneyCard from "./JourneyCard";
import { FloatingButton } from "@/components/common/FloatingButton";
import styled from "@emotion/styled";
import Footer from "@/components/common/Footer";
import { FaPlus } from "react-icons/fa";

export default function JourneyTab() {
  const router = useRouter();
  const { role } = useSupabaseAuth();
  const isAdmin = role === "admin";

  // 모든 여정 데이터 가져오기
  const { journeys, error, isLoading } = useJourney();

  // 현재 사용자가 참여 중인 여정 목록 가져오기
  const {
    data: userJourneys,
    isLoading: userJourneysLoading,
    error: userJourneysError,
  } = useJourneyUser(""); // 0을 전달하면 특정 여정이 아닌 사용자의 모든 여정 참여 정보를 가져올 수 있음
  // 사용자가 참여 중인 여정 ID 목록 생성
  const userJourneyIds = useMemo(() => {
    if (!userJourneys) return [];
    // 새로운 데이터 구조에 맞게 수정 (journeys 필드에서 id 추출)
    return userJourneys
      .map((journey) => journey.journeys?.id || journey.journey_id)
      .filter((id) => id !== null) as string[];
  }, [userJourneys]);

  // 권한에 따라 표시할 여정 목록 필터링
  const filteredJourneys = useMemo(() => {
    if (isAdmin) {
      // 관리자는 모든 여정 볼 수 있음
      return journeys || [];
    } else {
      // 일반 사용자는 참여 중인 여정만 볼 수 있음
      return (journeys || []).filter((journey) =>
        userJourneyIds.includes(journey.id)
      );
    }
  }, [isAdmin, journeys, userJourneyIds]);

  // 에러 처리
  if (error) {
    return (
      <div>
        <Text variant="body" color="red">
          Error: {error.message}
        </Text>
      </div>
    );
  }

  if (userJourneysError && !isAdmin) {
    return (
      <div>
        <Text variant="body" color="red">
          사용자 여정 정보를 불러오는 중 오류가 발생했습니다.
        </Text>
      </div>
    );
  }

  // 로딩 중 표시
  const isPageLoading = isLoading || (!isAdmin && userJourneysLoading);

  return (
    <JourneysContainer>
      {isPageLoading ? (
        <div>
          <Spinner size="md" />
        </div>
      ) : filteredJourneys.length > 0 ? (
        filteredJourneys.map((journey) => (
          <JourneyCard journey={journey} key={journey.id} />
        ))
      ) : (
        <NoJourney />
      )}

      <AdminOnly>
        <FloatingButton onClick={() => router.push("/create-journey")}>
          <FaPlus />
          <Text variant="body" fontWeight="bold" color="var(--white)">
            새 조직
          </Text>
        </FloatingButton>
      </AdminOnly>
      <Footer />
    </JourneysContainer>
  );
}

const JourneysContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
`;
