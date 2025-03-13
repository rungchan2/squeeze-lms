"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useMission } from "@/hooks/useMission";
import { Mission } from "@/types/missions";
import Text from "@/components/Text/Text";
import Heading from "@/components/Text/Heading";
import Spinner from "@/components/common/Spinner";
import styled from "@emotion/styled";
import { Modal } from "@/components/modal/Modal";
import { Input } from "@chakra-ui/react";
import MissionCard from "./MissionCard";
import { FaPlus, FaCheck } from "react-icons/fa6";
import { AdminOnly } from "@/components/auth/AdminOnly";
import { InputGroup } from "@/components/ui/input-group";
import { IoSearch } from "react-icons/io5";
import ChipGroup from "@/components/common/ChipGroup";
import { useWeeks } from "@/hooks/useWeeks";
import { useJourneyMissionInstances } from "@/hooks/useJourneyMissionInstances";
import { getMissionTypes } from "@/app/journey/actions";
import { RiDeleteBin6Line } from "react-icons/ri";
import { IconContainer } from "@/components/common/IconContainer";

interface MissionComponentProps {
  weekId: number;
  weekName: string;
  journeyId: number;
  deleteWeek: (weekId: number) => void;
}

export type MissionOption = string;

// 서버 컴포넌트에서 데이터 가져오기
const { data: missionTypesData } = await getMissionTypes();
// mission_type 값만 추출
const missionTypeValues = missionTypesData ? missionTypesData.map((item: { mission_type: string }) => item.mission_type).filter(Boolean) : [];
const missionOptions: MissionOption[] = ["전체", ...missionTypeValues];

