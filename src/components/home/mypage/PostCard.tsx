"use client";

import Text from "@/components/Text/Text";
import Heading from "../../Text/Heading";
import styled from "@emotion/styled";
import { FaRegComment, FaShare, FaHeart } from "react-icons/fa";
import { MdAutoGraph } from "react-icons/md";

import { LuDot } from "react-icons/lu";
import { formatDifference } from "@/utils/dayjs/calcDifference";
import { useRouter } from "next/navigation";
import { ProfileImage } from "@/components/navigation/ProfileImage";
import dayjs from "@/utils/dayjs/dayjs";
import { PostWithRelations } from "@/types";
import { useLikes } from "@/hooks/useLikes";
import RichTextViewer from "@/components/richTextInput/RichTextViewer";
import { useAuth } from "@/components/AuthProvider";
import { useComments } from "@/hooks/useComments";

interface PostCardProps {
  post: PostWithRelations;
  showDetails?: boolean;
}

export default function PostCard({ post, showDetails = false }: PostCardProps) {
  const router = useRouter();
  const { id } = useAuth();
  const { onLike, onUnlike, likesCount, useUserLike } = useLikes(post.id);
  const { count } = useComments({ postId: post.id });

  const { data: userLike } = useUserLike(id);
  const isUserLike = Boolean(userLike);

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!id) {
      alert("로그인이 필요합니다.");
      return;
    }

    if (isUserLike) {
      onUnlike(id);
    } else {
      onLike(id);
    }
  };

  return (
    <PostCardContainer
      showDetails={showDetails}
      onClick={() => {
        if (!showDetails) {
          router.push(`/post/${post.id}`);
        }
      }}
    >
      <ContentWrapper>
        <UserInfoContainer>
          <ProfileImage
            profileImage={post?.profiles?.profile_image || ""}
            width={40}
          />
          <div className="user-info-wrapper">
            <UserNameWrapper>
              <Text variant="caption" fontWeight="bold">
                {post?.profiles?.first_name}
              </Text>
              <Text variant="caption" fontWeight="bold">
                의 포스팅
              </Text>
            </UserNameWrapper>
            <UserDetailsWrapper>
              <Text variant="small" fontWeight="bold">
                {post?.profiles?.organizations?.name
                  ? post?.profiles?.organizations?.name
                  : "무소속"}
              </Text>
              <LuDot />
              <Text variant="small" fontWeight="bold">
                {dayjs(post?.created_at).format("YYYY-MM-DD H:mm")}
              </Text>
              <LuDot />
              <Text variant="small" fontWeight="bold">
                {formatDifference(post?.created_at || "")}
              </Text>
            </UserDetailsWrapper>
          </div>
        </UserInfoContainer>

        <PostContentContainer showDetails={showDetails}>
          <Heading level={3}>{post?.title}</Heading>
          {showDetails ? (
            <div>
              <RichTextViewer content={post.content || ""} />
            </div>
          ) : (
            <div
                className="not-details-content"
                dangerouslySetInnerHTML={{ __html: post.content || "" }}
              />
          )}
        </PostContentContainer>

        <InteractionContainer>
          <InteractionItem onClick={handleLike}>
            {isUserLike ? (
              <FaHeart color="var(--primary-500)" />
            ) : (
              <FaHeart color="var(--grey-500)" />
            )}
            <Text variant="caption" fontWeight="bold">
              {likesCount}
            </Text>
          </InteractionItem>
          <InteractionItem>
            <FaRegComment />
            <Text variant="caption">{count}</Text>
          </InteractionItem>
          <InteractionItem>
            <MdAutoGraph />
            <Text variant="caption">{post.view_count}</Text>
          </InteractionItem>
          <InteractionItem>
            <FaShare />
          </InteractionItem>
        </InteractionContainer>
      </ContentWrapper>
    </PostCardContainer>
  );
}

const PostCardContainer = styled.div<{ showDetails: boolean }>`
  width: 100%;
  border-radius: 10px;
  border: ${({ showDetails }) =>
    showDetails ? "none" : "1px solid var(--grey-200)"};
  background-color: ${({ showDetails }) =>
    showDetails ? "var(--grey-100)" : "var(--white)"};
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  padding: ${({ showDetails }) => (showDetails ? "0px" : "7.5px")};
  cursor: ${({ showDetails }) => (showDetails ? "default" : "pointer")};
  transition: background-color 0.1s ease;
  &:hover {
    background-color: var(--grey-100);
  }
`;

const ContentWrapper = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  padding: 10px;
  box-sizing: border-box;
  gap: 12.8px;
`;

const UserInfoContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  gap: 7.5px;
  width: 100%;

  .user-info-wrapper {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: flex-start;
    gap: 4px;
  }
`;

const UserNameWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  gap: 3px;
`;

const UserDetailsWrapper = styled.div`
  align-self: stretch;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  color: var(--grey-500);
`;

const PostContentContainer = styled.div<{ showDetails: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  gap: 12px;
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: ${({ showDetails }) => (showDetails ? "normal" : "nowrap")};
  ${({ showDetails }) => (showDetails ? "overflow: visible;" : "")}
`;

const InteractionContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
  color: var(--grey-500);

  svg {
    color: var(--grey-500);
  }
`;

const InteractionItem = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 3px 5px;
  cursor: pointer;
  &:hover {
    background-color: var(--grey-200);
    border-radius: 10px;
  }

  p {
    margin-bottom: -1px;
  }

  .not-details-content {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    line-clamp: 5;
    max-width: 100%;
    display: -webkit-box;
    -webkit-line-clamp: 5;
    -webkit-box-orient: vertical;
  }
`;
