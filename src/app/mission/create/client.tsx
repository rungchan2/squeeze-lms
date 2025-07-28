"use client";

import { CreateMission, Mission, missionTypeEnum } from "@/types";
import { CreateMissionQuestion } from "@/types/missionQuestions";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createMissionSchema } from "@/types";
import InputAndTitle from "@/components/InputAndTitle";
import { createListCollection, Input, Portal, Select } from "@chakra-ui/react";
import Button from "@/components/common/Button";
import styled from "@emotion/styled";
import Heading from "@/components/Text/Heading";
import Text from "@/components/Text/Text";
import { toaster } from "@/components/ui/toaster";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { 
  updateMission, 
  createMission, 
  createMissionWithQuestions,
  getMissionWithQuestions 
} from "@/utils/data/mission";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import QuestionBuilder from "@/components/mission/QuestionBuilder/QuestionBuilder";
import BackButton from "@/components/common/BackButton";
import Spinner from "@/components/common/Spinner";
import { Stack, Flex } from "@chakra-ui/react";
import { FloatingButton } from "@/components/common/FloatingButton";
import { Spacing } from "@/components/common/Spacing";

export default function NewMissionPage({ editMissionData }: { editMissionData?: Mission }) {
  const router = useRouter();
  const { role } = useSupabaseAuth();
  const [missionType, setMissionType] = useState<string>(editMissionData?.mission_type || 'essay');
  const [useQuestionBuilder, setUseQuestionBuilder] = useState<boolean>(false);
  const [questions, setQuestions] = useState<CreateMissionQuestion[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  
  useEffect(() => {
    if (role === "user") {
      router.push("/");
      toaster.create({
        title: "권한이 없습니다.",
        type: "error",
      });
    }
  }, [role, router]);

  // Load existing questions for edit mode
  useEffect(() => {
    const loadExistingQuestions = async () => {
      if (editMissionData?.id) {
        setIsLoadingQuestions(true);
        try {
          const { data: missionWithQuestions } = await getMissionWithQuestions(editMissionData.id);
          if (missionWithQuestions?.questions && missionWithQuestions.questions.length > 0) {
            setQuestions(missionWithQuestions.questions.map(q => ({
              mission_id: editMissionData.id, // Add mission_id for CreateMissionQuestion type
              question_text: q.question_text,
              question_type: q.question_type,
              question_order: q.question_order,
              options: q.options,
              correct_answer: q.correct_answer,
              max_images: q.max_images,
              points: q.points,
              is_required: q.is_required,
              max_characters: q.max_characters,
              min_characters: q.min_characters || null,
              placeholder_text: q.placeholder_text,
              required_image: q.required_image,
              multiple_select: q.multiple_select || false,
            })));
            setUseQuestionBuilder(true);
          }
        } catch (error) {
          console.error('Error loading questions:', error);
        } finally {
          setIsLoadingQuestions(false);
        }
      }
    };

    loadExistingQuestions();
  }, [editMissionData?.id]);

  // Helper function to convert mission type for API
  const convertMissionType = (type: string): string => {
    // Handle legacy types
    const legacyTypeMapping: Record<string, string> = {
      'text': 'essay',
      'image': 'image_upload',
      'team': 'essay',
      'individual': 'essay',
      '과제': 'essay'
    };
    
    return legacyTypeMapping[type] || type;
  };
  
  const {
    register,
    setValue,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CreateMission>({
    resolver: zodResolver(createMissionSchema),
    defaultValues: {
      ...editMissionData,
      mission_type: editMissionData?.mission_type || 'essay'
    },
  });

  console.log(errors);

  // Calculate total points from questions
  const totalPoints = useMemo(() => {
    if (!useQuestionBuilder || questions.length === 0) {
      return editMissionData?.points || 100;
    }
    return questions.reduce((sum, question) => sum + (question.points || 0), 0);
  }, [useQuestionBuilder, questions, editMissionData?.points]);

  // Initialize form with mission type
  useEffect(() => {
    const initialType = editMissionData?.mission_type || 'essay';
    setMissionType(initialType);
    setValue('mission_type', convertMissionType(initialType) as 'essay' | 'multiple_choice' | 'image_upload' | 'mixed');
  }, [editMissionData?.mission_type, setValue]);

  // Update points when questions change
  useEffect(() => {
    if (useQuestionBuilder) {
      setValue('points', totalPoints);
    }
  }, [totalPoints, useQuestionBuilder, setValue]);

  const onSubmit = async (data: CreateMission) => {
    console.log('Form submission data:', data);
    console.log('Current missionType state:', missionType);
    
    // Validation
    if (useQuestionBuilder && questions.length === 0) {
      toaster.create({
        title: "최소 1개의 질문을 추가해주세요.",
        type: "error",
      });
      return;
    }

    if (!useQuestionBuilder && (!data.description || data.description.trim() === "")) {
      toaster.create({
        title: "미션 설명을 입력해주세요.",
        type: "error",
      });
      return;
    }

    if (!data.mission_type) {
      toaster.create({
        title: "미션 타입을 선택해주세요.",
        type: "error",
      });
      return;
    }

    try {
      const missionData: CreateMission = {
        ...data,
      };
      
      console.log('Final mission data to submit:', missionData);

      if (editMissionData) {
        // Update existing mission
        const { error: updateError } = await updateMission(editMissionData.id, missionData);
        if (updateError) throw updateError;

        // TODO: Handle question updates for edit mode
        // This would require additional API endpoints for updating questions
      } else {
        // Create new mission
        if (useQuestionBuilder && questions.length > 0) {
          const { error: createError } = await createMissionWithQuestions(missionData, questions);
          if (createError) throw createError;
        } else {
          const { error: createError } = await createMission(missionData);
          if (createError) throw createError;
        }
      }

      toaster.create({
        title: `${editMissionData ? "미션 수정" : "미션 생성"} 성공`,
        type: "success",
      });

      router.back();
    } catch (error: any) {
      console.error('Mission save error:', error);
      toaster.create({
        title: `${editMissionData ? "미션 수정" : "미션 생성"} 실패`,
        description: error.message,
        type: "error",
      });
    }
  };

  const missionTypes = createListCollection({
    items: [
      { label: "주관식 (Essay)", value: "essay" },
      { label: "객관식 (Multiple Choice)", value: "multiple_choice" },
      { label: "이미지 업로드 (Image Upload)", value: "image_upload" },
      { label: "복합형 (Mixed)", value: "mixed" },
      // Legacy types for backward compatibility
      { label: "텍스트 (Legacy)", value: "text" },
      { label: "이미지 (Legacy)", value: "image" },
      { label: "팀 미션 (Legacy)", value: "team" },
    ],
  });

  const handleMissionTypeChange = (value: string) => {
    setMissionType(value);
    const convertedType = convertMissionType(value);
    setValue('mission_type', convertedType as 'essay' | 'multiple_choice' | 'image_upload' | 'mixed');
    
    // Auto-enable question builder for new mission types
    if (['essay', 'multiple_choice', 'image_upload', 'mixed'].includes(value)) {
      setUseQuestionBuilder(true);
    }
  };

  return (
    <NewMissionPageContainer>
      <div className="page-header">
        <BackButton text="" />
        <Heading level={3}>미션 {editMissionData ? "수정" : "생성"}</Heading>
      </div>
      <div className="input-container">
        <Stack direction="row" gap={4} width="100%">
        <InputAndTitle title="미션 이름" errorMessage={errors.name?.message}>
          <Input {...register("name")} placeholder="미션 이름을 입력해주세요." />
        </InputAndTitle>
        <InputAndTitle title="미션 점수" errorMessage={errors.points?.message}>
          {useQuestionBuilder ? (
            <PointsDisplayContainer>
              <PointsDisplay>{totalPoints}점</PointsDisplay>
              <Text variant="caption" color="var(--grey-600)">
                (질문별 점수의 합계)
              </Text>
            </PointsDisplayContainer>
          ) : (
            <Input
              {...register("points", {
                valueAsNumber: true,
              })}
              placeholder="미션 점수를 입력해주세요.(숫자)"
              type="number"
              min={1}
              max={1000}
            />
          )}
        </InputAndTitle>
        </Stack>
        
        <InputAndTitle
          title="미션 타입"
          errorMessage={errors.mission_type?.message}
        >
          <Select.Root
            collection={missionTypes}
            backgroundColor="white"
            value={[missionType]}
            onValueChange={(details) => handleMissionTypeChange(details.value[0])}
          >
            <Select.HiddenSelect />
            <Select.Control>
              <Select.Trigger>
                <Select.ValueText placeholder="미션 타입" />
              </Select.Trigger>
              <Select.IndicatorGroup>
                <Select.Indicator />
              </Select.IndicatorGroup>
            </Select.Control>
            <Portal>
              <Select.Positioner>
                <Select.Content>
                  {missionTypes.items.map((type) => (
                    <Select.Item item={type} key={type.value}>
                      {type.label}
                      <Select.ItemIndicator />
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Positioner>
            </Portal>
          </Select.Root>
        </InputAndTitle>

        <MissionCreationModeContainer>
          <ModeHeaderContainer>
            <Text variant="body" fontWeight="bold">미션 생성 방식</Text>
            <HelpText variant="caption" color="var(--grey-600)">
              미션의 복잡도에 따라 적절한 방식을 선택하세요
            </HelpText>
          </ModeHeaderContainer>
          <ModeToggleContainer>
            <ModeToggleButton 
              active={!useQuestionBuilder}
              onClick={() => setUseQuestionBuilder(false)}
            >
              <ModeIconContainer>📝</ModeIconContainer>
              <ModeTitle>간단 모드</ModeTitle>
              <ModeDescription variant="caption">
                텍스트 설명만으로 미션 생성
              </ModeDescription>
              <ModeFeatures variant="caption">
                • 빠른 생성 • 자유 형식
              </ModeFeatures>
            </ModeToggleButton>
            <ModeToggleButton 
              active={useQuestionBuilder}
              onClick={() => setUseQuestionBuilder(true)}
            >
              <ModeIconContainer>🏗️</ModeIconContainer>
              <ModeTitle>고급 모드</ModeTitle>
              <ModeDescription variant="caption">
                구조화된 질문으로 미션 생성
              </ModeDescription>
              <ModeFeatures variant="caption">
                • 다양한 질문 타입 • 자동 채점
              </ModeFeatures>
            </ModeToggleButton>
          </ModeToggleContainer>
        </MissionCreationModeContainer>
        {!useQuestionBuilder ? (
          <InputAndTitle
            title="미션 설명"
            errorMessage={errors.description?.message}
          >
            <Input
              {...register("description")}
              placeholder="미션가이드에 따라 미션을 완료해주세요."
              as="textarea"
              minH="120px"
              resize="vertical"
            />
          </InputAndTitle>
        ) : (
          <QuestionBuilderSection>
            <QuestionBuilderHeader>
              <Text variant="body" fontWeight="bold">질문 설정</Text>
              <QuestionBuilderHelpContainer>
                <Text variant="caption" color="var(--grey-600)">
                  질문을 추가하여 구조화된 미션을 만들어보세요. 다양한 유형의 질문을 조합할 수 있습니다.
                </Text>
                <QuestionTypeGuide>
                  <GuideItem>
                    <GuideIcon>📝</GuideIcon>
                    <Text variant="caption" color="var(--grey-700)">주관식: 자유로운 텍스트 답변</Text>
                  </GuideItem>
                  <GuideItem>
                    <GuideIcon>☑️</GuideIcon>
                    <Text variant="caption" color="var(--grey-700)">객관식: 선택지 중 정답 선택</Text>
                  </GuideItem>
                  <GuideItem>
                    <GuideIcon>🖼️</GuideIcon>
                    <Text variant="caption" color="var(--grey-700)">이미지: 사진 업로드 답변</Text>
                  </GuideItem>
                  <GuideItem>
                    <GuideIcon>🔄</GuideIcon>
                    <Text variant="caption" color="var(--grey-700)">복합형: 텍스트 + 이미지</Text>
                  </GuideItem>
                </QuestionTypeGuide>
              </QuestionBuilderHelpContainer>
            </QuestionBuilderHeader>
            {isLoadingQuestions ? (
              <LoadingContainer>
                <Spinner />
                <Text>기존 질문을 불러오는 중...</Text>
              </LoadingContainer>
            ) : (
              <QuestionBuilder
                questions={questions}
                onChange={setQuestions}
                missionId={editMissionData?.id}
              />
            )}
          </QuestionBuilderSection>
        )}
      </div>
      <Spacing />
      <FloatingButton onClick={handleSubmit(onSubmit)} position="center">
        미션 {editMissionData ? "수정" : "생성"}
      </FloatingButton>
    </NewMissionPageContainer>
  );
}

const NewMissionPageContainer = styled.div`
  max-width: var(--breakpoint-tablet);
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  min-height: calc(100vh - 100px);

  .page-header {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    padding: 16px 0 16px 0;
    gap: 16px;
    border-bottom: 1px solid var(--grey-200);
    width: 100%;
    
    @media (max-width: 768px) {
      padding: 12px;
    }
  }

  .input-container {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    width: 100%;
  }
`;

const MissionCreationModeContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const ModeHeaderContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const HelpText = styled(Text)`
  font-style: italic;
`;

const ModeToggleContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 8px;
  }
`;

const ModeToggleButton = styled.button<{ active: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px 16px;
  border: 2px solid ${props => props.active ? 'var(--primary-500)' : 'var(--grey-200)'};
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  background: ${props => props.active ? 'var(--primary-50)' : 'white'};
  box-shadow: ${props => props.active ? '0 4px 12px rgba(59, 130, 246, 0.15)' : '0 2px 4px rgba(0, 0, 0, 0.05)'};
  
  &:hover {
    border-color: ${props => props.active ? 'var(--primary-600)' : 'var(--primary-300)'};
    transform: translateY(-2px);
    box-shadow: ${props => props.active ? '0 6px 16px rgba(59, 130, 246, 0.2)' : '0 4px 8px rgba(0, 0, 0, 0.1)'};
  }
`;

const ModeIconContainer = styled.div`
  font-size: 32px;
  margin-bottom: 4px;
`;

const ModeTitle = styled(Text)`
  font-weight: 600;
  font-size: 16px;
  color: var(--grey-900);
  margin-bottom: 4px;
`;

const ModeDescription = styled(Text)`
  color: var(--grey-600);
  text-align: center;
  margin-bottom: 8px;
`;

const ModeFeatures = styled(Text)`
  color: var(--grey-500);
  font-size: 12px;
  text-align: center;
`;

const QuestionBuilderSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  border: 2px solid var(--primary-200);
  border-radius: 12px;
  background: linear-gradient(135deg, var(--primary-25) 0%, white 100%);
`;

const QuestionBuilderHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 8px;
`;

const QuestionBuilderHelpContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const QuestionTypeGuide = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 8px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const GuideItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: white;
  border-radius: 8px;
  border: 1px solid var(--grey-200);
`;

const GuideIcon = styled.span`
  font-size: 16px;
  min-width: 20px;
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 12px;
  padding: 40px;
  background: white;
  border-radius: 8px;
  border: 1px solid var(--grey-200);
`;

const PointsDisplayContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: var(--grey-50);
  border: 1px solid var(--grey-200);
  border-radius: 6px;
`;

const PointsDisplay = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: var(--primary-600);
`;
