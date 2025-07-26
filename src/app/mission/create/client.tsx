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
import { useEffect, useState } from "react";
import { 
  updateMission, 
  createMission, 
  createMissionWithQuestions,
  getMissionWithQuestions 
} from "@/utils/data/mission";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import QuestionBuilder from "@/components/mission/QuestionBuilder/QuestionBuilder";
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
              placeholder_text: q.placeholder_text,
              required_image: q.required_image,
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

  // Initialize form with mission type
  useEffect(() => {
    const initialType = editMissionData?.mission_type || 'essay';
    setMissionType(initialType);
    setValue('mission_type', convertMissionType(initialType) as 'essay' | 'multiple_choice' | 'image_upload' | 'mixed');
  }, [editMissionData?.mission_type, setValue]);

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
      <div className="input-container">
        <Heading level={3}>미션 {editMissionData ? "수정" : "생성"}</Heading>
        <InputAndTitle title="미션 이름" errorMessage={errors.name?.message}>
          <Input {...register("name")} placeholder="미션 이름을 입력해주세요." />
        </InputAndTitle>
        <InputAndTitle title="미션 점수" errorMessage={errors.points?.message}>
          <Input
            {...register("points", {
              valueAsNumber: true,
            })}
            placeholder="미션 점수를 입력해주세요.(숫자)"
          />
        </InputAndTitle>
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
          <Text variant="body" fontWeight="bold">미션 생성 방식</Text>
          <ModeToggleContainer>
            <ModeToggleButton 
              active={!useQuestionBuilder}
              onClick={() => setUseQuestionBuilder(false)}
            >
              간단 모드
              <Text variant="caption" color="var(--grey-600)">
                기존 방식 (설명만)
              </Text>
            </ModeToggleButton>
            <ModeToggleButton 
              active={useQuestionBuilder}
              onClick={() => setUseQuestionBuilder(true)}
            >
              고급 모드
              <Text variant="caption" color="var(--grey-600)">
                질문 빌더 사용
              </Text>
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
            <Text variant="body" fontWeight="bold">질문 설정</Text>
            <div style={{ marginBottom: '12px' }}>
              <Text variant="caption" color="var(--grey-600)">
                질문을 추가하여 구조화된 미션을 만들어보세요. 다양한 유형의 질문을 조합할 수 있습니다.
              </Text>
            </div>
            {isLoadingQuestions ? (
              <LoadingContainer>
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
      <Button variant="flat" onClick={handleSubmit(onSubmit)}>
        미션 {editMissionData ? "수정" : "생성"}
      </Button>
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
  justify-content: space-between;
  min-height: calc(100vh - 100px);

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
  gap: 12px;
`;

const ModeToggleContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  border: 1px solid var(--grey-200);
  border-radius: 8px;
  padding: 4px;
  background: var(--grey-50);
`;

const ModeToggleButton = styled.button<{ active: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 8px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  background: ${props => props.active ? 'var(--primary-500)' : 'transparent'};
  color: ${props => props.active ? 'white' : 'var(--grey-700)'};
  
  &:hover {
    background: ${props => props.active ? 'var(--primary-600)' : 'var(--grey-100)'};
  }
  
  > div:last-child {
    color: ${props => props.active ? 'rgba(255,255,255,0.8)' : 'var(--grey-600)'};
  }
`;

const QuestionBuilderSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  border: 1px solid var(--grey-200);
  border-radius: 8px;
  background: var(--grey-50);
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px;
  background: white;
  border-radius: 8px;
  border: 1px solid var(--grey-200);
`;
