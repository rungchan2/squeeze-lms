import { JourneyWeek } from "@/types";
import Text from "@/components/Text/Text";
import styled from "@emotion/styled";
import { FaChevronDown, FaChevronUp } from "react-icons/fa6";
import { useState, memo, useEffect } from "react";
import MissionComponent from "./MissionComponent";
import { useJourneyMissionInstances } from "@/hooks/useJourneyMissionInstances";
import { FaSquare } from "react-icons/fa";
import { Editable } from "@chakra-ui/react";
import { toaster } from "@/components/ui/toaster";
import { useWeeks } from "@/hooks/useWeeks";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
const MemoizedMissionComponent = memo(MissionComponent);

interface JourneyWeekCardProps {
  week: JourneyWeek;
  index: number;
  deleteWeek: (id: string) => void;
  journeyId: string;
}

export default function WeekCard({
  week,
  deleteWeek,
  index,
  journeyId,
}: JourneyWeekCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [missionCount, setMissionCount] = useState(0);
  const [weekName, setWeekName] = useState(week.name);
  const { role } = useSupabaseAuth();
  const {
    missionInstances,
    isLoading: isLoadingInstances,
  } = useJourneyMissionInstances(journeyId, week.id);
  const { updateWeek } = useWeeks(journeyId);
  // 미션 인스턴스가 로드되면 카운트 업데이트
  useEffect(() => {
    if (!isLoadingInstances && missionInstances) {
      setMissionCount(missionInstances.length);
    }
  }, [missionInstances, isLoadingInstances]);

  // 토글 핸들러
  const handleToggle = () => {
    setIsOpen((prev) => !prev);
  };
  const handleUpdateWeekName = () => {
    updateWeek(week.id, { name: weekName, week_number: week.week_number });
    toaster.create({
      title: "주차 이름이 수정되었습니다.",
      type: "success",
    });
  };

  return (
    <WeekCardContainer>
      <IndexContainer>
        <FaSquare size={12} />
        <Text variant="body" color="var(--grey-700)" fontWeight="bold">
          {index + 1}
        </Text>
      </IndexContainer>
      <StyledWeekCard>
        <div className="week-header" onClick={handleToggle}>
          <div className="week-header-left">
            {isOpen ? <FaChevronUp /> : <FaChevronDown />}
            <Text color="var(--grey-500)" variant="body">
              {week.week_number ? `${week.week_number}주차` : "미정"}
            </Text>
            {role === "teacher" || role === "admin" ? (
              <Editable.Root
                defaultValue={week.name}
                onClick={(e) => e.stopPropagation()}
              >
                <Editable.Preview />
                <Editable.Input
                  onChange={(e) => {
                    setWeekName(e.target.value);
                  }}
                  onBlur={handleUpdateWeekName}
                />
              </Editable.Root>
            ) : (
              <Text variant="body" style={{ flex: 1, minWidth: 0 }}>
                {weekName}
              </Text>
            )}
          </div>
          <div className="week-header-right">
            <Text variant="caption">미션: {missionCount}</Text>
          </div>
        </div>
        {isOpen && (
          <MemoizedMissionComponent
            weekId={week.id}
            weekName={week.name}
            journeyId={journeyId}
            deleteWeek={deleteWeek}
            onTotalMissionCountChange={setMissionCount}
          />
        )}
      </StyledWeekCard>
    </WeekCardContainer>
  );
}

const WeekCardContainer = styled.div`
  margin-bottom: 16px;
`;

const IndexContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  padding-left: 4px;

  svg {
    color: var(--grey-500);
    font-size: 12px;
  }
`;

const StyledWeekCard = styled.div`
  background: var(--white);
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

  .week-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
    padding: 4px 0;
  }

  .week-header-left {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
    min-width: 0; /* 텍스트 오버플로우 방지 */

    svg {
      width: 16px;
      height: 16px;
      color: var(--grey-500);
      flex-shrink: 0;
    }

    /* 주차 텍스트 */
    & > p:first-of-type {
      flex-shrink: 0;
    }
  }

  .week-header-right {
    margin-left: 12px;
    display: flex;
    align-items: center;
    gap: 8px;

    span {
      color: var(--grey-500);
      white-space: nowrap;
    }
  }

  /* Editable 컴포넌트 스타일링 */
  [data-editable-root] {
    min-width: 0; /* 텍스트 오버플로우 방지 */
  }

  [data-editable-input],
  [data-editable-preview] {
    font-size: 14px;
    line-height: 1.5;
    padding: 2px 4px;
    width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  [data-editable-input] {
    border: 1px solid var(--grey-300);
    border-radius: 4px;
    outline: none;

    &:focus {
      border-color: var(--blue-500);
    }
  }
`;
