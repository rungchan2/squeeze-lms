"use client";

import React, { useEffect, useState, useCallback } from "react";
import styled from "@emotion/styled";
import { useComments } from "@/hooks/useComments";
import { useParams } from "next/navigation";
import { ProfileImage } from "@/components/navigation/ProfileImage";
import { formatDifference } from "@/utils/dayjs/calcDifference";
import Spinner from "@/components/common/Spinner";
import { useAuth } from "@/components/AuthProvider";
import { FiTrash2 } from "react-icons/fi";
import { Comment } from "@/types/comments";
import CommentInputSection from "./CommentInputSection";

export default function CommentSection() {
  const params = useParams();
  const postId = Number(params.id);
  const {
    comments,
    count,
    loading,
    error,
    deleteComment,
    refreshComments,
    createComment,
  } = useComments({ postId });
  const { id: userId } = useAuth();
  const [localComments, setLocalComments] = useState<Comment[]>([]);
  const [localCount, setLocalCount] = useState(0);

  // 댓글 데이터가 변경될 때마다 로컬 상태 업데이트
  useEffect(() => {
    setLocalComments(comments);
    setLocalCount(count);
  }, [comments, count]);

  // 컴포넌트 마운트 시 댓글 새로고침
  useEffect(() => {
    refreshComments();
  }, [refreshComments]);

  const handleDeleteComment = useCallback(
    async (commentId: number) => {
      if (confirm("정말로 이 댓글을 삭제하시겠습니까?")) {
        await deleteComment(commentId);
      }
    },
    [deleteComment]
  );

  if (loading && localComments.length === 0)
    return (
      <div>
        <Spinner size="small" />
      </div>
    );
  if (error) return <div>오류: {error}</div>;

  return (
    <CommentSectionContainer>
      <h3 className="comment-count">댓글 {localCount}개</h3>
      <div className="comments-list">
        {localComments.length === 0 ? (
          <div className="no-comments">첫 댓글을 남겨보세요!</div>
        ) : (
          localComments.map((comment) => (
            <CommentItem key={comment.id}>
              <div className="comment-header">
                <ProfileImage
                  profileImage={comment.profiles?.profile_image || null}
                  size="small"
                />
                <div className="comment-info">
                  <div className="comment-author">
                    {comment.profiles?.first_name} {comment.profiles?.last_name}
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
          ))
        )}
      </div>
      <CommentInputSection
        localComments={localComments}
        createComment={createComment}
      />
    </CommentSectionContainer>
  );
}

const CommentSectionContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 100px; /* CommentInputSection 높이만큼 여백 */

  .comment-count {
    border-top: 1px solid var(--grey-400);
    padding-top: 1rem;
    font-size: 1.2rem;
    font-weight: 600;
  }

  .comments-list {
    display: flex;
    flex-direction: column;
  }

  .no-comments {
    color: var(--grey-500);
    text-align: center;
    padding: 2rem 0;
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
