"use client";

import { Mission, JourneyMissionInstanceWithMission } from "@/types";
import Text from "@/components/Text/Text";
import styled from "@emotion/styled";
import { RiDeleteBin6Line } from "react-icons/ri";
import { IconContainer } from "@/components/common/IconContainer";
import dayjs from "@/utils/dayjs/dayjs";
import { TeacherOnly } from "@/components/auth/AdminOnly";
import { calcDifference } from "@/utils/dayjs/calcDifference";
import { toaster } from "@/components/ui/toaster";
import { FaEdit } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { BiGridVertical } from "react-icons/bi";

interface MissionCardProps {
  mission?: Mission;
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
  const router = useRouter();
  const params = useParams();
  const slug = params.slug;
  const searchParams = useSearchParams();
  const isTabMission = searchParams.get("tab") === "missions";

  if (!mission) {
    return (
      <StyledMissionCard
        isModal={isModal}
        maxWidth={maxWidth}
        showDetails={showDetails}
        isTabMission={isTabMission}
        style={style}
      >
        <Text variant="body" color="var(--grey-500)" fontWeight="bold" className="description-text" style={{ padding: "16px" }}>
          미션을 찾을 수 없습니다.
        </Text>
      </StyledMissionCard>
    );
  }

  const difference = calcDifference(missionInstance?.expiry_date || "");
  const dDay =
    difference === 0
      ? "D-Day"
      : difference > 0
      ? `D+${difference}(지남)`
      : `D-${Math.abs(difference)}`;
  const isDDay = difference === 0;
  const isDDayPassed = difference <= 0;
  const formattedDateStart =
    dayjs(missionInstance?.release_date || "").format("M/D") === "Invalid Date"
      ? ""
      : dayjs(missionInstance?.release_date || "").format("M/D");
  const formattedDateEnd =
    dayjs(missionInstance?.expiry_date || "").format("M/D") === "Invalid Date"
      ? ""
      : dayjs(missionInstance?.expiry_date || "").format("M/D");

  const dateString =
    formattedDateStart || formattedDateEnd
      ? `${formattedDateStart} ~ ${formattedDateEnd}`
      : "날짜없음";

  const goToEditMission = (missionId: number) => {
    router.push(`/journey/${slug}/teacher/edit-mission/${missionId}`);
  };

  const RemoveHtmlTags = (text: string) => {
    return text.replace(/<[^>]*>?/g, "");
  };

  const description = RemoveHtmlTags(mission.description || "");

  return (
    <StyledMissionCard
      isModal={isModal}
      maxWidth={maxWidth}
      showDetails={showDetails}
      isTabMission={isTabMission}
      style={style}
    >
      <div className="left-container">
        {!isModal && (
          <BiGridVertical
            size="16px"
            style={{ minWidth: "16px" }}
            className="menu-icon"
          />
        )}
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
              {description}
            </Text>
          </div>
          {!isModal && missionInstance && (
            <div className="horizontal-mission-container">
              <Text variant="caption" color="var(--grey-600)">
                {dateString}
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
          <TeacherOnly>
            <div className="mission-actions">
              <IconContainer
                onClick={(e) => {
                  e.stopPropagation();
                  goToEditMission(mission.id);
                }}
              >
                <FaEdit />
              </IconContainer>
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
          </TeacherOnly>
        </>
      )}
    </StyledMissionCard>
  );
}

interface StyledMissionCardProps {
  isModal: boolean;
  maxWidth: string;
  showDetails: boolean;
  isTabMission: boolean;
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
      props.isModal ? "100%" : "calc(100% - 30px)"}; /* 오른쪽 버튼 영역 고려 */
    overflow: hidden;

    @media (max-width: 420px) {
      .menu-icon {
        display: none;
      }
    }
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
    display: ${(props) => (props.isTabMission ? "none" : "flex")};
    gap: 0.3rem;
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
