"use client";

import MissionCard from "../_plan/MissionCard";
import { useRouter } from "next/navigation";
import Spinner from "@/components/common/Spinner";
import { useMissionInstance } from "@/hooks/useMissionInstance";
import Tiptap from "@/components/richTextInput/RichTextEditor";
import Heading from "@/components/Text/Heading";
import Text from "@/components/Text/Text";
import styled from "@emotion/styled";
import { useCallback, useEffect, useState } from "react";
import { toaster } from "@/components/ui/toaster";
import { createPost, updatePost } from "@/utils/data/posts";
import { Input } from "@chakra-ui/react";
import InputAndTitle from "@/components/InputAndTitle";
import userPoint from "@/utils/data/userPoint";
import { UpdatePost } from "@/types";
import { useCompletedMissions } from "@/hooks/usePosts";
import { Error } from "@/components/common/Error";
import { JourneyMissionInstanceWithMission } from "@/types";
import { StlyedSelect } from "@/components/select/Select";
import { useTeams } from "@/hooks/useTeams";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useMissionQuestions } from "@/hooks/useMissionQuestions";
import EssayQuestionInput from "@/components/mission/EssayQuestionInput";
import MultipleChoiceInput from "@/components/mission/MultipleChoiceInput";
import ImageUploadInput from "@/components/mission/ImageUploadInput";
import MixedQuestionInput from "@/components/mission/MixedQuestionInput";
import { AnyAnswer } from "@/types/missionQuestions";
import { FloatingButton } from "@/components/common/FloatingButton";
import BottomSpacing from "@/components/common/BottomSpacing";

type TeamMember = {
  label: string;
  value: string;
  isFixed: boolean;
};

// Use proper types from missionQuestions
type AnswerData = AnyAnswer;

