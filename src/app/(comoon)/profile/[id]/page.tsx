"use client";

import React from "react";
import { useParams } from "next/navigation";
import styled from "@emotion/styled";
import { useUser } from "@/hooks/useUsers";
import { usePosts } from "@/hooks/usePosts";
import { Loading } from "@/components/common/Loading";
import { Error } from "@/components/common/Error";
import Heading from "@/components/Text/Heading";
import Text from "@/components/Text/Text";
import { PostWithRelations } from "@/types";
import dayjs from "@/utils/dayjs/dayjs";
import { useRouter } from "next/navigation";
import { HiMail, HiPhone, HiCalendar, HiDocument } from "react-icons/hi";
import { ProfileImage } from "@/components/navigation/ProfileImage";

export default function ProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const profileId = id as string;

  // 사용자 정보 조회
  const { user, error: userError, isLoading: userLoading } = useUser(profileId);

  // 사용자가 작성한 게시물 조회 (숨김 게시물 제외)
  const {
    data: userPosts,
    error: postsError,
    isLoading: postsLoading,
    total: totalPosts,
  } = usePosts(20, undefined, false, profileId);

  if (userLoading) return <Loading />;
  if (userError) return <Error message="사용자 정보를 불러올 수 없습니다." />;
  if (!user) return <Error message="존재하지 않는 사용자입니다." />;

  const handlePostClick = (postId: string) => {
    router.push(`/post/${postId}`);
  };

  return (
    <ProfilePageContainer>
      {/* 프로필 헤더 */}
      <ProfileHeader>
        <ProfileImageSection>
          <ProfileImage
            profileImage={user.profile_image || ""}
            size="xlarge"
            id={user.id}
          />
        </ProfileImageSection>
        
        <ProfileInfo>
          <Heading level={2} className="user-name">
            {user.last_name || ""}{user.first_name || ""}
          </Heading>
          
          <ProfileDetails>
            {user.email && (
              <DetailItem>
                <HiMail className="icon" />
                <Text variant="body">{user.email}</Text>
              </DetailItem>
            )}
            
            {user.phone && (
              <DetailItem>
                <HiPhone className="icon" />
                <Text variant="body">{user.phone}</Text>
              </DetailItem>
            )}
            
            <DetailItem>
              <HiCalendar className="icon" />
              <Text variant="body">
                가입일: {dayjs(user.created_at).format("YYYY년 MM월 DD일")}
              </Text>
            </DetailItem>

            <DetailItem>
              <HiDocument className="icon" />
              <Text variant="body">
                작성한 게시물: {totalPosts}개
              </Text>
            </DetailItem>
          </ProfileDetails>
        </ProfileInfo>
      </ProfileHeader>

      {/* 게시물 섹션 */}
      <PostsSection>
        <SectionHeader>
          <Heading level={3}>작성한 게시물</Heading>
          <Text variant="body" color="var(--grey-600)">
            총 {totalPosts}개의 게시물
          </Text>
        </SectionHeader>

        {postsLoading ? (
          <Loading />
        ) : postsError ? (
          <Error message="게시물을 불러올 수 없습니다." />
        ) : userPosts.length === 0 ? (
          <EmptyState>
            <Text variant="body" color="var(--grey-500)">
              아직 작성한 게시물이 없습니다.
            </Text>
          </EmptyState>
        ) : (
          <PostsList>
            {userPosts.map((post: PostWithRelations) => (
              <PostCard
                key={post.id}
                onClick={() => handlePostClick(post.id)}
              >
                <PostCardHeader>
                  <PostTitle>{post.title}</PostTitle>
                  <PostDate>
                    {dayjs(post.created_at).format("YYYY.MM.DD")}
                  </PostDate>
                </PostCardHeader>
                
                {post.content && (
                  <PostPreview>
                    {post.content.replace(/<[^>]*>/g, "").substring(0, 150)}
                    {post.content.length > 150 ? "..." : ""}
                  </PostPreview>
                )}

                <PostMeta>
                  <MetaItem>조회 {post.view_count || 0}회</MetaItem>
                  {post.score && <MetaItem>점수 {post.score}점</MetaItem>}
                </PostMeta>
              </PostCard>
            ))}
          </PostsList>
        )}
      </PostsSection>
    </ProfilePageContainer>
  );
}

const ProfilePageContainer = styled.div`
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 3rem;

  @media (max-width: 768px) {
    padding: 1rem;
    gap: 2rem;
  }
`;

const ProfileHeader = styled.div`
  display: flex;
  gap: 2rem;
  align-items: flex-start;
  padding: 2rem;
  background: var(--white);
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid var(--grey-200);

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 1.5rem;
    gap: 1.5rem;
  }
`;

const ProfileImageSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
`;

const ProfileInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;

  .user-name {
    color: var(--grey-900);
    margin: 0;
  }
`;

const ProfileDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;

  @media (max-width: 768px) {
    align-items: center;
  }
`;

const DetailItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: var(--grey-700);

  .icon {
    font-size: 1.25rem;
    color: var(--primary-500);
    flex-shrink: 0;
  }
`;

const PostsSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 1rem;
  border-bottom: 2px solid var(--grey-100);

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
`;

const EmptyState = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 4rem 2rem;
  background: var(--grey-50);
  border-radius: 12px;
  border: 2px dashed var(--grey-300);
`;

const PostsList = styled.div`
  display: grid;
  gap: 1.5rem;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
`;

const PostCard = styled.div`
  background: var(--white);
  border: 1px solid var(--grey-200);
  border-radius: 12px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  gap: 1rem;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
    border-color: var(--primary-300);
  }
`;

const PostCardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
`;

const PostTitle = styled.h4`
  color: var(--grey-900);
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0;
  line-height: 1.4;
  flex: 1;
`;

const PostDate = styled.span`
  color: var(--grey-500);
  font-size: 0.875rem;
  font-weight: 500;
  flex-shrink: 0;
`;

const PostPreview = styled.p`
  color: var(--grey-600);
  font-size: 0.875rem;
  line-height: 1.5;
  margin: 0;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
`;

const PostMeta = styled.div`
  display: flex;
  gap: 1rem;
  padding-top: 0.5rem;
  border-top: 1px solid var(--grey-100);
`;

const MetaItem = styled.span`
  color: var(--grey-500);
  font-size: 0.75rem;
  font-weight: 500;
`;