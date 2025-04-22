"use client";

import { useEffect, useState, useMemo } from "react";
import { useMission } from "@/hooks/useMission";
import { Mission, MissionStatus } from "@/types";
import Text from "@/components/Text/Text";
import Heading from "@/components/Text/Heading";
import Spinner from "@/components/common/Spinner";
import styled from "@emotion/styled";
import { Modal } from "@/components/modal/Modal";
import { Input } from "@chakra-ui/react";
import MissionCard from "./MissionCard";
import { FaPlus, FaCheck } from "react-icons/fa6";
import { TeacherOnly } from "@/components/auth/AdminOnly";
import { InputGroup } from "@/components/ui/input-group";
import { IoSearch } from "react-icons/io5";
import ChipGroup from "@/components/common/ChipGroup";
import { useWeeks } from "@/hooks/useWeeks";
import { useJourneyMissionInstances } from "@/hooks/useJourneyMissionInstances";
import { getMissionTypes } from "@/utils/data/mission";
import { RiDeleteBin6Line } from "react-icons/ri";
import { IconContainer } from "@/components/common/IconContainer";
import { JourneyMissionInstanceWithMission } from "@/types";
import { toaster } from "@/components/ui/toaster";
import { CreateJourneyMissionInstance } from "@/types";
interface MissionComponentProps {
  weekId: string;
  weekName: string;
  journeyId: string;
  deleteWeek: (weekId: string) => void;
  onTotalMissionCountChange: (count: number) => void;
}

export type MissionOption = string;

// 서버 컴포넌트에서 데이터 가져오기
const { data: missionTypesData } = await getMissionTypes();
// mission_type 값만 추출
const missionTypeValues = missionTypesData
  ? missionTypesData
      .map((item: { mission_type: string }) => item.mission_type)
      .filter(Boolean)
  : [];
const missionOptions: MissionOption[] = ["전체", ...missionTypeValues];

