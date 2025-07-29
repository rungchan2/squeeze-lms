"use client";

import { useState } from "react";
import styled from "@emotion/styled";
import Tiptap from "@/components/richTextInput/RichTextEditor";
import Text from "@/components/Text/Text";
import { MissionQuestion } from "@/types";
import RichTextViewer from "@/components/richTextInput/RichTextViewer";

interface EssayQuestionInputProps {
  question: MissionQuestion;
  questionIndex: number;
  initialValue?: string;
  onChange: (questionId: string, answer: string) => void;
  onValidation?: (questionId: string, isValid: boolean) => void;
}

export default function EssayQuestionInput({
  question,
  questionIndex,
  initialValue = "",
  onChange,
  onValidation,
}: EssayQuestionInputProps) {
  const [answer, setAnswer] = useState(initialValue);

  const handleChange = (value: string) => {
    setAnswer(value);
    onChange(question.id, value);
    
    // Basic validation
    const isValid = value.trim().length > 0;
    onValidation?.(question.id, isValid);
  };

  const characterCount = answer.replace(/<[^>]*>?/g, "").length;
  const maxCharacters = question.max_characters || 1000;
  const isOverLimit = characterCount > maxCharacters;

  return (
    <QuestionContainer>
      <QuestionHeader>
        <QuestionNumber>질문 {questionIndex + 1}</QuestionNumber>
        <QuestionText>
          <RichTextViewer content={question.question_text} />
        </QuestionText>
        {question.is_required && (
          <RequiredMark>
            <Text variant="caption" color="var(--negative-500)">*필수</Text>
          </RequiredMark>
        )}
      </QuestionHeader>

      <AnswerSection>
        <Tiptap
          placeholder={question.placeholder_text || "답변을 입력해주세요..."}
          content={answer}
          onChange={handleChange}
          inputHeight="200px"
        />
        
        <CharacterCounter isOverLimit={isOverLimit}>
          <Text variant="caption" color={isOverLimit ? "var(--negative-500)" : "var(--grey-500)"}>
            {characterCount} / {maxCharacters} 글자
          </Text>
        </CharacterCounter>
      </AnswerSection>

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
  margin-bottom: 12px;
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

const RequiredMark = styled.div`
  width: fit-content;
`;

const AnswerSection = styled.div`
  margin-bottom: 8px;
`;

const CharacterCounter = styled.div<{ isOverLimit: boolean }>`
  display: flex;
  justify-content: flex-end;
  margin-top: 4px;
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