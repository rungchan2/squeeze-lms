"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import PostCard from "@/app/(home)/_mypage/PostCard";
import CommentSection from "./CommentSection";
import { useParams, useRouter } from "next/navigation";
import Spinner from "@/components/common/Spinner";
import styled from "@emotion/styled";
import { getPreviousPost, getNextPost } from "@/utils/supabase/post";

// 포스트 네비게이션 아이템 타입
interface PostNavItem {
  id: string;
  title: string;
  created_at: string | null;
}

export default function PostPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.id as string;
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [prevPost, setPrevPost] = useState<PostNavItem | null>(null);
  const [nextPost, setNextPost] = useState<PostNavItem | null>(null);
  const [navLoading, setNavLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function fetchPost() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("posts")
          .select("*, profiles(*), journey_mission_instances(*)")
          .eq("id", postId)
          .single();

        if (error) {
          throw error;
        }

        setPost(data);

        // 조회수 증가
        await supabase
          .from("posts")
          .update({ view_count: (data.view_count || 0) + 1 })
          .eq("id", postId);

        // 이전/다음 게시물 가져오기
        setNavLoading(true);
        if (data.created_at) {
          const previousPost = await getPreviousPost(
            postId,
            data.created_at,
            data.journey_mission_instances?.journey_id || ""
          );
          const nextPost = await getNextPost(
            postId,
            data.created_at,
            data.journey_mission_instances?.journey_id || ""
          );
          setPrevPost(previousPost);
          setNextPost(nextPost);
        }
        setNavLoading(false);
      } catch (err: any) {
        console.error("게시물 로드 오류:", err.message);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (postId) {
      fetchPost();
    }
  }, [postId, supabase]);

  const navigateToPost = (targetId: string) => {
    router.push(`/post/${targetId}`);
  };

  if (loading)
    return (
      <div>
        <Spinner size="medium" />
      </div>
    );
  if (error) return <div style={{ color: "red" }}>Error: {error}</div>;
  if (!post) return <div>게시물을 찾을 수 없습니다.</div>;

  return (
    <PostPageContainer>
        <PostNavigation>
          {prevPost ? (
            <NavButton
              direction="prev"
              onClick={() => navigateToPost(prevPost.id)}
              disabled={navLoading}
            >
              <span className="arrow">◀</span>
              <span className="tooltip">이전</span>
            </NavButton>
          ) : (
            <NavButton direction="prev" disabled>
              <span className="arrow">◀</span>
            </NavButton>
          )}

          {nextPost ? (
            <NavButton
              direction="next"
              onClick={() => navigateToPost(nextPost.id)}
              disabled={navLoading}
            >
              <span className="arrow">▶</span>
              <span className="tooltip">다음</span>
            </NavButton>
          ) : (
            <NavButton direction="next" disabled>
              <span className="arrow">▶</span>
            </NavButton>
          )}
        </PostNavigation>

      <PostCard post={post} showDetails={true} />
      <CommentContainer>
        <CommentSection
          postId={params.id as string}
          enableRealtime={true}
          missionInstanceId={post.mission_instance_id?.id}
          journeyId={post.journey_id || post.journey_mission_instances?.journey_id}
        />
      </CommentContainer>
    </PostPageContainer>
  );
}

const PostPageContainer = styled.div`
  display: flex;
  flex-direction: column;
  max-width: var(--breakpoint-tablet);
  margin: 0 auto;
  position: relative;
  padding-bottom: 120px; /* 댓글 입력 영역의 높이만큼 여백 */
`;

const CommentContainer = styled.div`
  margin-top: 1rem;
`;

const PostNavigation = styled.div`
  position: fixed;
  top: 47%;
  left: 0;
  right: 0;
  transform: translateY(-50%);
  display: flex;
  justify-content: space-between;
  z-index: 10;
  pointer-events: none;
  padding: 0 10px;
  margin: 0 auto;
`;

interface NavButtonProps {
  direction: "prev" | "next";
  disabled?: boolean;
}

const NavButton = styled.button<NavButtonProps>`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  backdrop-filter: blur(10px);
  background-color: var(--grey-100);
  color: var(--black);
  cursor: ${(props) => (props.disabled ? "default" : "pointer")};
  opacity: ${(props) => (props.disabled ? 0.3 : 0.7)};
  pointer-events: ${(props) => (props.disabled ? "none" : "auto")};
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  margin: ${(props) =>
    props.direction === "prev" ? "0 0 0 5px" : "0 5px 0 0"};
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);

  &:hover {
    opacity: ${(props) => (props.disabled ? 0.3 : 1)};
    transform: scale(1.05);

    .tooltip {
      opacity: 1;
      transform: translateY(-50%) translateX(0);
    }
  }

  .arrow {
    font-size: 14px;
    line-height: 1;
  }

  .tooltip {
    font-weight: 600;
    position: absolute;
    top: 50%;
    ${(props) =>
      props.direction === "prev"
        ? "left: calc(100% + 10px); transform: translateY(-50%) translateX(-10px);"
        : "right: calc(100% + 10px); transform: translateY(-50%) translateX(10px);"}
    background-color: var(--neutral-900);
    color: var(--black);
    padding: 5px 10px;
    border-radius: 4px;
    white-space: nowrap;
    opacity: 0;
    transition: all 0.2s;
    pointer-events: none;
    font-size: 12px;
  }

  @media (max-width: 768px) {
    width: 36px;
    height: 36px;
    .arrow {
      font-size: 12px;
    }
  }
`;
