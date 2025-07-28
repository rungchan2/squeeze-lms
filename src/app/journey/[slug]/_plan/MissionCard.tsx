"use client";

import { Mission, JourneyMissionInstanceWithMission } from "@/types";
import Text from "@/components/Text/Text";
import styled from "@emotion/styled";
import { RiDeleteBin6Line } from "react-icons/ri";
import { IconContainer } from "@/components/common/IconContainer";
import dayjs from "@/utils/dayjs/dayjs";
import { TeacherOnly } from "@/components/auth/AdminOnly";
import { calcDifference } from "@/utils/dayjs/calcDifference";
import { FaEdit, FaQuestionCircle, FaList, FaCheckSquare, FaImage, FaMix, FaCheck } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { BiGridVertical } from "react-icons/bi";
import { useMissionQuestions } from "@/hooks/useMissionQuestions";

// Helper function to check if mission is a team mission (legacy compatibility)
const isTeamMission = (missionType: string | null): boolean => {
  return missionType === "team";
};

interface MissionCardProps {
  mission?: Mission;
  isModal?: boolean;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  maxWidth?: string;
  missionInstance?: JourneyMissionInstanceWithMission;
  showDetails?: boolean;
  style?: React.CSSProperties;
  isCompleted?: boolean;
  onMissionClick?: () => void;
  journeySlug?: string;
}

