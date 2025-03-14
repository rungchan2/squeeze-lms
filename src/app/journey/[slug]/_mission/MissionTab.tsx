"use client";

import { useEffect, useState } from "react";
import styled from "@emotion/styled";
import { FloatingButton } from "@/components/common/FloatingButton";
import { useJourneyMissionInstances } from "@/hooks/useJourneyMissionInstances";
import MissionCard from "@/app/journey/[slug]/_plan/MissionCard";
import Spinner from "@/components/common/Spinner";
import { JourneyMissionInstanceWithMission } from "@/types";
import { createClient } from "@/utils/supabase/client";
import { useRouter, usePathname } from "next/navigation";
import Text from "@/components/Text/Text";
import { AdminOnly } from "@/components/auth/AdminOnly";
import { FaWandMagicSparkles } from "react-icons/fa6";
import { useAuth } from "@/components/AuthProvider";
import Link from "next/link";
import { InputGroup } from "@/components/ui/input-group";
import { IoSearch } from "react-icons/io5";
import { Input } from "@chakra-ui/react";
import { FaSortAmountDownAlt, FaSortAmountUpAlt } from "react-icons/fa";
import { IconContainer } from "@/components/common/IconContainer";


export default function MissionTab() {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const { missionInstances, isLoading } = useJourneyMissionInstances();
  const [completedMissionIds, setCompletedMissionIds] = useState<number[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const { id: userId } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortMission, setSortMission] = useState<"asc" | "desc">("asc");
  // 현재 URL에서 slug 추출
  const getSlugFromPathname = () => {
    // pathname 형식: /journey/[slug]/mission
    const pathParts = pathname.split("/");
    // journey 다음 부분이 slug
    return pathParts.length > 2 ? pathParts[2] : "";
  };

  // 사용자가 제출한 미션 ID 목록 가져오기
  useEffect(() => {
    const fetchCompletedMissions = async () => {
      if (!userId) return;

      try {
        // posts 테이블에서 사용자가 제출한 mission_id 목록 가져오기
        const { data, error } = await supabase
          .from("posts")
          .select("mission_id")
          .eq("user_id", userId);

        if (error) {
          console.error("Error fetching completed missions:", error);
          return;
        }

        // 제출한 미션 ID 목록 추출
        const completedIds = data
          .filter((post) => post.mission_id !== null)
          .map((post) => post.mission_id as number);

        setCompletedMissionIds(completedIds);
      } catch (error) {
        console.error("Error in fetchCompletedMissions:", error);
      } finally {
        setIsLoadingPosts(false);
      }
    };

    fetchCompletedMissions();
  }, [userId, supabase]);

  // 미션 카드 클릭 핸들러
  const handleMissionClick = (missionInstanceId: number) => {
    const slug = getSlugFromPathname();
    router.push(`/journey/${slug}/${missionInstanceId}`);
  };

  // 로딩 중이면 스피너 표시
  if (isLoading || isLoadingPosts) {
    return <Spinner />;
  }

  // 완료하지 않은 미션만 필터링
  const pendingMissions = missionInstances.filter(
    (instance) => !completedMissionIds.includes(instance.mission_id)
  );

  // 검색어로 미션 필터링
  const filteredMissions = pendingMissions.filter(instance => {
    const missionName = instance.missions.name.toLowerCase();
    const missionDescription = instance.missions.description?.toLowerCase() || '';
    const query = searchQuery.toLowerCase();
    
    return missionName.includes(query) || missionDescription.includes(query);
  });

  // expiry_date 기준으로 미션 정렬
  const sortedMissions = [...filteredMissions].sort((a, b) => {
    // null 값 처리
    const dateA = a.expiry_date ? new Date(a.expiry_date).getTime() : Number.MAX_SAFE_INTEGER;
    const dateB = b.expiry_date ? new Date(b.expiry_date).getTime() : Number.MAX_SAFE_INTEGER;
    
    // 오름차순 또는 내림차순 정렬
    return sortMission === "asc" 
      ? dateA - dateB  // 오름차순: 빠른 날짜가 먼저
      : dateB - dateA; // 내림차순: 늦은 날짜가 먼저
  });

  const handleSortMission = () => {
    setSortMission(sortMission === "asc" ? "desc" : "asc");
  };

  return (
    <MissionTabContainer>
      <Text variant="body" fontWeight="bold" className="mission-title">
        내 미션 목록
      </Text>
      <div className="search-sort-container">
        <InputGroup flex={1} startElement={<IoSearch />} width="100%">
          <Input
            placeholder="미션 검색"
            width="100%"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </InputGroup>
        <div className="sort-container">
          <IconContainer onClick={handleSortMission}>
            {sortMission === "asc" ? (
              <FaSortAmountUpAlt />
            ) : (
              <FaSortAmountDownAlt />
            )}
          </IconContainer>
        </div>
      </div>
      
      {sortedMissions.length > 0 ? (
        sortedMissions.map(
          (missionInstance: JourneyMissionInstanceWithMission) => (
            <Link
              key={missionInstance.id}
              href={`/journey/${getSlugFromPathname()}/${missionInstance.id}`}
              className="mission-card-wrapper"
            >
              <MissionCard
                mission={missionInstance.missions}
                missionInstance={missionInstance}
              />
            </Link>
          )
        )
      ) : (
        <div className="empty-state">
          <Text color="var(--grey-500)">
            {searchQuery ? "검색 결과가 없습니다." : "완료하지 않은 미션이 없습니다."}
          </Text>
        </div>
      )}

      <AdminOnly>
        <FloatingButton onClick={() => {}}>
          <FaWandMagicSparkles />
          <Text variant="body" fontWeight="bold" color="var(--white)">
            새 주차
          </Text>
        </FloatingButton>
      </AdminOnly>
    </MissionTabContainer>
  );
}

const MissionTabContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;

  .mission-title {
    margin-bottom: 1rem;
  }
  
  .search-sort-container {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
  }
  
  .sort-container {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    white-space: nowrap;
  }

  .mission-card-wrapper {
    cursor: pointer;
    transition: transform 0.2s ease;

    &:hover {
      transform: translateY(-2px);
    }
  }

  .empty-state {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 2rem;
    background-color: var(--grey-50);
    border-radius: 8px;
    border: 1px dashed var(--grey-300);
  }
`;
