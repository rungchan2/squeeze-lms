"use client";

import { useState } from "react";
import { Input, Textarea } from "@chakra-ui/react";
import styled from "@emotion/styled";
import { FaGripVertical, FaTrash, FaCopy, FaPlus, FaCheck, FaTimes } from "react-icons/fa";
import { IconContainer } from "@/components/common/IconContainer";
import Text from "@/components/Text/Text";
import Button from "@/components/common/Button";
import { 
  CreateMissionQuestion,
  MultipleChoiceOption
} from "@/types/missionQuestions";
import { createListCollection, Portal, Select } from "@chakra-ui/react";
import {
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface QuestionItemProps {
  question: CreateMissionQuestion & { tempId?: string };
  index: number;
  onUpdate: (index: number, updates: Partial<CreateMissionQuestion>) => void;
  onDelete: (index: number) => void;
  onDuplicate: (index: number) => void;
  onMove?: (fromIndex: number, toIndex: number) => void;
}

export default function QuestionItem({
  question,
  index,
  onUpdate,
  onDelete,
  onDuplicate,
}: QuestionItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.tempId || "" });

  const questionTypes = createListCollection({
    items: [
      { label: "주관식", value: "essay" },
      { label: "객관식", value: "multiple_choice" },
      { label: "이미지 업로드", value: "image_upload" },
      { label: "복합형 (텍스트+이미지)", value: "mixed" },
    ],
  });

  const handleQuestionTypeChange = (value: string) => {
    const newType = value as 'essay' | 'multiple_choice' | 'image_upload' | 'mixed';
    const updates: Partial<CreateMissionQuestion> = {
      question_type: newType,
    };

    // 질문 타입에 따른 기본값 설정
    switch (newType) {
      case 'essay':
        updates.max_characters = 1000;
        updates.placeholder_text = "여기에 답변을 작성해주세요.";
        updates.options = null;
        updates.correct_answer = null;
        updates.max_images = null;
        updates.required_image = null;
        break;
      case 'multiple_choice':
        updates.options = [
          { text: "선택지 1", is_correct: false },
          { text: "선택지 2", is_correct: true },
          { text: "선택지 3", is_correct: false },
        ];
        updates.correct_answer = "선택지 2";
        updates.max_characters = null;
        updates.placeholder_text = null;
        updates.max_images = null;
        updates.required_image = null;
        break;
      case 'image_upload':
        updates.max_images = 3;
        updates.required_image = true;
        updates.options = null;
        updates.correct_answer = null;
        updates.max_characters = null;
        updates.placeholder_text = null;
        break;
      case 'mixed':
        updates.max_characters = 500;
        updates.max_images = 2;
        updates.placeholder_text = "설명을 작성하고 이미지를 첨부해주세요.";
        updates.options = null;
        updates.correct_answer = null;
        updates.required_image = false;
        break;
    }

    onUpdate(index, updates);
  };

  const handleOptionUpdate = (optionIndex: number, updates: Partial<MultipleChoiceOption>) => {
    const currentOptions = (question.options as MultipleChoiceOption[]) || [];
    const newOptions = [...currentOptions];
    newOptions[optionIndex] = { ...newOptions[optionIndex], ...updates };
    
    onUpdate(index, { 
      options: newOptions,
      correct_answer: updates.is_correct ? newOptions[optionIndex].text : question.correct_answer
    });
  };

  const addOption = () => {
    const currentOptions = (question.options as MultipleChoiceOption[]) || [];
    const newOptions = [
      ...currentOptions,
      { text: `선택지 ${currentOptions.length + 1}`, is_correct: false }
    ];
    onUpdate(index, { options: newOptions });
  };

  const removeOption = (optionIndex: number) => {
    const currentOptions = (question.options as MultipleChoiceOption[]) || [];
    if (currentOptions.length <= 2) return; // 최소 2개 유지
    
    const newOptions = currentOptions.filter((_, i) => i !== optionIndex);
    onUpdate(index, { options: newOptions });
  };

  const renderQuestionTypeSettings = () => {
    switch (question.question_type) {
      case 'essay':
        return (
          <SettingsSection>
            <SettingRow>
              <Text variant="caption" fontWeight="bold">최대 글자 수</Text>
              <Input
                type="number"
                value={question.max_characters || 1000}
                onChange={(e) => onUpdate(index, { max_characters: parseInt(e.target.value) })}
                placeholder="1000"
                size="sm"
                width="120px"
              />
            </SettingRow>
            <SettingRow>
              <Text variant="caption" fontWeight="bold">플레이스홀더</Text>
              <Input
                value={question.placeholder_text || ""}
                onChange={(e) => onUpdate(index, { placeholder_text: e.target.value })}
                placeholder="답변 안내 텍스트"
                size="sm"
              />
            </SettingRow>
          </SettingsSection>
        );

      case 'multiple_choice':
        const options = (question.options as MultipleChoiceOption[]) || [];
        return (
          <SettingsSection>
            <Text variant="caption" fontWeight="bold">선택지</Text>
            {options.map((option, optionIndex) => (
              <OptionRow key={optionIndex}>
                <Input
                  value={option.text}
                  onChange={(e) => handleOptionUpdate(optionIndex, { text: e.target.value })}
                  placeholder={`선택지 ${optionIndex + 1}`}
                  size="sm"
                />
                <IconContainer
                  onClick={() => handleOptionUpdate(optionIndex, { is_correct: !option.is_correct })}
                  iconColor={option.is_correct ? "var(--success-500)" : "var(--grey-400)"}
                >
                  <FaCheck />
                </IconContainer>
                {options.length > 2 && (
                  <IconContainer
                    onClick={() => removeOption(optionIndex)}
                    hoverColor="var(--negative-500)"
                  >
                    <FaTimes />
                  </IconContainer>
                )}
              </OptionRow>
            ))}
            <Button
              variant="outline"
              onClick={addOption}
              style={{ alignSelf: "flex-start" }}
            >
              <FaPlus /> 선택지 추가
            </Button>
          </SettingsSection>
        );

      case 'image_upload':
        return (
          <SettingsSection>
            <SettingRow>
              <Text variant="caption" fontWeight="bold">최대 이미지 수</Text>
              <Input
                type="number"
                value={question.max_images || 3}
                onChange={(e) => onUpdate(index, { max_images: parseInt(e.target.value) })}
                placeholder="3"
                size="sm"
                width="120px"
                min="1"
                max="10"
              />
            </SettingRow>
            <SettingRow>
              <Text variant="caption" fontWeight="bold">이미지 필수</Text>
              <input
                type="checkbox"
                checked={question.required_image || false}
                onChange={(e) => onUpdate(index, { required_image: e.target.checked })}
              />
            </SettingRow>
          </SettingsSection>
        );

      case 'mixed':
        return (
          <SettingsSection>
            <SettingRow>
              <Text variant="caption" fontWeight="bold">최대 글자 수</Text>
              <Input
                type="number"
                value={question.max_characters || 500}
                onChange={(e) => onUpdate(index, { max_characters: parseInt(e.target.value) })}
                placeholder="500"
                size="sm"
                width="120px"
              />
            </SettingRow>
            <SettingRow>
              <Text variant="caption" fontWeight="bold">최대 이미지 수</Text>
              <Input
                type="number"
                value={question.max_images || 2}
                onChange={(e) => onUpdate(index, { max_images: parseInt(e.target.value) })}
                placeholder="2"
                size="sm"
                width="120px"
                min="1"
                max="10"
              />
            </SettingRow>
            <SettingRow>
              <Text variant="caption" fontWeight="bold">플레이스홀더</Text>
              <Input
                value={question.placeholder_text || ""}
                onChange={(e) => onUpdate(index, { placeholder_text: e.target.value })}
                placeholder="답변 안내 텍스트"
                size="sm"
              />
            </SettingRow>
          </SettingsSection>
        );

      default:
        return null;
    }
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <QuestionItemContainer ref={setNodeRef} style={style}>
      <QuestionHeader>
        <HeaderLeft>
          <DragHandle {...attributes} {...listeners}>
            <FaGripVertical />
          </DragHandle>
          <QuestionNumber>질문 {index + 1}</QuestionNumber>
        </HeaderLeft>
        <HeaderRight>
          <IconContainer onClick={() => onDuplicate(index)}>
            <FaCopy />
          </IconContainer>
          <IconContainer 
            onClick={() => onDelete(index)} 
            hoverColor="var(--negative-500)"
          >
            <FaTrash />
          </IconContainer>
        </HeaderRight>
      </QuestionHeader>

      <QuestionContent>
        <QuestionBasicSettings>
          <QuestionTextArea>
            <Textarea
              value={question.question_text}
              onChange={(e) => onUpdate(index, { question_text: e.target.value })}
              placeholder="질문을 입력해주세요"
              size="sm"
              resize="vertical"
              minH="80px"
            />
          </QuestionTextArea>
          
          <QuestionMetaRow>
            <Select.Root
              collection={questionTypes}
              value={[question.question_type]}
              onValueChange={(details) => handleQuestionTypeChange(details.value[0])}
              size="sm"
            >
              <Select.HiddenSelect />
              <Select.Control>
                <Select.Trigger>
                  <Select.ValueText placeholder="질문 타입" />
                </Select.Trigger>
                <Select.IndicatorGroup>
                  <Select.Indicator />
                </Select.IndicatorGroup>
              </Select.Control>
              <Portal>
                <Select.Positioner>
                  <Select.Content>
                    {questionTypes.items.map((type) => (
                      <Select.Item item={type} key={type.value}>
                        {type.label}
                        <Select.ItemIndicator />
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Positioner>
              </Portal>
            </Select.Root>

            <PointsInput>
              <Input
                type="number"
                value={question.points || 100}
                onChange={(e) => onUpdate(index, { points: parseInt(e.target.value) })}
                placeholder="점수"
                size="sm"
                width="80px"
                min="0"
              />
              <Text variant="caption">점</Text>
            </PointsInput>

            <RequiredCheckbox>
              <input
                type="checkbox"
                checked={question.is_required || false}
                onChange={(e) => onUpdate(index, { is_required: e.target.checked })}
              />
              <Text variant="caption">필수</Text>
            </RequiredCheckbox>
          </QuestionMetaRow>
        </QuestionBasicSettings>

        <AdvancedToggle
          onClick={() => setIsExpanded(!isExpanded)}
          isExpanded={isExpanded}
        >
          {isExpanded ? "간단히 보기" : "세부 설정"}
        </AdvancedToggle>

        {isExpanded && renderQuestionTypeSettings()}
      </QuestionContent>
    </QuestionItemContainer>
  );
}

const QuestionItemContainer = styled.div`
  border: 1px solid var(--grey-200);
  border-radius: 8px;
  background: white;
  overflow: hidden;
`;

const QuestionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: var(--grey-50);
  border-bottom: 1px solid var(--grey-200);
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const DragHandle = styled.div`
  color: var(--grey-400);
  cursor: grab;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s;
  
  &:hover {
    color: var(--primary-500);
    background: var(--grey-100);
  }
  
  &:active {
    cursor: grabbing;
  }
`;

const QuestionNumber = styled.div`
  font-weight: 600;
  color: var(--grey-700);
  font-size: 14px;
`;

const QuestionContent = styled.div`
  padding: 16px;
`;

const QuestionBasicSettings = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const QuestionTextArea = styled.div`
  width: 100%;
`;

const QuestionMetaRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
`;

const PointsInput = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const RequiredCheckbox = styled.label`
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
`;

const AdvancedToggle = styled.button<{ isExpanded: boolean }>`
  margin-top: 12px;
  padding: 8px 12px;
  background: none;
  border: 1px solid var(--grey-300);
  border-radius: 4px;
  color: var(--primary-600);
  font-size: 12px;
  cursor: pointer;
  align-self: flex-start;
  
  &:hover {
    background: var(--grey-50);
  }
`;

const SettingsSection = styled.div`
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--grey-200);
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const SettingRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  
  > div:first-of-type {
    min-width: 100px;
  }
`;

const OptionRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  
  > input {
    flex: 1;
  }
`;