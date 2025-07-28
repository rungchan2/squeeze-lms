"use client";

import React from "react";
import styled from "@emotion/styled";
import { AnswersData, AnyAnswer } from "@/types/missionQuestions";
import Text from "@/components/Text/Text";
import { FiFileText, FiCheckSquare, FiImage, FiLayers } from "react-icons/fi";
import RichTextViewer from "@/components/richTextInput/RichTextViewer";

interface AnswersViewerProps {
  answersData: AnswersData | null;
  legacyContent?: string | null;
}

const AnswersViewer: React.FC<AnswersViewerProps> = ({ answersData, legacyContent }) => {
  // Legacy content fallback for old posts
  if (!answersData && legacyContent) {
    return (
      <LegacyContentContainer>
        <Text variant="caption" color="var(--grey-500)" style={{ marginBottom: "12px" }}>
          기존 형식의 제출 내용
        </Text>
        <RichTextViewer content={legacyContent} />
      </LegacyContentContainer>
    );
  }

  if (!answersData || !answersData.answers || answersData.answers.length === 0) {
    return (
      <EmptyState>
        <Text variant="body" color="var(--grey-500)">
          제출된 답변이 없습니다.
        </Text>
      </EmptyState>
    );
  }

  const getQuestionIcon = (answerType: string) => {
    switch (answerType) {
      case 'essay':
        return <FiFileText />;
      case 'multiple_choice':
        return <FiCheckSquare />;
      case 'image_upload':
        return <FiImage />;
      case 'mixed':
        return <FiLayers />;
      default:
        return <FiFileText />;
    }
  };

  const getQuestionTypeName = (answerType: string) => {
    switch (answerType) {
      case 'essay':
        return '서술형';
      case 'multiple_choice':
        return '객관식';
      case 'image_upload':
        return '이미지 업로드';
      case 'mixed':
        return '혼합형';
      default:
        return '기타';
    }
  };

  return (
    <AnswersViewerContainer>
      {/* Submission Metadata */}
      <SubmissionMetadata>
        <MetadataRow>
          <MetadataLabel>총 문항 수:</MetadataLabel>
          <MetadataValue>{answersData.submission_metadata.total_questions}개</MetadataValue>
        </MetadataRow>
        <MetadataRow>
          <MetadataLabel>답변한 문항:</MetadataLabel>
          <MetadataValue>{answersData.submission_metadata.answered_questions}개</MetadataValue>
        </MetadataRow>
        <MetadataRow>
          <MetadataLabel>제출 시간:</MetadataLabel>
          <MetadataValue>
            {new Date(answersData.submission_metadata.submission_time).toLocaleString('ko-KR')}
          </MetadataValue>
        </MetadataRow>
      </SubmissionMetadata>

      {/* Answer Items */}
      <AnswersContainer>
        {answersData.answers
          .sort((a, b) => a.question_order - b.question_order)
          .map((answer, index) => (
            <AnswerItem key={`${answer.question_id}-${index}`}>
              <AnswerHeader>
                <QuestionInfo>
                  <QuestionIcon>{getQuestionIcon(answer.answer_type)}</QuestionIcon>
                  <QuestionMeta>
                    <Text variant="body" fontWeight="bold">
                      문항 {answer.question_order}
                    </Text>
                    <Text variant="caption" color="var(--grey-500)">
                      {getQuestionTypeName(answer.answer_type)}
                    </Text>
                  </QuestionMeta>
                </QuestionInfo>
                {answer.points_earned !== null && (
                  <ScoreBadge>
                    <Text variant="caption" fontWeight="bold">
                      {answer.points_earned}점
                    </Text>
                  </ScoreBadge>
                )}
              </AnswerHeader>

              <AnswerContent>
                <AnswerRenderer answer={answer} />
              </AnswerContent>
            </AnswerItem>
          ))}
      </AnswersContainer>
    </AnswersViewerContainer>
  );
};