export default function MissionCard({
  mission,
  isModal = false,
  onDelete,
  maxWidth = "100%",
  missionInstance,
  showDetails = false,
  style,
  isCompleted = false,
  onMissionClick,
  journeySlug,
}: MissionCardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isTabMission = searchParams.get("tab") === "missions";
  
  // Fetch questions for this mission if showDetails is true
  const { questions, isLoading: isLoadingQuestions } = useMissionQuestions(
    showDetails && mission?.id ? mission.id : null
  );

  if (!mission) {
    return (
      <StyledMissionCard
        isModal={isModal}
        maxWidth={maxWidth}
        showDetails={showDetails}
        isTabMission={isTabMission}
        style={style}
      >
        <Text
          variant="body"
          color="var(--grey-500)"
          fontWeight="bold"
          className="description-text"
          style={{ padding: "16px" }}
        >
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

  const goToEditMission = (missionId: string) => {
    router.push(`/mission/edit/${missionId}`);
  };

  const RemoveHtmlTags = (text: string) => {
    return text.replace(/<[^>]*>?/g, "");
  };

  const description = RemoveHtmlTags(mission.description || "");

  // Helper function to get question type icon
  const getQuestionTypeIcon = (questionType: string) => {
    switch (questionType) {
      case 'essay':
        return <FaList />;
      case 'multiple_choice':
        return <FaCheckSquare />;
      case 'image_upload':
        return <FaImage />;
      case 'mixed':
        return <FaMix />;
      default:
        return <FaQuestionCircle />;
    }
  };

  // Helper function to get question type label
  const getQuestionTypeLabel = (questionType: string) => {
    switch (questionType) {
      case 'essay':
        return '주관식';
      case 'multiple_choice':
        return '객관식';
      case 'image_upload':
        return '이미지';
      case 'mixed':
        return '복합형';
      default:
        return '기타';
    }
  };

  // Helper function to get mission type icon (legacy support)
  const getMissionTypeIcon = (missionType: string | null) => {
    // Legacy type mapping
    if (missionType === 'text' || missionType === 'individual' || missionType === '과제') {
      return <FaList />;
    }
    if (missionType === 'image') {
      return <FaImage />;
    }
    if (missionType === 'team') {
      return <FaMix />;
    }
    // New ENUM types
    switch (missionType) {
      case 'essay':
        return <FaList />;
      case 'multiple_choice':
        return <FaCheckSquare />;
      case 'image_upload':
        return <FaImage />;
      case 'mixed':
        return <FaMix />;
      default:
        return <FaQuestionCircle />;
    }
  };

  return (
    <StyledMissionCard
      isModal={isModal}
      maxWidth={maxWidth}
      showDetails={showDetails}
      isTabMission={isTabMission}
      style={style}
      isCompleted={isCompleted}
      onClick={!isModal && onMissionClick ? onMissionClick : undefined}
      clickable={!isModal && !isCompleted && !!onMissionClick}
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
            <div className="mission-name-container">
              <MissionTypeIcon>
                {getMissionTypeIcon(mission.mission_type)}
              </MissionTypeIcon>
              {isTeamMission(mission.mission_type) && (
                <Text
                  variant="body"
                  fontWeight="bold"
                  className="description-text"
                  color="var(--primary-600)"
                  style={{ marginRight: "4px" }}
              >
                  [팀 미션]
                </Text>
              )}
              <Text
                variant="body"
                fontWeight="bold"
                className="description-text"
              >
                {mission.name}
              </Text>
              {isCompleted && (
                <CompletionBadge>
                  <FaCheck size="12px" />
                  <Text variant="caption" color="var(--primary-600)" fontWeight="bold">
                    완료
                  </Text>
                </CompletionBadge>
              )}
            </div>
            <Text
              variant="caption"
              className="description-text"
              color="var(--grey-600)"
            >
              {description}
            </Text>
          </div>
          
          {/* Question structure display when showDetails is true */}
          {showDetails && questions && questions.length > 0 && (
            <QuestionsPreview>
              <Text variant="caption" fontWeight="bold" color="var(--grey-700)">
                질문 구조 ({questions.length}개)
              </Text>
              <QuestionsList>
                {questions.slice(0, 3).map((question, index) => (
                  <QuestionItem key={question.id}>
                    <QuestionTypeIcon>
                      {getQuestionTypeIcon(question.question_type)}
                    </QuestionTypeIcon>
                    <QuestionText>
                      <Text variant="caption" color="var(--grey-600)">
                        {index + 1}. {question.question_text.length > 30 
                          ? `${question.question_text.substring(0, 30)}...` 
                          : question.question_text}
                      </Text>
                    </QuestionText>
                    <QuestionTypeLabel>
                      <Text variant="caption" color="var(--primary-600)">
                        {getQuestionTypeLabel(question.question_type)}
                      </Text>
                    </QuestionTypeLabel>
                  </QuestionItem>
                ))}
                {questions.length > 3 && (
                  <div style={{ textAlign: 'center' }}>
                    <Text variant="caption" color="var(--grey-500)">
                      +{questions.length - 3}개 더...
                    </Text>
                  </div>
                )}
              </QuestionsList>
            </QuestionsPreview>
          )}
          
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
  isCompleted?: boolean;
  clickable?: boolean;
}

const StyledMissionCard = styled.div<StyledMissionCardProps>`
  width: 100%;
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 10px;
  border: 1px solid var(--grey-200);
  background-color: var(--white);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  transition: box-shadow 0.2s, opacity 0.2s;
  justify-content: space-between;
  border-radius: ${(props) => (props.isModal ? "4px 0 0 4px" : "4px")};
  flex: 1;
  max-width: ${(props) => props.maxWidth};
  opacity: ${(props) => (props.isCompleted ? 0.6 : 1)};
  cursor: ${(props) => (props.clickable ? "pointer" : "default")};

  .mission-name-container {
    display: flex;
    flex-direction: row;
    align-items: center;
  }


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
      props.isModal || props.isCompleted ? "none" : props.clickable ? "0 4px 6px rgba(0, 0, 0, 0.1)" : "none"};
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

const QuestionsPreview = styled.div`
  margin-top: 8px;
  padding: 8px;
  background: var(--grey-50);
  border-radius: 4px;
  border: 1px solid var(--grey-200);
`;

const QuestionsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 4px;
`;

const QuestionItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
`;

const QuestionTypeIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  color: var(--primary-500);
  flex-shrink: 0;
`;

const QuestionText = styled.div`
  flex: 1;
  overflow: hidden;
`;

const QuestionTypeLabel = styled.div`
  padding: 2px 6px;
  background: var(--primary-100);
  border-radius: 8px;
  flex-shrink: 0;
  font-size: 10px;
`;

const MissionTypeIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  color: var(--primary-500);
  margin-right: 6px;
  flex-shrink: 0;
`;

const CompletionBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  background-color: var(--primary-100);
  border-radius: 12px;
  margin-left: 8px;
  flex-shrink: 0;
  
  svg {
    color: var(--primary-600);
  }
`;
