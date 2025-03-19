"use client";

import { Mission, JourneyMissionInstanceWithMission } from "@/types";
import Text from "@/components/Text/Text";
import styled from "@emotion/styled";
import { RiDeleteBin6Line } from "react-icons/ri";
import { IconContainer } from "@/components/common/IconContainer";
import { FiMenu } from "react-icons/fi";
import dayjs from "@/utils/dayjs/dayjs";
import { AdminOnly } from "@/components/auth/AdminOnly";
import { calcDifference } from "@/utils/dayjs/calcDifference";
import { toaster } from "@/components/ui/toaster";
interface MissionCardProps {
  mission: Mission;
  isModal?: boolean;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
  maxWidth?: string;
  missionInstance?: JourneyMissionInstanceWithMission;
  showDetails?: boolean;
  style?: React.CSSProperties;
}

export default function MissionCard({
  mission,
  isModal = false,
  onDelete,
  maxWidth = "100%",
  missionInstance,
  showDetails = false,
  style,
}: MissionCardProps) {
  const difference = calcDifference(missionInstance?.expiry_date || "");
  const dDay =
    difference === 0
      ? "D-Day"
      : difference > 0
      ? `D-${difference}`
      : `D+${Math.abs(difference)}`;
  const isDDay = difference === 0;
  const isDDayPassed = difference <= 0;
  const formattedDateStart =
    dayjs(missionInstance?.release_date || "").format("M/D") === "Invalid Date"
      ? "날짜없음"
      : dayjs(missionInstance?.release_date || "").format("M/D");
  const formattedDateEnd =
    dayjs(missionInstance?.expiry_date || "").format("M/D") === "Invalid Date"
      ? "날짜없음"
      : dayjs(missionInstance?.expiry_date || "").format("M/D");
  return (
    <StyledMissionCard
      isModal={isModal}
      maxWidth={maxWidth}
      showDetails={showDetails}
      style={style}
    >
      <div className="left-container">
        {!isModal && <FiMenu size="16px" style={{ minWidth: "16px" }} />}
        <div className="mission-item-header">
          <div className="description-container">
            <Text variant="body" fontWeight="bold" className="description-text">
              {mission.name}
            </Text>
            <Text
              variant="caption"
              className="description-text"
              color="var(--grey-600)"
            >
              {mission.description}
            </Text>
          </div>
          {!isModal && missionInstance && (
            <div className="horizontal-mission-container">
              <Text variant="caption" color="var(--grey-600)">
                {formattedDateStart} ~ {formattedDateEnd}
              </Text>
              {missionInstance.expiry_date && (
                <div
                  className={`d-day ${
                    isDDay ? "d-day" : isDDayPassed ? "negative" : ""
                  }`}
                >
                  <Text variant="caption">{dDay}</Text>
                </div>
              )}
              <div className="mission-meta">
                <Text variant="caption">{mission.points || 0}PT</Text>
              </div>
            </div>
          )}
        </div>
      </div>

      {!isModal && (
        <>
          <AdminOnly>
            <div className="mission-actions">
              {/* <IconContainer onClick={() => onEdit?.(mission.id)}>
                <FaEdit />
              </IconContainer> */}
              <IconContainer
                onClick={() => {
                  onDelete?.(mission.id);
                  toaster.create({
                    title: "미션이 삭제되었습니다.",
                    type: "warning",
                  });
                }}
                hoverColor="var(--negative-500)"
              >
                <RiDeleteBin6Line />
              </IconContainer>
            </div>
          </AdminOnly>
        </>
      )}
    </StyledMissionCard>
  );
}

interface StyledMissionCardProps {
  isModal: boolean;
  maxWidth: string;
  showDetails: boolean;
}

const StyledMissionCard = styled.div<StyledMissionCardProps>`
  width: 100%;
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 10px;
  border: 1px solid var(--grey-200);
  background-color: var(--white);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  transition: box-shadow 0.2s;
  justify-content: space-between;
  border-radius: ${(props) => (props.isModal ? "4px 0 0 4px" : "4px")};
  flex: 1;
  max-width: ${(props) => props.maxWidth};

  .horizontal-mission-container {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 10px;
  }
  .left-container {
    display: flex;
    align-items: center;
    gap: 10px;
    max-width: ${(props) =>
      props.isModal ? "100%" : "calc(100% - 80px)"}; /* 오른쪽 버튼 영역 고려 */
    overflow: hidden;
  }

  &:hover {
    box-shadow: ${(props) =>
      props.isModal ? "none" : "0 4px 6px rgba(0, 0, 0, 0.1)"};
  }

  .mission-item-header {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
    width: 100%;
  }

  .description-container {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .description-text {
    display: block;
    text-overflow: ${(props) => (props.showDetails ? "none" : "ellipsis")};
    white-space: ${(props) => (props.showDetails ? "normal" : "nowrap")};
    overflow: hidden;
    line-clamp: ${(props) => (props.showDetails ? "none" : "1")};
    -webkit-line-clamp: ${(props) => (props.showDetails ? "none" : "1")};
    -webkit-box-orient: vertical;
    max-width: 100%;
  }

  .mission-actions {
    display: flex;
    gap: 0.5rem;
    flex-shrink: 0;
  }

  .mission-meta {
    vertical-align: middle;
    display: flex;
    gap: 1rem;
    color: var(--white);
    padding: 4px 4px;
    border-radius: 4px;
    background-color: var(--primary-400);
    z-index: 1;
  }
  .d-day {
    display: flex;
    border: 1px solid var(--grey-200);
    gap: 1rem;
    color: var(--grey-600);
    padding: 4px 4px;
    border-radius: 4px;

    &.negative {
      background-color: var(--negative-600);
      color: var(--white);
      border: none;
    }
    &.d-day {
      background-color: var(--primary-400);
      color: var(--white);
      border: none;
    }
  }
`;
