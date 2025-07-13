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
import { Popover, Portal } from "@chakra-ui/react";
import { sendNotification } from "@/app/journey/[slug]/actions";
import { excludeHtmlTags } from "@/utils/utils";

// 멘션된 사용자 데이터 타입 정의
interface MentionData {
  id: string;
  display: string;
}

interface CommentInputSectionProps {
  createComment: (content: string) => Promise<any>;
  missionInstanceId?: string;
  postTitle?: string; // 게시물 제목 추가
  postId?: string; // 게시물 ID 추가
}

// 훅 추출로 중복 렌더링 방지
function useCommentInput(
  createComment: (content: string) => Promise<any>,
  userData: { userId: string; firstName: string; lastName: string }
) {
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<MentionInputRef>(null);
  const submitTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 댓글 내용 변경 핸들러
  const handleCommentChange = useCallback(
    (html: string) => {
      setComment(html);
      if (error) setError(null); // 에러 메시지 초기화
    },
    [error]
  );

  // 멘션된 사용자 정보 추출 (댓글 내용에서 @id:name 형식으로 된 부분 파싱)
  const extractMentions = useCallback((content: string): MentionData[] => {
    const mentions: MentionData[] = [];
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, "text/html");
    const mentionElements = doc.querySelectorAll("span.mention");

    mentionElements.forEach((element) => {
      const id = element.getAttribute("data-id");
      const display = element.getAttribute("data-label");

      if (id && display) {
        mentions.push({
          id,
          display,
        });
      }
    });

    return mentions;
  }, []);

  // 댓글 전송 핸들러
  const handleSendComment = useCallback(
    async (postId: string) => {
      if (!comment.trim() || isSubmitting) return;

      try {
        setIsSubmitting(true);
        setError(null);

        const result = await createComment(comment);

        if (result) {
          // 댓글에서 멘션된 사용자 추출
          const extractedMentions = extractMentions(comment);
          console.log("extractedMentions", extractedMentions, postId);
          // 멘션된 사용자들에게 알림 전송
          if (extractedMentions.length > 0 && postId) {
            const { firstName, lastName } = userData;
            const userName = `${firstName || ""} ${lastName || ""}`.trim();

            // 알림 API 지원 확인
            const isNotificationSupported =
              typeof window !== "undefined" &&
              typeof Notification !== "undefined";
            console.log("isNotificationSupported", isNotificationSupported);
            // 각 멘션된 사용자에게 알림 보내기
            if (isNotificationSupported) {
              extractedMentions.forEach(async (user) => {
                try {
                  const result = await sendNotification(
                    `${userName}님이 댓글에서 회원님을 언급했습니다: "${excludeHtmlTags(
                      comment
                    ).substring(0, 50)}${
                      excludeHtmlTags(comment).length > 50 ? "..." : ""
                    }"`,
                    user.id,
                    "/favicon-196.png",
                    `스퀴즈 게시물의 새 멘션이 있습니다.`,
                    `/post/${postId}`
                  );
                  console.log(`알림 전송 성공 (사용자: ${user.id})`, result);
                } catch (err) {
                  console.error(`알림 전송 실패 (사용자: ${user.id}):`, err);
                }
              });
            } else {
              console.log(
                "이 브라우저는 알림 기능을 지원하지 않습니다. 멘션 알림 전송을 건너뜁니다."
              );
            }
          }

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
    },
    [comment, isSubmitting, createComment, userData, extractMentions]
  );

  // 키보드 이벤트 핸들러
  const handleKeyDown = useCallback(
    (postId: string) => (event: React.KeyboardEvent) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        handleSendComment(postId);
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
    setError,
  };
}

export default function CommentInputSection({
  createComment,
  missionInstanceId,
  postId,
}: CommentInputSectionProps) {
  const { id: userId, user } = useSupabaseAuth();
  const profileImage = useSupabaseAuth().profileImage;
  const [isOpen, setIsOpen] = useState(false);

  // 사용자 정보 준비
  const userData = {
    userId: userId || "",
    firstName: user?.user_metadata?.first_name || "",
    lastName: user?.user_metadata?.last_name || "",
  };

  const {
    comment,
    isSubmitting,
    showSuccess,
    error,
    inputRef,
    handleCommentChange,
    handleSendComment,
    handleKeyDown,
  } = useCommentInput(createComment, userData);

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
  }, [inputRef]);

  return (
    <CommentSectionContainer>
      {showSuccess && (
        <SuccessMessage>댓글이 성공적으로 등록되었습니다!</SuccessMessage>
      )}

      {error && <ErrorMessage>{error}</ErrorMessage>}

      <div className="comment-section-container">
        <div className="comment-section-header">
          <ProfileImage
            profileImage={profileImage || ""}
            size="small"
            id={userId}
          />
          <MentionInput
            ref={inputRef}
            onKeyDown={handleKeyDown(postId || "")}
            content={comment}
            onChange={handleCommentChange}
            placeholder="댓글..."
            journeyId={missionInstanceId}
          />
        </div>
        <div className="comment-section-footer">
          <Popover.Root open={isOpen} onOpenChange={(e) => setIsOpen(e.open)}>
            <Popover.Trigger asChild>
              <VscMention
                size={24}
                onClick={() => {
                  if (inputRef.current) {
                    inputRef.current.focus();
                  }
                }}
              />
            </Popover.Trigger>
            <Portal>
              <Popover.Positioner>
                <Popover.Content>
                  <Popover.Arrow />
                  <Popover.Body>
                    &quot;@&quot;를 입력해보세요! 친구들을 대상으로 댓글을 남길
                    수 있어요.
                  </Popover.Body>
                </Popover.Content>
              </Popover.Positioner>
            </Portal>
          </Popover.Root>
          <SendButton
            onClick={(e) => {
              e.preventDefault();
              handleSendComment(postId || "");
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
  z-index: 99;
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
    gap: 10px;
    justify-content: flex-end;
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
  color: ${(props) =>
    props.$isSubmitting ? "var(--primary-500)" : "var(--grey-700)"};
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
