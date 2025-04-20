"use client";

import Text from "@/components/Text/Text";
import Heading from "@/components/Text/Heading";
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
import { useCallback, useMemo, memo } from "react";
import { toaster } from "@/components/ui/toaster";
import { Menu, Portal } from "@chakra-ui/react";
import { FaEllipsis } from "react-icons/fa6";
import { hidePost, deletePost } from "@/utils/data/posts";
import useSWR from "swr";
import { getCommentsNumber } from "@/utils/data/comment";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";

interface PostCardProps {
  post: PostWithRelations;
  showDetails?: boolean;
}

declare global {
  interface Window {
    Kakao: any;
  }
}

// 경량화된 댓글 수만 가져오는 훅
function useCommentsCount(postId: string) {
  const { data, error, isLoading } = useSWR(
    postId ? [`commentsCount-${postId}`] : null,
    () => getCommentsNumber(postId),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 30000, // 30초 동안 캐시 유지
    }
  );

  return {
    count: data || 0,
    error,
    isLoading,
  };
}

export default memo(function PostCard({
  post,
  showDetails = false,
}: PostCardProps) {
  const router = useRouter();
  const { id } = useSupabaseAuth();
  const { onLike, onUnlike, likesCount, useUserLike } = useLikes(post.id);
  const { count } = useCommentsCount(post.id);

  const { data: userLike } = useUserLike(id);
  const isUserLike = Boolean(userLike);

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    toaster.create({
      title: "링크가 복사되었습니다.",
      type: "success",
      duration: 1000,
    });
  }, []);

  const handleLike = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();

      if (!id) {
        toaster.create({
          title: "로그인이 필요합니다.",
          type: "error",
        });
        router.push("/login");
        return;
      }

      if (isUserLike) {
        onUnlike(id);
      } else {
        onLike(id);
      }
    },
    [id, isUserLike, onLike, onUnlike, router]
  );

  // imageUrl을 useMemo로 최적화
  const imageUrl = useMemo(
    () => post.content?.match(/<img[^>]*src="([^"]+)"[^>]*>/)?.[0],
    [post.content]
  );

  // 포스트 URL 메모이제이션
  const postUrl = useMemo(
    () => window.location.origin + `/post/${post.id}`,
    [post.id]
  );

  const handleShare = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();

      if (!window.Kakao || !window.Kakao.Share) {
        toaster.create({
          title: "카카오 SDK가 로드되지 않았습니다. 잠시 후 다시 시도해주세요.",
          type: "error",
          duration: 3000,
        });
        return;
      }

      try {
        window.Kakao.Share.sendDefault({
          objectType: "feed",
          content: {
            title: post.title,
            description: post.content
              ? post.content.replace(/<[^>]*>?/gm, "").substring(0, 100) + "..."
              : "내용이 없습니다.",
            imageUrl: imageUrl || "https://via.placeholder.com/500",
            link: {
              mobileWebUrl: postUrl,
              webUrl: postUrl,
            },
          },
          social: {
            likeCount: likesCount,
            commentCount: count,
            viewCount: post.view_count,
          },
          buttons: [
            {
              title: "자세히 보기",
              link: {
                mobileWebUrl: postUrl,
                webUrl: postUrl,
              },
            },
          ],
        });
      } catch (error) {
        console.error("카카오 공유 에러:", error);
        toaster.create({
          title: "공유 중 오류가 발생했습니다.",
          type: "error",
        });
      }
    },
    [
      post.title,
      post.content,
      post.view_count,
      imageUrl,
      likesCount,
      count,
      postUrl,
    ]
  );

  const handlePostClick = useCallback(() => {
    if (!showDetails) {
      router.push(`/post/${post.id}`);
    }
  }, [post.id, router, showDetails]);

  function OnlyMyPost({ children }: { children: React.ReactNode }) {
    if (post.profiles?.id === id) {
      return children;
    }
    return null;
  }
  //[ ] 팀 포스팅 시 팀원 이름 전부 표시 및 팀 미션이라는 표시가능.
  return (
    <PostCardContainer showDetails={showDetails} onClick={handlePostClick}>
      <ContentWrapper>
        <UserInfoContainer>
          <div className="user-info-wrapper">
            <ProfileImage
              profileImage={post?.profiles?.profile_image || ""}
              width={40}
            />
            <div className="vertical-user-info-wrapper">
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
          </div>
          <Menu.Root>
            <Menu.Trigger asChild>
              <div
                className="menu-trigger"
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                <FaEllipsis />
              </div>
            </Menu.Trigger>
            <Portal>
              <Menu.Positioner>
                <Menu.Content>
                  <Menu.Item
                    style={{ cursor: "pointer" }}
                    value="rename"
                    onClick={(e) => {
                      copyToClipboard(window.location.href);
                      e.stopPropagation();
                    }}
                  >
                    링크 복사
                  </Menu.Item>
                  <OnlyMyPost>
                    <Menu.Item
                      value="export"
                      style={{ cursor: "pointer" }}
                      onClick={() => {
                        router.push(`/post/${post.id}/edit`);
                      }}
                    >
                      수정
                    </Menu.Item>
                    <Menu.Item
                      style={{ cursor: "pointer" }}
                      value="hide"
                      color="var(--grey-700)"
                      _hover={{
                        bg: "var(--grey-200)",
                        color: "var(--grey-700)",
                      }}
                      onClick={(e) => {
                        if (confirm("이 게시물을 숨기시겠습니까?")) {
                          hidePost(post.id);
                        }
                        e.stopPropagation();
                      }}
                      // TODO: 2. 게시물 숨김 상태 갖고오기 및 다시 보이게 하기 기능 구현
                    >
                      이 게시물 숨기기
                    </Menu.Item>
                    <Menu.Item
                      style={{ cursor: "pointer" }}
                      value="delete"
                      color="fg.error"
                      _hover={{ bg: "bg.error", color: "fg.error" }}
                      onClick={(e) => {
                        if (confirm("삭제하시겠습니까?")) {
                          deletePost(post.id);
                          router.back();
                        }
                        e.stopPropagation();
                      }}
                    >
                      삭제
                    </Menu.Item>
                  </OnlyMyPost>
                </Menu.Content>
              </Menu.Positioner>
            </Portal>
          </Menu.Root>
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
              dangerouslySetInnerHTML={{
                __html:
                  post.content?.length && post.content?.length > 100
                    ? post.content?.slice(0, 100) + "..."
                    : post.content || "",
              }}
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
          <InteractionItem onClick={handleShare} data-kakao-share="true">
            <FaShare />
            <Text variant="caption">공유</Text>
          </InteractionItem>
        </InteractionContainer>
      </ContentWrapper>
    </PostCardContainer>
  );
});

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
  .vertical-user-info-wrapper {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: flex-start;
    gap: 4px;
    width: fit-content;
  }
  .user-info-wrapper {
    display: flex;
    align-items: center;
    gap: 7.5px;
    width: 100%;
  }
  .menu-trigger {
    cursor: pointer;
    padding: 6px;

    &:hover {
      background: var(--grey-200);
      border-radius: 50%;
    }
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
  justify-content: space-between;
  align-items: center;
  width: 100%;
  .user-info-wrapper {
    display: flex;
    align-items: center;
    gap: 12px;
    width: calc(100% - 40px);
  }

  .vertical-user-info-wrapper {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: flex-start;
    gap: 4px;
    width: fit-content;
    overflow: hidden;
  }

  .menu-trigger {
    cursor: pointer;
    padding: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 32px;
    width: 32px;

    &:hover {
      background: var(--grey-200);
      border-radius: 50%;
    }
  }
`;

const UserNameWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const UserDetailsWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--grey-600);
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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
