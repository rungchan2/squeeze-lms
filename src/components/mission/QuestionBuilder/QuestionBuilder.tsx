"use client";

import { useState, useCallback, useEffect } from "react";
import styled from "@emotion/styled";
import { FaPlus } from "react-icons/fa";
import Button from "@/components/common/Button";
import Text from "@/components/Text/Text";
import QuestionItem from "./QuestionItem";
import { 
  CreateMissionQuestion,
  defaultQuestionTemplates
} from "@/types/missionQuestions";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

interface QuestionBuilderProps {
  questions: CreateMissionQuestion[];
  onChange: (questions: CreateMissionQuestion[]) => void;
  missionId?: string;
}

export default function QuestionBuilder({ 
  questions, 
  onChange, 
  missionId 
}: QuestionBuilderProps) {
  const [localQuestions, setLocalQuestions] = useState<
    (CreateMissionQuestion & { tempId?: string })[]
  >([]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Initialize questions with temporary IDs for UI management
  useEffect(() => {
    const questionsWithTempIds = questions.map((q, index) => ({
      ...q,
      tempId: `temp-${index}-${Date.now()}`,
    }));
    setLocalQuestions(questionsWithTempIds);
  }, [questions]);

  // Sync local changes back to parent
  const syncToParent = useCallback((newQuestions: (CreateMissionQuestion & { tempId?: string })[]) => {
    const cleanQuestions = newQuestions.map(({ tempId, ...q }) => ({
      ...q,
      question_order: newQuestions.findIndex(item => item.tempId === tempId) + 1,
    }));
    onChange(cleanQuestions);
  }, [onChange]);

  const addQuestionFromTemplate = (type: keyof typeof defaultQuestionTemplates) => {
    const template = defaultQuestionTemplates[type];
    const newQuestion: CreateMissionQuestion & { tempId?: string } = {
      ...template,
      mission_id: missionId || '',
      question_order: localQuestions.length + 1,
      tempId: `temp-${Date.now()}`,
    };

    const newQuestions = [...localQuestions, newQuestion];
    setLocalQuestions(newQuestions);
    syncToParent(newQuestions);
  };

  const updateQuestion = (index: number, updates: Partial<CreateMissionQuestion>) => {
    const newQuestions = [...localQuestions];
    newQuestions[index] = { ...newQuestions[index], ...updates };
    setLocalQuestions(newQuestions);
    syncToParent(newQuestions);
  };

  const deleteQuestion = (index: number) => {
    const newQuestions = localQuestions.filter((_, i) => i !== index);
    setLocalQuestions(newQuestions);
    syncToParent(newQuestions);
  };

  const duplicateQuestion = (index: number) => {
    const questionToDuplicate = localQuestions[index];
    const duplicatedQuestion: CreateMissionQuestion & { tempId?: string } = {
      ...questionToDuplicate,
      question_text: `${questionToDuplicate.question_text} (복사본)`,
      question_order: localQuestions.length + 1,
      tempId: `temp-${Date.now()}`,
    };

    const newQuestions = [...localQuestions, duplicatedQuestion];
    setLocalQuestions(newQuestions);
    syncToParent(newQuestions);
  };

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = localQuestions.findIndex(
        (question) => question.tempId === active.id
      );
      const newIndex = localQuestions.findIndex(
        (question) => question.tempId === over.id
      );

      const newQuestions = arrayMove(localQuestions, oldIndex, newIndex);
      setLocalQuestions(newQuestions);
      syncToParent(newQuestions);
    }
  }, [localQuestions, syncToParent]);


  const getTotalPoints = () => {
    return localQuestions.reduce((total, q) => total + (q.points || 0), 0);
  };

  const getRequiredQuestionsCount = () => {
    return localQuestions.filter(q => q.is_required).length;
  };

  return (
    <QuestionBuilderContainer>
      <BuilderHeader>
        <HeaderInfo>
          <Text variant="body" fontWeight="bold">질문 목록</Text>
          <StatsRow>
            <StatItem>
              <Text variant="caption" color="var(--grey-600)">
                총 {localQuestions.length}개 질문
              </Text>
            </StatItem>
            <StatItem>
              <Text variant="caption" color="var(--grey-600)">
                필수 {getRequiredQuestionsCount()}개
              </Text>
            </StatItem>
            <StatItem>
              <Text variant="caption" color="var(--grey-600)">
                총 {getTotalPoints()}점
              </Text>
            </StatItem>
          </StatsRow>
        </HeaderInfo>
      </BuilderHeader>

      <QuestionsContainer>
        {localQuestions.length === 0 ? (
          <EmptyState>
            <div style={{ textAlign: 'center' }}>
              <Text variant="body" color="var(--grey-500)">
                아직 질문이 없습니다.<br />
                아래 버튼을 눌러 첫 번째 질문을 추가해보세요.
              </Text>
            </div>
          </EmptyState>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={localQuestions.map((q) => q.tempId || "")}
              strategy={verticalListSortingStrategy}
            >
              {localQuestions.map((question, index) => (
                <QuestionItem
                  key={question.tempId}
                  question={question}
                  index={index}
                  onUpdate={updateQuestion}
                  onDelete={deleteQuestion}
                  onDuplicate={duplicateQuestion}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </QuestionsContainer>

      <AddQuestionSection>
        <div style={{ marginBottom: '8px' }}>
          <Text variant="caption" color="var(--grey-600)">
            새 질문 추가
          </Text>
        </div>
        <AddQuestionGrid>
          <AddQuestionButton 
            onClick={() => addQuestionFromTemplate('essay')}
            variant="outline"
          >
            <FaPlus />
            주관식
          </AddQuestionButton>
          <AddQuestionButton 
            onClick={() => addQuestionFromTemplate('multiple_choice')}
            variant="outline"
          >
            <FaPlus />
            객관식
          </AddQuestionButton>
          <AddQuestionButton 
            onClick={() => addQuestionFromTemplate('image_upload')}
            variant="outline"
          >
            <FaPlus />
            이미지
          </AddQuestionButton>
          <AddQuestionButton 
            onClick={() => addQuestionFromTemplate('mixed')}
            variant="outline"
          >
            <FaPlus />
            복합형
          </AddQuestionButton>
        </AddQuestionGrid>
      </AddQuestionSection>
    </QuestionBuilderContainer>
  );
}

const QuestionBuilderContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
`;

const BuilderHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 16px;
  background: var(--grey-50);
  border-radius: 8px;
  border: 1px solid var(--grey-200);
`;

const HeaderInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const StatsRow = styled.div`
  display: flex;
  gap: 16px;
`;

const StatItem = styled.div`
  display: flex;
  align-items: center;
`;

const QuestionsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const EmptyState = styled.div`
  padding: 40px 20px;
  background: var(--grey-50);
  border-radius: 8px;
  border: 2px dashed var(--grey-300);
`;

const AddQuestionSection = styled.div`
  margin-top: 16px;
`;

const AddQuestionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 8px;
  
  @media (max-width: 600px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const AddQuestionButton = styled(Button)`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  min-height: 44px;
  font-size: 13px;
  border: 1px dashed var(--primary-300);
  color: var(--primary-600);
  background: var(--primary-50);
  
  &:hover {
    background: var(--primary-100);
    border-color: var(--primary-400);
  }
`;