export default function DoMissionPage({
  updateData,
  updateDataId,
  slug,
  missionInstanceId,
}: {
  updateData?: UpdatePost;
  updateDataId?: string;
  slug?: string;
  missionInstanceId?: string;
}) {
  const { id: userId, role } = useSupabaseAuth();
  const router = useRouter();
  const { missionInstance, isLoading, error } = useMissionInstance(
    missionInstanceId || ""
  );
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [structuredAnswers, setStructuredAnswers] = useState<AnswerData[]>([]);
  const [questionValidations, setQuestionValidations] = useState<
    Record<string, boolean>
  >({});
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);

  // Fetch mission questions
  const { questions, isLoading: isLoadingQuestions } = useMissionQuestions(
    missionInstance?.mission.id || null
  );

  // Check if this is a modern mission with questions or legacy mission
  const isModernMission = questions && questions.length > 0;

  // Progress tracking for modern missions
  const calculateModernProgress = () => {
    if (!questions || questions.length === 0) return 0;
    let progress = 0;

    // Title progress
    if (title.trim()) progress += 20;

    // Questions progress (80% total)
    const questionProgress = (structuredAnswers.length / questions.length) * 80;
    progress += questionProgress;

    return Math.min(progress, 100);
  };

  // Progress tracking for legacy missions
  const calculateLegacyProgress = () => {
    let progress = 0;
    if (title.trim()) progress += 33;
    if (content.trim()) progress += 67;
    return Math.min(progress, 100);
  };

  const calculateProgress = () => {
    return isModernMission
      ? calculateModernProgress()
      : calculateLegacyProgress();
  };

  // Handle structured answer changes
  const handleQuestionAnswer = (questionId: string, answer: any) => {
    const question = questions?.find((q) => q.id === questionId);
    if (!question) return;

    let answerData: AnswerData;

    // Create proper answer object based on question type
    switch (question.question_type) {
      case "essay":
        answerData = {
          question_id: questionId,
          question_order: question.question_order || 0,
          answer_type: "essay" as const,
          answer_text: answer.html,
          answer_text_plain: answer.plainText,
          selected_option: null,
          image_urls: [],
          is_correct: null,
          points_earned: null,
        };
        break;
      case "multiple_choice":
        answerData = {
          question_id: questionId,
          question_order: question.question_order || 0,
          answer_type: "multiple_choice" as const,
          answer_text: null,
          selected_option: Array.isArray(answer) ? answer.join(",") : answer,
          image_urls: [],
          is_correct: null,
          points_earned: null,
        };
        break;
      case "image_upload":
        answerData = {
          question_id: questionId,
          question_order: question.question_order || 0,
          answer_type: "image_upload" as const,
          answer_text: null,
          selected_option: null,
          image_urls: answer,
          is_correct: null,
          points_earned: null,
        };
        break;
      case "mixed":
        answerData = {
          question_id: questionId,
          question_order: question.question_order || 0,
          answer_type: "mixed" as const,
          answer_text: answer.text || null,
          answer_text_plain: answer.plainText || null,
          selected_option: null,
          image_urls: answer.images || [],
          is_correct: null,
          points_earned: null,
        };
        break;
      default:
        return; // Skip unsupported question types
    }

    setStructuredAnswers((prev) => {
      const filtered = prev.filter((a) => a.question_id !== questionId);
      return [...filtered, answerData].sort(
        (a, b) => a.question_order - b.question_order
      );
    });
  };

  // Handle question validation
  const handleQuestionValidation = (questionId: string, isValid: boolean) => {
    setQuestionValidations((prev) => ({
      ...prev,
      [questionId]: isValid,
    }));
  };

  // Check if all required questions are answered
  const areAllRequiredQuestionsAnswered = () => {
    if (!questions) return true;

    const requiredQuestions = questions.filter((q) => q.is_required);
    return requiredQuestions.every((q) => questionValidations[q.id] === true);
  };

  // Auto-save functionality
  const autoSave = async () => {
    if (!title.trim() && structuredAnswers.length === 0 && !content.trim()) {
      return; // Nothing to save
    }

    try {
      setIsAutoSaving(true);
      // Save to localStorage for now (could be enhanced to save to server)
      const autoSaveData = {
        title,
        content,
        structuredAnswers,
        missionInstanceId,
        timestamp: new Date().toISOString(),
      };

      localStorage.setItem(
        `autosave_mission_${missionInstanceId}`,
        JSON.stringify(autoSaveData)
      );
      setLastSaved(new Date());
    } catch (error) {
      console.error("Auto-save failed:", error);
    } finally {
      setIsAutoSaving(false);
    }
  };

  // Load auto-saved data on component mount
  useEffect(() => {
    if (missionInstanceId && !updateData) {
      try {
        const saved = localStorage.getItem(
          `autosave_mission_${missionInstanceId}`
        );
        if (saved) {
          const autoSaveData = JSON.parse(saved);
          if (autoSaveData.title) setTitle(autoSaveData.title);
          if (autoSaveData.content) setContent(autoSaveData.content);
          if (autoSaveData.structuredAnswers) {
            setStructuredAnswers(autoSaveData.structuredAnswers);
          }
          setLastSaved(new Date(autoSaveData.timestamp));
        }
      } catch (error) {
        console.error("Failed to load auto-saved data:", error);
      }
    }
  }, [missionInstanceId, updateData]);

  // Auto-save timer
  useEffect(() => {
    const timer = setTimeout(() => {
      autoSave();
    }, 2000); // Auto-save after 2 seconds of inactivity

    return () => clearTimeout(timer);
  }, [title, content, structuredAnswers]);

  // Helper function for legacy team mission check
  const isTeamMissionType = (missionType: string | null): boolean => {
    return missionType === "team";
  };

  const isTeamMission = isTeamMissionType(
    missionInstance?.mission.mission_type || null
  );
  const [selectedTeamMembers, setSelectedTeamMembers] = useState<
    TeamMember[] | undefined
  >();

  // useTeams 훅 사용
  const { teamData, markPostAsTeamSubmission } = useTeams(slug ?? "");

  // 완료된 미션 목록 관리를 위한 훅 추가
  const { refetch: refetchCompletedMissions } = useCompletedMissions(
    userId || "",
    slug || ""
  );

  // 권한 체크 함수
  const canEditPost = useCallback(() => {
    if (!updateData || !userId) return false;
    
    // 작성자 본인
    if (userId === updateData.user_id) return true;
    
    // teacher 또는 admin 권한
    if (role === 'teacher' || role === 'admin') {
      return true; // organization 체크는 DB 정책에서 처리
    }
    
    return false;
  }, [updateData, userId, role]);

  // 권한 체크는 useEffect 내에서 수행, flushSync 오류 방지를 위해 비동기 처리
  useEffect(() => {
    if (updateData && !canEditPost()) {
      // setTimeout을 사용하여 렌더링 사이클과 분리
      setTimeout(() => {
        toaster.create({
          title: "권한이 없습니다.",
          type: "error",
        });
        router.push(`/journey/${slug}`);
      }, 0);
    }
  }, [updateData, canEditPost, router, slug]);

  useEffect(() => {
    if (updateData) {
      setContent(updateData.content || "");
      setTitle(updateData.title || "");

      // Load structured answers if available
      if (
        (updateData as any).answers_data &&
        typeof (updateData as any).answers_data === "object"
      ) {
        const answersData = (updateData as any).answers_data;
        if (answersData.answers && Array.isArray(answersData.answers)) {
          setStructuredAnswers(answersData.answers);

          // Set validation state for existing answers
          answersData.answers.forEach((answer: AnyAnswer) => {
            const hasValidAnswer =
              (answer.answer_type === "essay" && answer.answer_text) ||
              (answer.answer_type === "multiple_choice" &&
                answer.selected_option) ||
              (answer.answer_type === "image_upload" &&
                answer.image_urls &&
                answer.image_urls.length > 0) ||
              (answer.answer_type === "mixed" &&
                (answer.answer_text ||
                  (answer.image_urls && answer.image_urls.length > 0)));

            if (hasValidAnswer) {
              setQuestionValidations((prev) => ({
                ...prev,
                [answer.question_id]: true,
              }));
            }
          });
        }
      }
    }
  }, [updateData]);

  // 팀 데이터 로딩 시 팀원 목록 초기화
  useEffect(() => {
    // 팀이 있는 경우 팀원 정보 가져오기
    if (teamData && teamData.members && teamData.members.length > 0) {
      const teamMembers = teamData.members.map((member) => ({
        label: `${member.profiles?.first_name || ""} ${
          member.profiles?.last_name || ""
        }`,
        value: member.user_id,
        isFixed: member.user_id === userId || member.is_leader === true,
      }));

      setSelectedTeamMembers(teamMembers);
    }
  }, [teamData, userId]);

  if (!userId) return <Error message="로그인이 필요합니다." />;
  if (isLoading) return <Spinner />;
  if (error) return <Error message={`오류가 발생했습니다: ${error.message}`} />;

  // 팀 생성 또는 업데이트 처리
  const handleTeamSubmission = async (postId: string) => {
    try {
      if (!missionInstance) return false;

      const success = await markPostAsTeamSubmission(
        postId,
        missionInstance.mission.points || 0
      );

      if (!success) {
        console.error("팀 제출 처리 중 오류 발생");
        return false;
      }

      return true;
    } catch (error) {
      console.error("팀 제출 처리 중 오류:", error);
      return false;
    }
  };

  const handleSubmit = async (
    missionInstance: JourneyMissionInstanceWithMission
  ) => {
    // Title validation
    if (!title.trim()) {
      toaster.create({
        title: "미션 제목을 입력해주세요.",
        description: "본인의 이름을 포함하면 더 좋습니다.",
        type: "warning",
      });
      return;
    }

    // Enhanced validation for different mission types
    if (isModernMission) {
      const unansweredQuestions =
        questions?.filter((q) => q.is_required && !questionValidations[q.id]) ||
        [];

      if (unansweredQuestions.length > 0) {
        const questionNumbers = unansweredQuestions
          .map(
            (q, index) =>
              questions?.findIndex((question) => question.id === q.id) + 1
          )
          .join(", ");

        toaster.create({
          title: "필수 질문에 답변이 필요합니다.",
          description: `질문 ${questionNumbers}번에 답변해주세요.`,
          type: "warning",
        });
        return;
      }
    } else {
      if (!content.trim()) {
        toaster.create({
          title: "미션 내용을 입력해주세요.",
          description: "텍스트 영역에 미션에 대한 답변을 작성해주세요.",
          type: "warning",
        });
        return;
      }
    }

    // Title validation
    if (title.length > 100) {
      toaster.create({
        title: "제목이 너무 깁니다.",
        description: "제목을 100자 이내로 줄여주세요.",
        type: "warning",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      // Prepare post data based on mission type
      const postData = {
        user_id: userId,
        mission_instance_id: missionInstance.id,
        title: title,
        score: missionInstance.mission.points || 0,
        journey_id: missionInstance.journey_id || "",
        content: isModernMission ? "" : content, // Legacy content
        ...(isModernMission && {
          answers_data: {
            answers: structuredAnswers,
            submission_metadata: {
              total_questions: questions?.length || 0,
              answered_questions: structuredAnswers.length,
              submission_time: new Date().toISOString(),
              auto_graded: false,
              manual_review_required: true,
            },
          },
          total_questions: questions?.length || 0,
          answered_questions: structuredAnswers.length,
          completion_rate: questions?.length
            ? (structuredAnswers.length / questions.length) * 100
            : 0,
        }),
      };

      const { data, error } = await createPost(postData);

      if (error) {
        console.error("미션 제출 오류:", error);
        toaster.create({
          title: "미션 제출 중 오류가 발생했습니다.",
          type: "error",
        });
        return;
      }

      // 팀 미션인 경우 팀 처리
      if (isTeamMission && data?.id) {
        const success = await handleTeamSubmission(data.id);
        if (!success) {
          toaster.create({
            title: "팀 처리 중 오류가 발생했습니다.",
            type: "error",
          });
        }
      } else {
        // 팀 미션이 아닌 경우 일반 유저 포인트 생성
        const { error: userPointError } = await userPoint.createUserPoint({
          profile_id: userId,
          mission_instance_id: missionInstance.id,
          post_id: data?.id || "",
          total_points: missionInstance.mission.points || 0,
        });

        if (userPointError) {
          console.error("유저 포인트 생성 오류:", userPointError);
          toaster.create({
            title: "유저 포인트 생성 중 오류가 발생했습니다.",
            description:
              typeof userPointError === "object"
                ? (userPointError as any)?.message ||
                  JSON.stringify(userPointError).substring(0, 50) + "..."
                : String(userPointError),
            type: "error",
          });
        }
      }

      // 완료된 미션 목록 갱신
      await refetchCompletedMissions();

      // Clean up auto-save data on successful submission
      localStorage.removeItem(`autosave_mission_${missionInstanceId}`);

      // 성공 알림 후 캐시 무효화 리다이렉션
      toaster.create({
        title: "미션이 성공적으로 제출되었습니다!",
        description: isModernMission
          ? `${structuredAnswers.length}개 질문에 답변하여 제출했습니다.`
          : "답변이 성공적으로 저장되었습니다.",
        type: "success",
      });

      router.push(`/journey/${slug}`);
    } catch (error: any) {
      console.error("미션 제출 중 예외 발생:", error);
      toaster.create({
        title: "미션 제출 중 오류가 발생했습니다.",
        description: error?.message || "다시 시도해주세요.",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.MouseEvent) => {
    e.preventDefault(); // 폼 기본 제출 동작 방지

    // Title validation
    if (!title.trim()) {
      toaster.create({
        title: "미션 제목을 입력해주세요.",
        type: "warning",
      });
      return;
    }

    // Validation based on mission type
    if (isModernMission) {
      const unansweredQuestions =
        questions?.filter((q) => q.is_required && !questionValidations[q.id]) ||
        [];

      if (unansweredQuestions.length > 0) {
        const questionNumbers = unansweredQuestions
          .map(
            (q, index) =>
              questions?.findIndex((question) => question.id === q.id) + 1
          )
          .join(", ");

        toaster.create({
          title: "필수 질문에 답변이 필요합니다.",
          description: `질문 ${questionNumbers}번에 답변해주세요.`,
          type: "warning",
        });
        return;
      }
    } else {
      if (!content.trim()) {
        toaster.create({
          title: "미션 내용을 입력해주세요.",
          type: "warning",
        });
        return;
      }
    }

    try {
      setIsSubmitting(true);

      // Prepare update data based on mission type
      const updatePayload: any = {
        title: title,
        user_id: userId,
      };

      if (isModernMission) {
        updatePayload.content = ""; // Clear legacy content for modern missions
        updatePayload.answers_data = {
          answers: structuredAnswers,
          submission_metadata: {
            total_questions: questions?.length || 0,
            answered_questions: structuredAnswers.length,
            submission_time: new Date().toISOString(),
            auto_graded: false,
            manual_review_required: true,
          },
        };
        updatePayload.total_questions = questions?.length || 0;
        updatePayload.answered_questions = structuredAnswers.length;
        updatePayload.completion_rate = questions?.length
          ? (structuredAnswers.length / questions.length) * 100
          : 0;
      } else {
        updatePayload.content = content;
      }

      const { error } = await updatePost(updatePayload, updateDataId || "");

      if (error) {
        console.error("미션 수정 오류:", error);
        toaster.create({
          title: "미션 수정 중 오류가 발생했습니다.",
          type: "error",
        });
        return;
      }

      // 팀 미션인 경우 팀 처리 업데이트
      if (isTeamMission && updateDataId) {
        const success = await handleTeamSubmission(updateDataId);
        if (!success) {
          toaster.create({
            title: "팀 처리 중 오류가 발생했습니다.",
            type: "error",
          });
        }
      }

      toaster.create({
        title: "미션이 성공적으로 수정되었습니다!",
        description: isModernMission
          ? `${structuredAnswers.length}개 질문에 대한 답변이 수정되었습니다.`
          : "답변이 성공적으로 수정되었습니다.",
        type: "success",
      });

      // 캐시 무효화를 위해 페이지 새로고침
      if (!slug) {
        router.back();
      } else {
        window.location.href = `/journey/${slug}`;
      }
    } catch (error: any) {
      console.error("미션 수정 중 예외 발생:", error);
      toaster.create({
        title: "미션 수정 중 오류가 발생했습니다.",
        description: error?.message || "다시 시도해주세요.",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render question input component based on type
  const renderQuestionInput = (question: any, index: number) => {
    const initialValue = getInitialAnswerForQuestion(question.id);

    switch (question.question_type) {
      case "essay":
        return (
          <EssayQuestionInput
            key={question.id}
            question={question}
            questionIndex={index}
            initialValue={initialValue?.answer_text || ""}
            onChange={handleQuestionAnswer}
            onValidation={handleQuestionValidation}
          />
        );
      case "multiple_choice":
        return (
          <MultipleChoiceInput
            key={question.id}
            question={question}
            questionIndex={index}
            initialValue={
              initialValue?.selected_option
                ? question.multiple_select
                  ? initialValue.selected_option.split(",")
                  : initialValue.selected_option
                : question.multiple_select
                ? []
                : ""
            }
            onChange={handleQuestionAnswer}
            onValidation={handleQuestionValidation}
          />
        );
      case "image_upload":
        return (
          <ImageUploadInput
            key={question.id}
            question={question}
            questionIndex={index}
            initialValue={initialValue?.image_urls || []}
            onChange={handleQuestionAnswer}
            onValidation={handleQuestionValidation}
          />
        );
      case "mixed":
        return (
          <MixedQuestionInput
            key={question.id}
            question={question}
            questionIndex={index}
            initialValue={{
              text: initialValue?.answer_text || "",
              images: initialValue?.image_urls || [],
            }}
            onChange={handleQuestionAnswer}
            onValidation={handleQuestionValidation}
          />
        );
      default:
        return null;
    }
  };

  // Get initial answer for a question (for edit mode)
  const getInitialAnswerForQuestion = (questionId: string) => {
    return structuredAnswers.find((a) => a.question_id === questionId);
  };

  return (
    <MissionContainer>
      <div className="mission-container">
        <div className="mission-header">
          <Heading level={4}>
            {missionInstance
              ? missionInstance.mission.name
              : "미션 (삭제된 과제 입니다)"}
          </Heading>
          <ProgressSection>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text variant="caption" color="var(--grey-600)">
                진행률: {calculateProgress().toFixed(0)}%
              </Text>
              <AutoSaveStatus>
                {isAutoSaving ? (
                  <Text variant="caption" color="var(--primary-500)">
                    저장 중...
                  </Text>
                ) : lastSaved ? (
                  <Text variant="caption" color="var(--grey-500)">
                    {lastSaved.toLocaleTimeString()}에 저장됨
                  </Text>
                ) : null}
              </AutoSaveStatus>
            </div>
            <ProgressBarStyled>
              <ProgressFill progress={calculateProgress()} />
            </ProgressBarStyled>
          </ProgressSection>
        </div>
        <InputAndTitle
          title="미션 제목"
          errorMessage={
            title.length > 100
              ? "제목이 너무 깁니다. 100자 이내로 작성해주세요."
              : ""
          }
        >
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="학년 미션 제목을 입력해주세요."
          />
        </InputAndTitle>

        {/* Modern Mission Interface */}
        {isModernMission && questions ? (
          <ModernMissionSection>
            <QuestionsContainer>
              {questions
                .sort(
                  (a, b) => (a.question_order || 0) - (b.question_order || 0)
                )
                .map((question, index) => renderQuestionInput(question, index))}
            </QuestionsContainer>
          </ModernMissionSection>
        ) : (
          /* Legacy Mission Interface */
          <LegacyMissionSection>
            <Tiptap
              placeholder={
                updateData?.content ||
                missionInstance?.mission.description ||
                "미션가이드에 따라 미션을 완료해주세요."
              }
              content={content}
              onChange={(value) => {
                setContent(value);
              }}
              inputHeight="250px"
            />
          </LegacyMissionSection>
        )}

        {isTeamMission && (
          <TeamSelectSection>
            <Text variant="body" color="grey-700" fontWeight="bold">
              과제 수행 팀 : {teamData?.team?.name}
            </Text>
            {teamData?.members && teamData.members.length <= 1 ? (
              <EmptyTeamMessage>
                <Text variant="body" color="grey-500">
                  팀원이 없습니다. 팀원을 초대해주세요.
                </Text>
              </EmptyTeamMessage>
            ) : (
              <StlyedSelect
                defaultValues={selectedTeamMembers || []}
                isDisabled={true}
                options={teamData?.members.map((member) => ({
                  label: `${member.profiles?.first_name || ""} ${
                    member.profiles?.last_name || ""
                  }`,
                  value: member.user_id,
                }))}
              />
            )}
          </TeamSelectSection>
        )}
      </div>
      {/* 팀 미션인 경우 팀원 선택 컴포넌트 추가 */}

      <BottomSpacing />

      <FloatingButton
        onClick={() => {
          if (updateData) {
            // Create a mock event for handleUpdate
            const mockEvent = { preventDefault: () => {} } as React.MouseEvent;
            handleUpdate(mockEvent);
          } else {
            handleSubmit(missionInstance as any);
          }
        }}
        position="center"
      >
        {isSubmitting ? <Spinner /> : updateData ? "수정완료" : "제출"}
      </FloatingButton>
    </MissionContainer>
  );
}

const MissionContainer = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: var(--breakpoint-tablet);
  margin: 0 auto;
  .mission-container {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .mission-header {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
`;

const TeamSelectSection = styled.div`
  display: flex;
  margin-top: 16px;
  flex-direction: column;
  gap: 8px;
  background-color: var(--grey-100);
  border-radius: 8px;

  .help-text {
    color: var(--grey-500);
    margin-bottom: 8px;
  }
`;

const EmptyTeamMessage = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 50px;
  background-color: var(--grey-100);
  border-radius: 8px;
`;

const ProgressSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px;
  background: var(--grey-50);
  border-radius: 6px;
  border: 1px solid var(--grey-200);
`;

const ModernMissionSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const LegacyMissionSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const QuestionsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 100%;
`;

const AutoSaveStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const ProgressBarStyled = styled.div`
  width: 100%;
  height: 8px;
  background: var(--grey-200);
  border-radius: 4px;
  overflow: hidden;
`;

const ProgressFill = styled.div<{ progress: number }>`
  height: 100%;
  background: var(--primary-500);
  width: ${(props) => props.progress}%;
  transition: width 0.3s ease;
  border-radius: 4px;
`;
