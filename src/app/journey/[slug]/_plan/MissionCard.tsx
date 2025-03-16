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
interface MissionCardProps {
  mission: Mission;
  isModal?: boolean;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
  maxWidth?: string;
  missionInstance?: JourneyMissionInstanceWithMission;
  showDetails?: boolean;
}

export default function MissionCard({
  mission,
  isModal = false,
  onDelete,
  maxWidth = "100%",
  missionInstance,
  showDetails = false,
}: MissionCardProps) {
  return (
    <StyledMissionCard isModal={isModal} maxWidth={maxWidth} showDetails={showDetails}>
      <div className="left-container">
        {!isModal && <FiMenu size="16px" style={{ minWidth: "16px" }} />}
        <div className="mission-item-header">
          <Text variant="body" fontWeight="bold">
            {mission.name}
          </Text>
          <div className="description-container">
            <Text
              variant="caption"
              className="description-text"
              color="var(--grey-600)"
            >
              {mission.description}
            </Text>
          </div>
          {!isModal && missionInstance && (
            <Text variant="small">
              {dayjs(missionInstance.release_date).format("M/D")} ~{" "}
              {dayjs(missionInstance.expiry_date).format("M/D")}
            </Text>
          )}
        </div>
      </div>

      {!isModal && (
        <>
          <div className="mission-meta">
            <Text variant="small">{mission.points || 0}PT</Text>
          </div>
          {missionInstance?.expiry_date && (
            <div className="d-day">
              <Text variant="small">
                D-{calcDifference(missionInstance?.expiry_date || "")}
              </Text>
            </div>
          )}
          <AdminOnly>
            <div className="mission-actions">
              {/* <IconContainer onClick={() => onEdit?.(mission.id)}>
                <FaEdit />
              </IconContainer> */}
              <IconContainer
                onClick={() => onDelete?.(mission.id)}
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

  .description-text {
    display: block;
    text-overflow: ${(props) => (props.showDetails ? "none" : "ellipsis")};
    white-space: ${(props) => (props.showDetails ? "normal" : "nowrap")};
    overflow: hidden;
    max-width: 100%;
  }

  .mission-actions {
    display: flex;
    gap: 0.5rem;
    flex-shrink: 0;
  }

  .mission-meta {
    position: absolute;
    vertical-align: middle;
    right: -10px;
    top: -10px;
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
    gap: 1rem;
    color: var(--white);
    padding: 4px 4px;
    border-radius: 4px;
    background-color: var(--negative-600);
  }
`;
