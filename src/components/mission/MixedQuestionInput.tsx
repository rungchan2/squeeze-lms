"use client";

import { useState } from "react";
import styled from "@emotion/styled";
import Text from "@/components/Text/Text";
import { MissionQuestion } from "@/types";
import EssayQuestionInput from "./EssayQuestionInput";
import ImageUploadInput from "./ImageUploadInput";

interface MixedQuestionInputProps {
  question: MissionQuestion;
  questionIndex: number;
  initialValue?: {
    text?: string;
    images?: string[];
  };
  onChange: (questionId: string, answer: { text?: string; images?: string[] }) => void;
  onValidation?: (questionId: string, isValid: boolean) => void;
}

export default function MixedQuestionInput({
  question,
  questionIndex,
  initialValue = {},
  onChange,
  onValidation,
}: MixedQuestionInputProps) {
  const [textAnswer, setTextAnswer] = useState(initialValue.text || "");
  const [imageAnswers, setImageAnswers] = useState<string[]>(initialValue.images || []);
  const [textValid, setTextValid] = useState(false);
  const [imageValid, setImageValid] = useState(true);

  const handleTextChange = (questionId: string, text: string) => {
    setTextAnswer(text);
    updateAnswer(text, imageAnswers);
  };

  const handleImageChange = (questionId: string, images: string[]) => {
    setImageAnswers(images);
    updateAnswer(textAnswer, images);
  };

  const handleTextValidation = (questionId: string, isValid: boolean) => {
    setTextValid(isValid);
    validateOverall(isValid, imageValid);
  };

  const handleImageValidation = (questionId: string, isValid: boolean) => {
    setImageValid(isValid);
    validateOverall(textValid, isValid);
  };

  const updateAnswer = (text: string, images: string[]) => {
    onChange(question.id, { text, images });
  };

  const validateOverall = (textIsValid: boolean, imageIsValid: boolean) => {
    // For mixed questions, usually at least one component should have content
    const isValid = question.is_required 
      ? (textIsValid || imageIsValid)
      : true;
    onValidation?.(question.id, isValid);
  };

  // Create virtual questions for sub-components
  const textQuestion: MissionQuestion = {
    ...question,
    id: `${question.id}_text`,
    question_type: 'essay',
    question_text: `${question.question_text} (텍스트 답변)`,
    is_required: false, // Individual components are not required for mixed
  };

  const imageQuestion: MissionQuestion = {
    ...question,
    id: `${question.id}_image`,
    question_type: 'image_upload',
    question_text: `${question.question_text} (이미지 첨부)`,
    is_required: false, // Individual components are not required for mixed
  };

  return (
    <QuestionContainer>
      <QuestionHeader>
        <QuestionNumber>질문 {questionIndex + 1}</QuestionNumber>
        <QuestionText>
          <Text variant="body" fontWeight="bold">
            {question.question_text}
          </Text>
        </QuestionText>
        <QuestionSubtext>
          <Text variant="caption" color="var(--grey-600)">
            텍스트와 이미지를 모두 활용하여 답변해주세요.
          </Text>
        </QuestionSubtext>
        {question.is_required && (
          <RequiredMark>
            <Text variant="caption" color="var(--negative-500)">*필수 (텍스트 또는 이미지 중 하나 이상)</Text>
          </RequiredMark>
        )}
      </QuestionHeader>

      <ComponentsContainer>
        <ComponentSection>
          <SectionTitle>
            <Text variant="body" fontWeight="bold" color="var(--primary-600)">
              📝 텍스트 답변
            </Text>
          </SectionTitle>
          <EssayQuestionInput
            question={textQuestion}
            questionIndex={0} // Override since this is a sub-component
            initialValue={textAnswer}
            onChange={handleTextChange}
            onValidation={handleTextValidation}
          />
        </ComponentSection>

        <ComponentSection>
          <SectionTitle>
            <Text variant="body" fontWeight="bold" color="var(--primary-600)">
              📷 이미지 첨부
            </Text>
          </SectionTitle>
          <ImageUploadInput
            question={imageQuestion}
            questionIndex={0} // Override since this is a sub-component
            initialValue={imageAnswers}
            onChange={handleImageChange}
            onValidation={handleImageValidation}
          />
        </ComponentSection>
      </ComponentsContainer>

      {question.points && (
        <PointsDisplay>
          <Text variant="caption" color="var(--primary-600)">
            {question.points}점
          </Text>
        </PointsDisplay>
      )}
    </QuestionContainer>
  );
}

const QuestionContainer = styled.div`
  border: 1px solid var(--grey-200);
  border-radius: 8px;
  padding: 16px;
  background: var(--white);
  margin-bottom: 16px;
`;

const QuestionHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
`;

const QuestionNumber = styled.div`
  background: var(--primary-100);
  color: var(--primary-700);
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
  width: fit-content;
`;

const QuestionText = styled.div`
  margin: 4px 0;
`;

const QuestionSubtext = styled.div``;

const RequiredMark = styled.div`
  width: fit-content;
`;

const ComponentsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 16px;
`;

const ComponentSection = styled.div`
  border-left: 3px solid var(--primary-200);
`;

const SectionTitle = styled.div`
  margin-bottom: 8px;
`;

const PointsDisplay = styled.div`
  display: flex;
  justify-content: flex-end;
  padding: 4px 8px;
  background: var(--primary-50);
  border-radius: 4px;
  width: fit-content;
  margin-left: auto;
`;