// Individual answer renderer component
const AnswerRenderer: React.FC<{ answer: AnyAnswer }> = ({ answer }) => {
  switch (answer.answer_type) {
    case 'essay':
      return (
        <EssayAnswer>
          {answer.answer_text ? (
            <RichTextViewer content={answer.answer_text} />
          ) : (
            <Text variant="body" color="var(--grey-500)">답변이 작성되지 않았습니다.</Text>
          )}
        </EssayAnswer>
      );

    case 'multiple_choice':
      return (
        <MultipleChoiceAnswer>
          <SelectedOption>
            <Text variant="body" fontWeight="bold">선택한 답:</Text>
            <Text variant="body">{answer.selected_option}</Text>
          </SelectedOption>
          {answer.is_correct !== null && (
            <CorrectIndicator isCorrect={answer.is_correct}>
              <Text variant="caption" fontWeight="bold">
                {answer.is_correct ? '정답' : '오답'}
              </Text>
            </CorrectIndicator>
          )}
        </MultipleChoiceAnswer>
      );

    case 'image_upload':
      return (
        <ImageUploadAnswer>
          {answer.answer_text && (
            <div style={{ marginBottom: '12px' }}>
              <RichTextViewer content={answer.answer_text} />
            </div>
          )}
          {answer.image_urls && answer.image_urls.length > 0 ? (
            <ImageGrid>
              {answer.image_urls.map((imageUrl, index) => (
                <ImageItem key={`${answer.question_id}-img-${index}`}>
                  <img src={imageUrl} alt={`제출 이미지 ${index + 1}`} />
                </ImageItem>
              ))}
            </ImageGrid>
          ) : (
            <Text variant="body" color="var(--grey-500)">업로드된 이미지가 없습니다.</Text>
          )}
        </ImageUploadAnswer>
      );

    case 'mixed':
      return (
        <MixedAnswer>
          {answer.answer_text && (
            <div style={{ marginBottom: '16px' }}>
              <Text variant="caption" color="var(--grey-600)" style={{ marginBottom: '8px' }}>
                텍스트 답변:
              </Text>
              <RichTextViewer content={answer.answer_text} />
            </div>
          )}
          {answer.image_urls && answer.image_urls.length > 0 && (
            <div>
              <Text variant="caption" color="var(--grey-600)" style={{ marginBottom: '8px' }}>
                첨부 이미지:
              </Text>
              <ImageGrid>
                {answer.image_urls.map((imageUrl, index) => (
                  <ImageItem key={`${answer.question_id}-mixed-img-${index}`}>
                    <img src={imageUrl} alt={`첨부 이미지 ${index + 1}`} />
                  </ImageItem>
                ))}
              </ImageGrid>
            </div>
          )}
          {!answer.answer_text && (!answer.image_urls || answer.image_urls.length === 0) && (
            <Text variant="body" color="var(--grey-500)">답변이 작성되지 않았습니다.</Text>
          )}
        </MixedAnswer>
      );

    default:
      return (
        <Text variant="body" color="var(--grey-500)">
          알 수 없는 답변 형식입니다.
        </Text>
      );
  }
};

export default AnswersViewer;

// Styled Components
const AnswersViewerContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-height: 70vh;
  overflow-y: auto;
`;

const LegacyContentContainer = styled.div`
  padding: 16px;
  background-color: var(--grey-25);
  border-radius: 8px;
  border: 1px solid var(--grey-200);
`;

const EmptyState = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  background-color: var(--grey-25);
  border-radius: 8px;
  border: 1px dashed var(--grey-300);
`;

const SubmissionMetadata = styled.div`
  background-color: var(--grey-50);
  padding: 16px;
  border-radius: 8px;
  border: 1px solid var(--grey-200);
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const MetadataRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const MetadataLabel = styled.div`
  font-size: 14px;
  color: var(--grey-600);
  font-weight: 500;
`;

const MetadataValue = styled.div`
  font-size: 14px;
  color: var(--grey-800);
  font-weight: 600;
`;

const AnswersContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const AnswerItem = styled.div`
  background-color: var(--white);
  border-radius: 8px;
  border: 1px solid var(--grey-200);
  overflow: hidden;
`;

const AnswerHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: var(--grey-25);
  border-bottom: 1px solid var(--grey-200);
`;

const QuestionInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const QuestionIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background-color: var(--primary-100);
  border-radius: 6px;
  color: var(--primary-600);
  font-size: 16px;
`;

const QuestionMeta = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const ScoreBadge = styled.div`
  background-color: var(--primary-500);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
`;

const AnswerContent = styled.div`
  padding: 16px;
`;

const EssayAnswer = styled.div`
  /* RichTextViewer styles will be applied */
`;

const MultipleChoiceAnswer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
`;

const SelectedOption = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const CorrectIndicator = styled.div<{ isCorrect: boolean }>`
  background-color: ${props => props.isCorrect ? 'var(--positive-100)' : 'var(--negative-100)'};
  color: ${props => props.isCorrect ? 'var(--positive-700)' : 'var(--negative-700)'};
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid ${props => props.isCorrect ? 'var(--positive-300)' : 'var(--negative-300)'};
`;

const ImageUploadAnswer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const MixedAnswer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const ImageGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
`;

const ImageItem = styled.div`
  img {
    width: 100%;
    height: 150px;
    object-fit: cover;
    border-radius: 6px;
    border: 1px solid var(--grey-200);
    cursor: pointer;
    transition: transform 0.2s ease;

    &:hover {
      transform: scale(1.02);
    }
  }
`;