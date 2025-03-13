"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useMission } from "@/hooks/useMission";
import { CreateMission, Mission } from "@/types/missions";
import Text from "@/components/Text/Text";
import Heading from "@/components/Text/Heading";
import Spinner from "@/components/common/Spinner";
import styled from "@emotion/styled";
import { Modal } from "@/components/modal/Modal";
import { Input, Textarea } from "@chakra-ui/react";
import Button from "@/components/common/Button";
import MissionCard from "./MissionCard";
import { FaPlus, FaCheck } from "react-icons/fa6";
import { AdminOnly } from "@/components/auth/AdminOnly";
import { InputGroup } from "@/components/ui/input-group";
import { IoSearch } from "react-icons/io5";
import ChipGroup from "@/components/common/ChipGroup";
import { useWeeks } from "@/hooks/useWeeks";

interface MissionComponentProps {
  weekId: number;
  weekName: string;
  journeyId: number;
}

export type MissionOption = "추천미션" | "사진미션" | "쓰기미션";
const missionOptions: MissionOption[] = ["추천미션", "사진미션", "쓰기미션"];

export default function MissionComponent({
  weekId,
  weekName,
  journeyId,
}: MissionComponentProps) {
  const [showSearch, setShowSearch] = useState(false);
  const [selectedOption, setSelectedOption] = useState<MissionOption>(
    missionOptions[0]
  );
  const [weekMissions, setWeekMissions] = useState<Mission[]>([]);
  const [isLoadingMissions, setIsLoadingMissions] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // 이전 weekId를 저장하기 위한 ref
  const prevWeekIdRef = useRef<number>(weekId);

  // useWeeks 훅 사용
  const {
    weeks,
    isLoading: isLoadingWeeks,
    error: weeksError,
    addMissionToWeek,
    removeMissionFromWeek,
    getWeekMissions,
  } = useWeeks(journeyId);

  // useMission 훅 사용 (전체 미션 목록 가져오기)
  const {
    missions: allMissions,
    isLoading: isLoadingAllMissions,
    error: allMissionsError,
  } = useMission();

  // 검색 결과 필터링
  const searchResults = useMemo(() => {
    if (!allMissions) return [];
    
    if (!searchQuery.trim()) {
      return allMissions;
    }

    return allMissions.filter(mission => 
      mission.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (mission.description && mission.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [searchQuery, allMissions]);

  // 주차의 미션 목록 가져오기
  useEffect(() => {
    // 주차 ID가 변경되었거나 weeks 데이터가 로드된 경우에만 실행
    const shouldFetchMissions =
      weekId &&
      !isLoadingWeeks &&
      weeks &&
      (prevWeekIdRef.current !== weekId || !isLoadingMissions);

    if (!shouldFetchMissions) return;

    // 현재 weekId를 ref에 저장
    prevWeekIdRef.current = weekId;

    // 미션 데이터 가져오기
    const fetchMissions = async () => {
      setIsLoadingMissions(true);
      try {
        // 현재 주차 찾기
        const currentWeek = weeks.find((w) => w.id === weekId);
        if (!currentWeek) {
          console.error("주차를 찾을 수 없습니다:", weekId);
          setWeekMissions([]);
          return;
        }

        // 미션 ID 배열 가져오기
        const missionIds = currentWeek.missions || [];
        if (missionIds.length === 0) {
          setWeekMissions([]);
          return;
        }

        // 미션 데이터 가져오기
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
  }, [weekId, weeks, isLoadingWeeks, getWeekMissions]);

  // 미션 추가 핸들러
  const handleAddMission = async (missionId: number) => {
    try {
      const result = await addMissionToWeek(weekId, missionId);
      if (!result) return;

      // 이미 추가된 미션인 경우 중복 추가 방지
      if (weekMissions.some((m) => m.id === missionId)) {
        return;
      }

      // 미션 데이터 가져오기
      const addedMission = allMissions?.find((m) => m.id === missionId);
      if (addedMission) {
        setWeekMissions((prev) => [...prev, addedMission]);
      }

      setShowSearch(false);
    } catch (error) {
      console.error("Error adding mission:", error);
    }
  };

  // 미션 제거 핸들러
  const handleRemoveMission = async (missionId: number) => {
    if (window.confirm("정말로 이 미션을 제거하시겠습니까?")) {
      try {
        const result = await removeMissionFromWeek(weekId, missionId);
        if (!result) return;

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
          <ChipGroup
            options={missionOptions}
            selectedOption={selectedOption}
            onSelect={(option) => setSelectedOption(option as MissionOption)}
          />

          <div className="search-results">
            <Heading level={4}>검색 결과</Heading>
            {isLoadingAllMissions ? (
              <Spinner />
            ) : allMissionsError ? (
              <Text>미션 데이터를 불러오는 중 오류가 발생했습니다.</Text>
            ) : searchResults && searchResults.length > 0 ? (
              <div className="mission-list">
                {searchResults.map((mission) => (
                  <div key={mission.id} className="search-mission-item">
                    <MissionCard
                      mission={mission}
                      onEdit={handleEditMission}
                      onDelete={() => handleRemoveMission(mission.id)}
                      isModal={true}
                    />
                    <button
                      className={`add-button ${weekMissions.some((m) => m.id === mission.id) ? 'added' : ''}`}
                      onClick={() => handleAddMission(mission.id)}
                      disabled={weekMissions.some((m) => m.id === mission.id)}
                    >
                      {weekMissions.some((m) => m.id === mission.id) ? (
                        <FaCheck className="check-icon" />
                      ) : (
                        <FaPlus className="plus-icon" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
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
          <Text>등록된 미션이 없습니다.</Text>
        </div>
      )}
      <AdminOnly>
        <div
          className="add-mission-button"
          onClick={() => setShowSearch(!showSearch)}
        >
          <FaPlus />
          미션 추가
        </div>
      </AdminOnly>
    </MissionContainer>
  );
}

const MissionContainer = styled.div`
  margin-top: 1rem;

  .mission-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .mission-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .empty-state {
    text-align: center;
    padding: 2rem;
    background-color: var(--gray-50);
    border-radius: 0.25rem;
  }

  .add-mission-button {
    margin-top: 6px;
    text-align: center;
    padding: 16px;
    border: 1px solid var(--grey-200);
    background-color: var(--white);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    transition: box-shadow 0.2s;
    justify-content: center;
    display: flex;
    align-items: center;
    gap: 8px;
    &:hover {
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
  }
`;

const ShowSearchContainer = styled.div`
  padding-top: 8px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 16px;
  width: 100%;
  max-height: 100%;

  .search-results {
    width: 100%;
    margin-top: 16px;
    overflow-y: auto;
    max-height: 60vh;
    
    /* 스크롤바 숨기기 */
    scrollbar-width: none; /* Firefox */
    -ms-overflow-style: none; /* IE and Edge */
    
    /* Chrome, Safari, Opera에서 스크롤바 숨기기 */
    &::-webkit-scrollbar {
      display: none;
    }
  }

  .mission-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 100%;
    padding-bottom: 16px;
  }

  .search-mission-item {
    display: flex;
    position: relative;
    border-radius: 4px;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    transition: transform 0.2s ease, box-shadow 0.2s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .add-button {
      height: auto;
      min-height: 100%;
      width: 50px;
      background-color: var(--grey-400);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      border: none;
      border-radius: 0;
      transition: all 0.2s ease;
      
      &:hover:not(:disabled) {
        background-color: var(--grey-500);
      }
      
      &.added {
        background-color: var(--positive-600);
        
        &:hover {
          background-color: var(--positive-600);
        }
      }
      
      .check-icon {
        color: white;
        font-size: 18px;
      }
      
      .plus-icon {
        color: white;
        font-size: 18px;
      }
      
      &:disabled {
        cursor: not-allowed;
        opacity: 0.7;
      }
    }

    .mission-info {
      flex: 1;
    }
  }
`;