export default function MissionComponent({
  weekId,
  weekName,
  journeyId,
  deleteWeek,
  onTotalMissionCountChange,
}: MissionComponentProps) {
  const [showSearch, setShowSearch] = useState(false);
  const [selectedOption, setSelectedOption] = useState<MissionOption>(
    missionOptions[0]
  );
  const [weekMissions, setWeekMissions] = useState<Mission[]>([]);
  const [isLoadingMissions, setIsLoadingMissions] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // 날짜 입력 모달 상태
  const [showDateModal, setShowDateModal] = useState(false);
  const [selectedMissionId, setSelectedMissionId] = useState<string | null>(
    null
  );
  const [releaseDate, setReleaseDate] = useState<string>("");
  const [expiryDate, setExpiryDate] = useState<string>("");

  //useWeeks 훅 사용
  const {
    isLoading: isLoadingWeeks,
    error: weeksError,
    getWeekMissions,
  } = useWeeks(journeyId);

  // useJourneyMissionInstances 훅 사용
  const {
    missionInstances,
    isLoading: isLoadingInstances,
    createMissionInstance,
    deleteMissionInstance,
    mutate: mutateMissionInstances,
  } = useJourneyMissionInstances(journeyId, weekId);

  // useMission 훅 사용 (전체 미션 목록 가져오기)
  const {
    missions: allMissions,
    isLoading: isLoadingAllMissions,
    error: allMissionsError,
  } = useMission();

  //검색 결과 필터링
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
  }, [weekId, getWeekMissions, missionInstances, isLoadingInstances]);

  // missionInstances가 변경될 때마다 부모 컴포넌트에 알림
  useEffect(() => {
    if (onTotalMissionCountChange && !isLoadingInstances) {
      onTotalMissionCountChange(missionInstances.length);
    }
  }, [missionInstances, isLoadingInstances, onTotalMissionCountChange]);

  //미션 추가 핸들러
  const handleAddMission = async (missionId: string) => {
    // 이미 추가된 미션인지 확인
    const isAlreadyAdded = missionInstances.some(
      (m) => m.mission_id === missionId
    );

    if (isAlreadyAdded) {
      // 이미 추가된 미션이면 제거
      const instanceToRemove = missionInstances.find(
        (m) => m.mission_id === missionId
      );
      if (instanceToRemove) {
        try {
          setIsLoadingMissions(true);
          await deleteMissionInstance(instanceToRemove.id);
          // UI 즉시 업데이트
          await mutateMissionInstances();
          // 카운트 업데이트는 useEffect에서 처리됨
        } catch (error) {
          console.error("Error removing mission:", error);
        } finally {
          setIsLoadingMissions(false);
        }
      }
    } else {
      // 새 미션 추가를 위해 날짜 입력 모달 표시
      setSelectedMissionId(missionId);
      setReleaseDate("");
      setExpiryDate("");
      setShowDateModal(true);
      // 카운트 업데이트는 useEffect에서 처리됨
    }

    // 검색 모달은 닫지 않음 (날짜 입력 모달이 표시됨)
  };

  //날짜 입력 후 미션 추가 확인
  const handleConfirmAddMission = async () => {
    if (!selectedMissionId) return;

    try {
      setIsLoadingMissions(true);

      // 미션 인스턴스 생성
      const newInstance: CreateJourneyMissionInstance = {
        journey_week_id: weekId,
        mission_id: selectedMissionId,
        status: "not_started" as MissionStatus,
        release_date: releaseDate || null,
        expiry_date: expiryDate || null,
        journey_id: journeyId,
      };

      await createMissionInstance(newInstance as any);

      // UI 즉시 업데이트
      await mutateMissionInstances();
      // 카운트 업데이트는 useEffect에서 처리됨

      // 모달 닫기
      setShowDateModal(false);
      setShowSearch(false);
    } catch (error) {
      console.error("Error adding mission:", error);
    } finally {
      setIsLoadingMissions(false);
    }
  };

  // 미션 수정 핸들러
  const handleEditMission = (id: string) => {
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
        <TeacherOnly>
          <IconContainer
            onClick={() => {
              deleteWeek(weekId);
              toaster.create({
                title: "주차가 삭제되었습니다.",
                type: "warning",
              });
            }}
            hoverColor="var(--negative-500)"
          >
            <RiDeleteBin6Line size="16px" />
          </IconContainer>
        </TeacherOnly>
      </div>

      {missionInstances.length > 0 ? (
        <div className="mission-list">
          {missionInstances.map((instance) => (
            <MissionCard
              key={instance.id}
              mission={instance.mission}
              onEdit={handleEditMission}
              onDelete={async () => {
                try {
                  setIsLoadingMissions(true);
                  await deleteMissionInstance(instance.id);
                  // UI 즉시 업데이트
                  await mutateMissionInstances();
                  toaster.create({
                    title: "미션이 삭제되었습니다.",
                    type: "warning",
                  });
                } catch (error : any) {
                  console.log("에러", error.toString().split(":")[1].trim());
                  if ( error.toString().split(":")[1].trim() === "23503") {
                    toaster.create({
                      title: "이미 완료한 미션 에서 참조 하고 있습니다.",
                      description: "관련된 미션 및 포인트를 삭제후 다시 시도해주세요.",
                      type: "error",
                    });
                  } else {
                    toaster.create({
                      title: "미션 삭제 중 오류가 발생했습니다." + error,
                      type: "error",
                    });
                  }
                } finally {
                  setIsLoadingMissions(false);
                }
              }}
              missionInstance={
                instance as unknown as JourneyMissionInstanceWithMission
              }
            />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <Text color="var(--grey-500)">등록된 미션이 없습니다.</Text>
        </div>
      )}

      <TeacherOnly>
        <button
          className="add-mission-button"
          onClick={() => setShowSearch(true)}
        >
          <FaPlus />
          <span>미션 추가</span>
        </button>
      </TeacherOnly>

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
                      style={{ width: "calc(100% - 46px)" }}
                      showDetails={false}
                      mission={mission}
                      onEdit={handleEditMission}
                      onDelete={async () => {
                        try {
                          setIsLoadingMissions(true);
                          // 해당 미션 ID를 가진 인스턴스 찾기
                          const instanceToRemove = missionInstances.find(
                            (m) => m.mission_id === mission.id
                          );

                          if (instanceToRemove) {
                            await deleteMissionInstance(instanceToRemove.id);
                            // UI 즉시 업데이트
                            await mutateMissionInstances();
                          }
                        } catch (error) {
                          console.error("Error removing mission:", error);
                        } finally {
                          setIsLoadingMissions(false);
                        }
                      }}
                      isModal={true}
                    />
                    <button
                      className={`single-item-button ${
                        missionInstances.some(
                          (m) => m.mission_id === mission.id
                        )
                          ? "added"
                          : ""
                      }`}
                      onClick={() => handleAddMission(mission.id)}
                      disabled={isLoadingMissions}
                    >
                      {missionInstances.some(
                        (m) => m.mission_id === mission.id
                      ) ? (
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

      {/* 날짜 입력 모달 */}
      <Modal isOpen={showDateModal} onClose={() => setShowDateModal(false)}>
        <DateModalContainer onSubmit={handleConfirmAddMission}>
          <Heading level={4}>미션 일정 설정</Heading>
          <div className="date-inputs">
            <div className="input-group">
              <label htmlFor="release-date">공개 일자</label>
              <Input
                id="release-date"
                type="date"
                value={releaseDate}
                onChange={(e) => setReleaseDate(e.target.value)}
                required
              />
            </div>
            <div className="input-group">
              <label htmlFor="expiry-date">마감 일자</label>
              <Input
                id="expiry-date"
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="modal-actions">
            <button
              className="cancel-button"
              onClick={() => setShowDateModal(false)}
              disabled={isLoadingMissions}
            >
              취소
            </button>
            <button
              className="confirm-button"
              type="submit"
              disabled={isLoadingMissions}
            >
              {isLoadingMissions ? <Spinner size="sm" /> : "확인"}
            </button>
          </div>
        </DateModalContainer>
      </Modal>
    </MissionContainer>
  );
}

const ModalListContainer = styled.div`
  .single-item {
    display: flex;
    flex-direction: row;
    align-items: stretch;
    gap: 6px;
    margin-bottom: 6px;

    & > .single-item-button {
      display: flex;
      align-items: center;
      justify-content: center;
      border: none;
      min-width: 40px;
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

const DateModalContainer = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  width: 100%;
  max-width: 400px;

  .date-inputs {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .input-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;

    label {
      font-size: 0.9rem;
      font-weight: 500;
      color: var(--grey-700);
    }
  }

  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
    margin-top: 1rem;

    button {
      padding: 0.5rem 1rem;
      border-radius: 6px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;

      &:disabled {
        opacity: 0.7;
        cursor: not-allowed;
      }
    }

    .cancel-button {
      background-color: var(--grey-100);
      color: var(--grey-700);
      border: 1px solid var(--grey-200);

      &:hover:not(:disabled) {
        background-color: var(--grey-200);
      }
    }

    .confirm-button {
      background-color: var(--primary-500);
      color: white;
      border: none;

      &:hover:not(:disabled) {
        background-color: var(--primary-600);
      }
    }
  }
`;