export default function MissionComponent({
  weekId,
  weekName,
  journeyId,
  deleteWeek,
}: MissionComponentProps) {
  const [showSearch, setShowSearch] = useState(false);
  const [selectedOption, setSelectedOption] = useState<MissionOption>(
    missionOptions[0]
  );
  const [weekMissions, setWeekMissions] = useState<Mission[]>([]);
  const [isLoadingMissions, setIsLoadingMissions] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // useWeeks 훅 사용
  const {
    isLoading: isLoadingWeeks,
    error: weeksError,
    addMissionToWeek,
    removeMissionFromWeek,
    getWeekMissions,
  } = useWeeks(journeyId);

  // useJourneyMissionInstances 훅 사용
  const {
    missionInstances,
    isLoading: isLoadingInstances,
    error: instancesError,
  } = useJourneyMissionInstances(weekId);

  // useMission 훅 사용 (전체 미션 목록 가져오기)
  const {
    missions: allMissions,
    isLoading: isLoadingAllMissions,
    error: allMissionsError,
  } = useMission();

  // 검색 결과 필터링
  const searchResults = useMemo(() => {
    if (!allMissions) return [];

    // 필터링할 미션 목록
    let filteredMissions = allMissions;

    // 선택된 옵션이 '전체'가 아닌 경우 미션 타입으로 필터링
    if (selectedOption !== "전체") {
      filteredMissions = allMissions.filter(
        (mission) => mission.mission_type === selectedOption
      );
    }

    if (!searchQuery.trim()) {
      return filteredMissions;
    }

    return filteredMissions.filter(
      (mission) =>
        mission.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (mission.description &&
          mission.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [searchQuery, allMissions, selectedOption]);

  // 주차의 미션 목록 가져오기
  useEffect(() => {
    if (!weekId || isLoadingInstances) return;

    const fetchMissions = async () => {
      setIsLoadingMissions(true);
      try {
        const missions = await getWeekMissions(weekId);
        setWeekMissions(missions);
      } catch (error) {
        console.error("Error fetching week missions:", error);
        setWeekMissions([]);
      } finally {
        setIsLoadingMissions(false);
      }
    };

    fetchMissions();
  }, [weekId, isLoadingInstances, getWeekMissions, missionInstances]);

  // 미션 추가 핸들러
  const handleAddMission = async (missionId: number) => {
    try {
      // 이미 추가된 미션인지 확인
      const isAlreadyAdded = weekMissions.some((m) => m.id === missionId);

      if (isAlreadyAdded) {
        // 이미 추가된 미션이면 제거
        await removeMissionFromWeek(weekId, missionId);

        // UI에서 미션 제거
        setWeekMissions((prev) => prev.filter((m) => m.id !== missionId));
      } else {
        // 새 미션 추가
        await addMissionToWeek(weekId, missionId);

        // 미션 데이터 가져오기
        const addedMission = allMissions?.find((m) => m.id === missionId);
        if (addedMission) {
          setWeekMissions((prev) => [...prev, addedMission]);
        }
      }
    } catch (error) {
      console.error("Error managing mission:", error);
    }
  };

  // 미션 제거 핸들러
  const handleRemoveMission = async (missionId: number) => {
    if (window.confirm("정말로 이 미션을 제거하시겠습니까?")) {
      try {
        await removeMissionFromWeek(weekId, missionId);

        // UI에서 미션 제거
        setWeekMissions((prev) => prev.filter((m) => m.id !== missionId));
      } catch (error) {
        console.error("Error removing mission:", error);
      }
    }
  };

  // 미션 수정 핸들러
  const handleEditMission = (id: number) => {
    // 여기에 수정 로직 추가
    alert(`미션 수정: ${id}`);
  };

  if (isLoadingWeeks || isLoadingMissions) {
    return <Spinner />;
  }

  if (weeksError) {
    return <Text>주차 데이터를 불러오는 중 오류가 발생했습니다.</Text>;
  }

  return (
    <MissionContainer>
      <div className="mission-header">
        <Heading level={3}>{weekName} 미션</Heading>
        <AdminOnly>
          <IconContainer onClick={() => deleteWeek(weekId)} hoverColor="var(--negative-500)">
            <RiDeleteBin6Line size="16px" />
          </IconContainer>
        </AdminOnly>
      </div>

      <Modal isOpen={showSearch} onClose={() => setShowSearch(false)}>
        <ShowSearchContainer>
          <InputGroup flex={1} startElement={<IoSearch />} width="100%">
            <Input
              placeholder="미션 검색"
              width="100%"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </InputGroup>
          <div className="mission-type-filter">
          <ChipGroup
            options={missionOptions}
            selectedOption={selectedOption}
            onSelect={(option) => setSelectedOption(option as MissionOption)}
          />
          </div>
          <Heading level={4}>검색 결과</Heading>

          <div className="search-results">
            {isLoadingAllMissions ? (
              <Spinner />
            ) : allMissionsError ? (
              <Text>미션 데이터를 불러오는 중 오류가 발생했습니다.</Text>
            ) : searchResults && searchResults.length > 0 ? (
              <ModalListContainer>
                {searchResults.map((mission) => (
                  <div key={mission.id} className="single-item">
                    <MissionCard
                      mission={mission}
                      onEdit={handleEditMission}
                      onDelete={() => handleRemoveMission(mission.id)}
                      isModal={true}
                    />
                    <button
                      className={`single-item-button ${
                        weekMissions.some((m) => m.id === mission.id)
                          ? "added"
                          : ""
                      }`}
                      onClick={() => handleAddMission(mission.id)}
                    >
                      {weekMissions.some((m) => m.id === mission.id) ? (
                        <FaCheck />
                      ) : (
                        <FaPlus />
                      )}
                    </button>
                  </div>
                ))}
              </ModalListContainer>
            ) : (
              <Text>검색 결과가 없습니다.</Text>
            )}
          </div>
        </ShowSearchContainer>
      </Modal>

      {weekMissions.length > 0 ? (
        <div className="mission-list">
          {weekMissions.map((mission) => (
            <MissionCard
              key={mission.id}
              mission={mission}
              onEdit={handleEditMission}
              onDelete={() => handleRemoveMission(mission.id)}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <Text color="var(--grey-500)">등록된 미션이 없습니다.</Text>
        </div>
      )}

      <AdminOnly>
        <button
          className="add-mission-button"
          onClick={() => setShowSearch(true)}
        >
          <FaPlus />
          <span>미션 추가</span>
        </button>
      </AdminOnly>
    </MissionContainer>
  );
}

const ModalListContainer = styled.div`
  .single-item {
    display: flex;
    flex-direction: row;
    align-items: stretch;
    gap: 10px;
    margin-bottom: 10px;

    & > .single-item-button {
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 50px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
      background-color: var(--grey-200);

      &:hover {
        background-color: var(--grey-300);
      }

      &.added {
        background-color: var(--primary-500);
        color: white;
      }

      &:disabled {
        cursor: not-allowed;
        opacity: 0.7;
      }
    }
  }
`;
const MissionContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 0.5rem;

  .mission-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .mission-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .empty-state {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 2rem;
    background-color: var(--grey-50);
    border-radius: 0.5rem;
  }

  .mission-actions {
    display: flex;
  }

  .add-mission-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    color: var(--grey-700);
    border: 1px solid var(--grey-200);
    border-radius: 6px;
    cursor: pointer;
    transition: 0.2s;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    transition: box-shadow 0.2s;
    &:hover {
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
  }
`;

const ShowSearchContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  max-width: 600px;

  .mission-type-filter {
    display: flex;
    overflow-x: auto;
  }

  .search-results {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    max-height: 400px;
    overflow-y: auto;
  }
`;
