import { JourneyWeek } from "@/types";
import Text from "@/components/Text/Text";
import styled from "@emotion/styled";
import { FaChevronDown, FaChevronUp } from "react-icons/fa6";
import { useState, memo } from "react";
import MissionComponent from "./MissionComponent";

interface JourneyWeekCardProps {
  week: JourneyWeek;
  index: number;
  updateWeek: (id: number, data: Partial<JourneyWeek>) => void;
  deleteWeek: (id: number) => void;
  journeyId: number;
}

// MissionComponent를 메모이제이션하여 불필요한 리렌더링 방지
const MemoizedMissionComponent = memo(MissionComponent);

export default function WeekCard({
  week,
  updateWeek,
  deleteWeek,
  index,
  journeyId,
}: JourneyWeekCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // 미션 개수 계산 - null 체크 추가
  const missionCount = week.missions?.length || 0;

  // 토글 핸들러
  const handleToggle = () => {
    setIsOpen(prev => !prev);
  };

  return (
    <StyledWeekCard key={week.id}>
      <div className="week-header" onClick={handleToggle}>
        <div className="week-header-left">
          {isOpen ? <FaChevronUp /> : <FaChevronDown />}
          <Text color="var(--grey-500)" variant="body">
            {week.week_number ? `${week.week_number}` : "미정"}
          </Text>
          <Text variant="body">{week.name}</Text>
        </div>
        <div className="week-header-right">
          <Text variant="small">
            {missionCount}/3
          </Text>
        </div>
      </div>
      {isOpen && (
        <MemoizedMissionComponent 
          weekId={week.id} 
          weekName={week.name} 
          journeyId={journeyId} 
        />
      )}
    </StyledWeekCard>
  );
}

const StyledWeekCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 10px 16px;
  border-radius: 8px;
  border: 1px solid var(--grey-200);
  background-color: var(--white);
  justify-content: space-between;
  transition: 0.2s;

  &:hover {
    background-color: var(--grey-50);
    box-shadow: 0 0 10px 0 rgba(0, 0, 0, 0.1);
  }

  .week-header {
    width: 100%;
    display: flex;
    flex-direction: row;
    gap: 1rem;
    align-items: center;
    justify-content: space-between;
    cursor: pointer;

    .week-header-left {
      display: flex;
      flex-direction: row;
      gap: 0.5rem;
      align-items: center;
    }

    .week-header-right {
      display: flex;
      flex-direction: row;
      gap: 0.5rem;
      align-items: center;
    }
  }
`;
