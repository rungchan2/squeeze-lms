"use client";

import React, { useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/components/AuthProvider";
import MentionInput, {
  MentionInputRef,
} from "@/components/MentionInput/MentionInput";
import styled from "@emotion/styled";
import { VscMention } from "react-icons/vsc";
import { RiSendPlaneFill } from "react-icons/ri";
import { ProfileImage } from "@/components/navigation/ProfileImage";
import { useState } from "react";
import { Comment } from "@/types/comments";

interface CommentInputSectionProps {
  localComments: Comment[];
  createComment: (content: string) => Promise<any>;
}

export default function CommentInputSection({
  createComment,
}: CommentInputSectionProps) {
  const { profileImage } = useAuth();
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<MentionInputRef>(null);

  // 댓글 내용 변경 핸들러
  const handleCommentChange = useCallback((html: string) => {
    setComment(html);
  }, []);

  // 댓글 전송 핸들러
  const handleSendComment = useCallback(async () => {
    if (!comment.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const result = await createComment(comment);

      if (result) {
        // 성공 시 상태 초기화
        setComment("");

        // 입력창 초기화 및 포커스
        if (inputRef.current) {
          inputRef.current.clear();
          inputRef.current.focus();
        }
      }
    } catch (error) {
      console.error("댓글 전송 오류:", error);
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
        window.scrollTo(0, 0);
      }
    },
    [handleSendComment]
  );

  // 컴포넌트 마운트 시 입력창에 포커스
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  return (
    <CommentSectionContainer>
      <div className="comment-section-container">
        <div className="comment-section-header">
          <ProfileImage profileImage={profileImage} size="small" />
          <MentionInput
            ref={inputRef}
            onKeyDown={handleKeyDown}
            content={comment}
            onChange={handleCommentChange}
            placeholder="댓글..."
          />
        </div>
        <div className="comment-section-footer">
          <button className="comment-section-footer-button">
            <VscMention size={24} />
          </button>
          <button
            className="comment-section-footer-button"
            onClick={handleSendComment}
            disabled={!comment.trim() || isSubmitting}
          >
            {isSubmitting ? "전송 중..." : <RiSendPlaneFill size={24} />}
          </button>
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
