"use client";

import styled from "@emotion/styled";
import { usePosts, useCompletedMissions } from "@/hooks/usePosts";
import PostCard from "@/components/home/mypage/PostCard";
import { useAuth } from "@/components/AuthProvider";
import Spinner from "@/components/common/Spinner";
import Text from "@/components/Text/Text";
import { useEffect, useRef, useState } from "react";
import { InputGroup } from "@/components/ui/input-group";
import { IoSearch } from "react-icons/io5";
import { Input } from "@chakra-ui/react";
import { FaSortAmountDownAlt, FaSortAmountUpAlt } from "react-icons/fa";
import { IconContainer } from "@/components/common/IconContainer";
import Heading from "@/components/Text/Heading";

export default function FeedTab() {
  const { data: posts, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = usePosts();
  const { id: userId } = useAuth();
  const { completedMissionIds, isLoading: isLoadingCompletedMissions } =
    useCompletedMissions(userId || 0);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortPosts, setSortPosts] = useState<"asc" | "desc">("desc");
  
  // 무한 스크롤을 위한 observer ref
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastPostRef = useRef<HTMLDivElement | null>(null);

  // Intersection Observer 설정
  useEffect(() => {
    if (isLoading) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    const currentObserver = observerRef.current;
    const lastElement = lastPostRef.current;

    if (lastElement && hasNextPage) {
      currentObserver.observe(lastElement);
    }

    return () => {
      if (lastElement) {
        currentObserver.unobserve(lastElement);
      }
    };
  }, [isLoading, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // 로딩 중이면 스피너 표시
  if (isLoading || isLoadingCompletedMissions) {
    return <Spinner />;
  }

  // 검색어로 게시물 필터링
  const filteredPosts = posts?.filter(post => {
    const postTitle = post.title?.toLowerCase() || '';
    const postContent = post.content?.toLowerCase() || '';
    const query = searchQuery.toLowerCase();
    
    return postTitle.includes(query) || postContent.includes(query);
  }) || [];

  // created_at 기준으로 게시물 정렬
  const sortedPosts = [...filteredPosts].sort((a, b) => {
    const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
    
    return sortPosts === "asc" ? dateA - dateB : dateB - dateA;
  });

  const handleSortPosts = () => {
    setSortPosts(sortPosts === "asc" ? "desc" : "asc");
  };

  return (
    <FeedTabContainer>
      <Heading level={3} className="feed-title">
        피드
      </Heading>
      <div className="search-sort-container">
        <InputGroup flex={1} startElement={<IoSearch />} width="100%">
          <Input
            placeholder="게시물 검색"
            width="100%"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </InputGroup>
        <div className="sort-container">
          <Text variant="caption" color="var(--grey-500)">
            {sortPosts === "desc" ? "최신순" : "오래된순"}
          </Text>
          <IconContainer onClick={handleSortPosts}>
            {sortPosts === "asc" ? (
              <FaSortAmountUpAlt />
            ) : (
              <FaSortAmountDownAlt />
            )}
          </IconContainer>
        </div>
      </div>
      
      {sortedPosts.length > 0 ? (
        <div className="posts-container">
          {sortedPosts.map((post: any, index: number) => (
            <div
              key={post.id}
              ref={index === sortedPosts.length - 1 ? lastPostRef : null}
            >
              <PostCard post={post} />
            </div>
          ))}
          {isFetchingNextPage && (
            <div className="loading-more">
              <Spinner size="24px" />
            </div>
          )}
        </div>
      ) : (
        <div className="empty-state">
          <Text color="var(--grey-500)">
            {searchQuery ? "검색 결과가 없습니다." : "게시물이 없습니다."}
          </Text>
        </div>
      )}
    </FeedTabContainer>
  );
}

const FeedTabContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;

  .feed-title {
    margin-bottom: 1rem;
  }
  
  .search-sort-container {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
  }
  
  .sort-container {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    white-space: nowrap;
  }
  
  .posts-container {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .empty-state {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 2rem;
    background-color: var(--grey-50);
    border-radius: 8px;
    border: 1px dashed var(--grey-300);
  }

  .loading-more {
    display: flex;
    justify-content: center;
    padding: 1rem;
  }
`;
