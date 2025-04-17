"use client";

import React, { useRef, useEffect, useCallback } from "react";
import MentionInput, {
  MentionInputRef,
} from "@/components/MentionInput/MentionInput";
import styled from "@emotion/styled";
import { VscMention } from "react-icons/vsc";
import { RiSendPlaneFill } from "react-icons/ri";
import { ProfileImage } from "@/components/navigation/ProfileImage";
import { useState } from "react";
import Spinner from "@/components/common/Spinner";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";

interface CommentInputSectionProps {
  createComment: (content: string) => Promise<any>;
  missionInstanceId?: string;
}

// 훅 추출로 중복 렌더링 방지
function useCommentInput(createComment: (content: string) => Promise<any>) {
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<MentionInputRef>(null);
  const submitTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 댓글 내용 변경 핸들러
  const handleCommentChange = useCallback((html: string) => {
    setComment(html);
    if (error) setError(null); // 에러 메시지 초기화
  }, [error]);

  // 댓글 전송 핸들러
  const handleSendComment = useCallback(async () => {
    if (!comment.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      setError(null);
      
      const result = await createComment(comment);

      if (result) {
        // 성공 시 상태 초기화
        setComment("");
        
        // 성공 피드백 표시
        setShowSuccess(true);
        
        // 기존 타이머 제거
        if (submitTimerRef.current) {
          clearTimeout(submitTimerRef.current);
          submitTimerRef.current = null;
        }
        
        // 새 타이머 설정
        submitTimerRef.current = setTimeout(() => {
          setShowSuccess(false);
        }, 1500);

        // 입력창 초기화 및 포커스
        if (inputRef.current) {
          inputRef.current.clear();
          // 모바일에서는 포커스를 잠시 지연
          setTimeout(() => {
            if (inputRef.current) {
              inputRef.current.focus();
            }
          }, 50);
        }
      }
    } catch (err: any) {
      console.error("댓글 전송 오류:", err);
      setError(err.message || "댓글 전송 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }, [comment, isSubmitting, createComment]);

  // 키보드 이벤트 핸들러
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        handleSendComment();
      }
    },
    [handleSendComment]
  );

  // 컴포넌트 정리 함수
  useEffect(() => {
    return () => {
      if (submitTimerRef.current) {
        clearTimeout(submitTimerRef.current);
        submitTimerRef.current = null;
      }
    };
  }, []);

  return {
    comment,
    isSubmitting,
    showSuccess,
    error,
    inputRef,
    handleCommentChange,
    handleSendComment,
    handleKeyDown,
    setError
  };
}

export default function CommentInputSection({
  createComment,
  missionInstanceId
}: CommentInputSectionProps) {
  const { id: userId } = useSupabaseAuth();
  const {
    comment,
    isSubmitting,
    showSuccess,
    error,
    inputRef,
    handleCommentChange,
    handleSendComment,
    handleKeyDown
  } = useCommentInput(createComment);

  // 컴포넌트 마운트 시 입력창에 포커스
  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 200);
    
    return () => {
      clearTimeout(timer);
    };
  }, []);

  return (
    <CommentSectionContainer>
      {showSuccess && (
        <SuccessMessage>
          댓글이 성공적으로 등록되었습니다!
        </SuccessMessage>
      )}
      
      {error && (
        <ErrorMessage>
          {error}
        </ErrorMessage>
      )}
      
      <div className="comment-section-container">
        <div className="comment-section-header">
          <ProfileImage profileImage={null} size="small" />
          <MentionInput
            ref={inputRef}
            onKeyDown={handleKeyDown}
            content={comment}
            onChange={handleCommentChange}
            placeholder="댓글..."
            journeyId={missionInstanceId}
          />
        </div>
        <div className="comment-section-footer">
          <button className="comment-section-footer-button">
            <VscMention size={24} />
          </button>
          <SendButton
            onClick={(e) => {
              e.preventDefault();
              handleSendComment();
            }}
            disabled={!comment.trim() || isSubmitting}
            $isSubmitting={isSubmitting}
            type="button"
          >
            {isSubmitting ? (
              <Spinner size="small" />
            ) : (
              <RiSendPlaneFill size={24} />
            )}
          </SendButton>
        </div>
      </div>
    </CommentSectionContainer>
  );
}

const CommentSectionContainer = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  justify-content: center;
  width: 100%;
  display: flex;
  flex-direction: column;
  z-index: 9999;
  margin: 0;
  width: 100%;

  .comment-section-container {
    display: flex;
    flex-direction: column;
    width: 100%;
    max-width: var(--breakpoint-tablet);
    margin: 0 auto;
    background-color: white;
    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
    border-radius: 10px 10px 0 0;
    padding: 0 16px;
  }

  .comment-section-header {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    height: 100%;
    padding: 8px 0;
  }

  .comment-section-footer {
    display: flex;
    justify-content: space-between;
    height: 100%;
    padding: 8px 0;
  }

  .comment-section-footer-button {
    background: none;
    border: none;
    cursor: pointer;
    color: var(--grey-700);

    &:hover {
      color: var(--primary-500);
    }

    &:disabled {
      color: var(--grey-400);
      cursor: not-allowed;
    }
  }
`;

const SendButton = styled.button<{ $isSubmitting: boolean }>`
  background: none;
  border: none;
  cursor: pointer;
  color: ${(props) => props.$isSubmitting ? 'var(--primary-500)' : 'var(--grey-700)'};
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s ease, color 0.2s ease;

  &:hover:not(:disabled) {
    color: var(--primary-500);
    transform: scale(1.1);
  }

  &:disabled {
    color: var(--grey-400);
    cursor: not-allowed;
  }
`;

const SuccessMessage = styled.div`
  position: absolute;
  top: -40px;
  left: 50%;
  transform: translateX(-50%);
  background-color: var(--success-500);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 0.9rem;
  animation: slideDown 0.3s ease;
  opacity: 0.9;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);

  @keyframes slideDown {
    from {
      top: -60px;
      opacity: 0;
    }
    to {
      top: -40px;
      opacity: 0.9;
    }
  }
`;

const ErrorMessage = styled.div`
  position: absolute;
  top: -40px;
  left: 50%;
  transform: translateX(-50%);
  background-color: var(--error-500);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 0.9rem;
  animation: slideDown 0.3s ease;
  opacity: 0.9;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
`;
