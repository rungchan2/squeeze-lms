"use client";

import { useState } from "react";
import styled from "@emotion/styled";
import Text from "@/components/Text/Text";
import { MissionQuestion } from "@/types";

interface MultipleChoiceInputProps {
  question: MissionQuestion;
  questionIndex: number;
  initialValue?: string | string[];
  onChange: (questionId: string, answer: string | string[]) => void;
  onValidation?: (questionId: string, isValid: boolean) => void;
}

export default function MultipleChoiceInput({
  question,
  questionIndex,
  initialValue,
  onChange,
  onValidation,
}: MultipleChoiceInputProps) {
  const [selectedAnswers, setSelectedAnswers] = useState<string | string[]>(
    initialValue || (question.multiple_select ? [] : "")
  );

  const options = Array.isArray(question.options) 
    ? question.options.map(opt => 
        typeof opt === 'object' && opt !== null && 'text' in opt 
          ? opt.text 
          : String(opt)
      )
    : typeof question.options === 'object' && question.options !== null
    ? Object.values(question.options).map(opt => 
        typeof opt === 'object' && opt !== null && 'text' in opt 
          ? opt.text 
          : String(opt)
      )
    : [];

  const handleChange = (value: string | string[]) => {
    setSelectedAnswers(value);
    onChange(question.id, value);
    
    // Validation
    const isValid = question.multiple_select 
      ? Array.isArray(value) && value.length > 0
      : Boolean(value);
    onValidation?.(question.id, isValid);
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
            {question.multiple_select ? "복수 선택 가능" : "단일 선택"}
          </Text>
        </QuestionSubtext>
        {question.is_required && (
          <RequiredMark>
            <Text variant="caption" color="var(--negative-500)">*필수</Text>
          </RequiredMark>
        )}
      </QuestionHeader>

      <OptionsSection>
        {question.multiple_select ? (
          <OptionsContainer>
            {options.map((option, index) => (
              <OptionItem key={index}>
                <OptionInput>
                  <input
                    type="checkbox"
                    value={option}
                    checked={Array.isArray(selectedAnswers) && selectedAnswers.includes(option)}
                    onChange={(e) => {
                      const value = e.target.value;
                      const currentValues = Array.isArray(selectedAnswers) ? selectedAnswers : [];
                      if (e.target.checked) {
                        handleChange([...currentValues, value]);
                      } else {
                        handleChange(currentValues.filter(v => v !== value));
                      }
                    }}
                  />
                  <Text variant="body">{option}</Text>
                </OptionInput>
              </OptionItem>
            ))}
          </OptionsContainer>
        ) : (
          <OptionsContainer>
            {options.map((option, index) => (
              <OptionItem key={index}>
                <OptionInput>
                  <input
                    type="radio"
                    name={`question-${question.id}`}
                    value={option}
                    checked={selectedAnswers === option}
                    onChange={(e) => handleChange(e.target.value)}
                  />
                  <Text variant="body">{option}</Text>
                </OptionInput>
              </OptionItem>
            ))}
          </OptionsContainer>
        )}
      </OptionsSection>

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

const QuestionSubtext = styled.div``;

const RequiredMark = styled.div`
  width: fit-content;
`;

const OptionsSection = styled.div`
  margin-bottom: 16px;
  padding: 8px;
  background: var(--grey-50);
  border-radius: 6px;
`;

const OptionsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const OptionItem = styled.div`
  padding: 8px;
  border-radius: 4px;
  transition: background-color 0.2s;
  
  &:hover {
    background: var(--white);
  }
`;

const OptionInput = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  
  input {
    width: 16px;
    height: 16px;
    cursor: pointer;
  }
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