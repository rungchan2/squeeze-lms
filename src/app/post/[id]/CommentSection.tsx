"use client";

import React, { useEffect, useCallback, useRef } from "react";
import styled from "@emotion/styled";
import { useComments } from "@/hooks/useComments";
import { useParams } from "next/navigation";
import { ProfileImage } from "@/components/navigation/ProfileImage";
import { formatDifference } from "@/utils/dayjs/calcDifference";
import Spinner from "@/components/common/Spinner";
import { FiTrash2 } from "react-icons/fi";
import CommentInputSection from "./CommentInputSection";
import Heading from "@/components/Text/Heading";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { createClient } from "@/utils/supabase/client";

interface CommentSectionProps {
  postId?: string;
  enableRealtime?: boolean;
  missionInstanceId?: string;
  journeyId?: string;
}

export default function CommentSection({
  postId: propPostId,
  missionInstanceId,
  journeyId,
}: CommentSectionProps = {}) {
  const params = useParams();
  const postId = propPostId || (params.id as string);
  const {
    comments,
    count,
    loading,
    error,
    deleteComment,
    createComment,
    fetchNextPage,
    hasMore,
    isFetchingNextPage,
    mutate,
  } = useComments({
    postId,
  });
  const { id: userId } = useSupabaseAuth();

  const lastCommentRef = useRef<HTMLDivElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // 무한 스크롤 관찰자 설정 - 디바운스 적용
  useEffect(() => {
    if (loading) return;

    let timeout: NodeJS.Timeout | null = null;

    // 기존 observer 연결 해제
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    // 더 로드할 댓글이 있을 때만 observer 설정
    if (hasMore) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && !isFetchingNextPage) {
            // 디바운스 적용 - 여러 번 호출되는 것 방지
            if (timeout) clearTimeout(timeout);

            timeout = setTimeout(() => {
              fetchNextPage();
            }, 300);
          }
        },
        { threshold: 0.1, rootMargin: "100px" }
      );

      // lastCommentRef가 설정되어 있고 유효할 때만 관찰 시작
      if (lastCommentRef.current) {
        observerRef.current.observe(lastCommentRef.current);
      }
    }

    return () => {
      if (timeout) clearTimeout(timeout);
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loading, hasMore, isFetchingNextPage, fetchNextPage, comments.length]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`comments-${postId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comments',
          filter: `post_id=eq.${postId}`,
        },
        () => {
          mutate();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'comments',
          filter: `post_id=eq.${postId}`,
        },
        () => {
          mutate();
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [postId, mutate]);

  const handleDeleteComment = useCallback(
    async (commentId: string) => {
      if (confirm("정말로 이 댓글을 삭제하시겠습니까?")) {
        await deleteComment(commentId);
      }
    },
    [deleteComment]
  );

  if (loading && comments.length === 0)
    return (
      <div>
        <Spinner size="small" />
      </div>
    );
  if (error) return <div>오류: {error}</div>;

  return (
    <CommentSectionContainer>
      <Heading level={3}>댓글 {count}개</Heading>

      {/* 댓글 목록 */}
      <div className="comments-list">
        {comments.length === 0 ? (
          <div className="no-comments">첫 댓글을 남겨보세요!</div>
        ) : (
          <>
            {comments.map((comment, index) => {
              // 마지막 항목에만 ref 설정
              const isLastItem = index === comments.length - 1;

              return (
                <CommentItem
                  key={comment.id}
                  ref={isLastItem ? lastCommentRef : null}
                >
                  <div className="comment-header">
                    <ProfileImage
                      profileImage={comment.profiles?.profile_image || null}
                      size="small"
                      id={comment.profiles?.id}
                    />
                    <div className="comment-info">
                      <div className="comment-author">
                        {comment.profiles?.first_name}{" "}
                        {comment.profiles?.last_name}
                      </div>
                      <div className="comment-date">
                        {formatDifference(comment.created_at || "")}
                      </div>
                    </div>
                    {userId === comment.user_id && (
                      <button
                        className="delete-button"
                        onClick={() => handleDeleteComment(comment.id)}
                        aria-label="댓글 삭제"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    )}
                  </div>
                  <div
                    className="comment-content"
                    dangerouslySetInnerHTML={{ __html: comment.content || "" }}
                  />
                </CommentItem>
              );
            })}

            {/* 로딩 인디케이터 - 하단에 표시 */}
            {isFetchingNextPage && (
              <div className="loading-more">
                <Spinner size="small" />
              </div>
            )}

            {/* 모든 댓글을 로드한 경우 메시지 표시 */}
            {!hasMore && comments.length > 10 && (
              <div className="no-more-comments">모든 댓글을 불러왔습니다.</div>
            )}
          </>
        )}
      </div>

      <CommentInputSection
        createComment={createComment}
        missionInstanceId={journeyId || missionInstanceId}
        postId={postId}
      />
    </CommentSectionContainer>
  );
}

const CommentSectionContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 100px; /* CommentInputSection 높이만큼 여백 */

  .comments-list {
    display: flex;
    flex-direction: column;
  }

  .no-comments {
    color: var(--grey-500);
    text-align: center;
    padding: 2rem 0;
  }

  .loading-more {
    display: flex;
    justify-content: center;
    padding: 1rem;
  }

  .no-more-comments {
    text-align: center;
    color: var(--grey-500);
    font-size: 0.9rem;
    padding: 1rem 0;
  }
`;

const CommentItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.75rem;
  border-radius: 8px;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: var(--grey-100);
  }

  .comment-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    position: relative;
  }

  .comment-info {
    display: flex;
    flex-direction: column;
    flex-grow: 1;
  }

  .comment-author {
    font-weight: 600;
  }

  .comment-date {
    font-size: 0.8rem;
    color: var(--grey-500);
  }

  .delete-button {
    background: none;
    border: none;
    color: var(--grey-500);
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;

    &:hover {
      color: var(--error-500);
      background-color: var(--grey-100);
    }
  }

  .comment-content {
    margin-left: 2.5rem;

    .mention {
      background-color: var(--primary-100);
      border-radius: 0.3rem;
      color: var(--primary-700);
      font-weight: 500;
      padding: 0.1rem;
      white-space: nowrap;
    }
  }
`;
