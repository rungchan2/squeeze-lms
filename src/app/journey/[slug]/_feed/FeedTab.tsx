"use client";

import styled from "@emotion/styled";
import { usePosts } from "@/hooks/usePosts";
import PostCard from "@/app/(home)/_mypage/PostCard";
import Spinner from "@/components/common/Spinner";
import Text from "@/components/Text/Text";
import { useEffect, useRef, useState, useCallback } from "react";
import { InputGroup } from "@/components/ui/input-group";
import { IoSearch } from "react-icons/io5";
import { Input } from "@chakra-ui/react";
import { FaSortAmountDownAlt, FaSortAmountUpAlt } from "react-icons/fa";
import { IconContainer } from "@/components/common/IconContainer";
import Heading from "@/components/Text/Heading";
import Footer from "@/components/common/Footer";

export default function FeedTab({ slug }: { slug: string }) {
  const { data: posts, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = usePosts(10, slug);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortPosts, setSortPosts] = useState<"asc" | "desc">("desc");

  //TODO: 1. 게시물 필터
  
  // 무한 스크롤을 위한 observer ref
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

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
  
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage]
  );

  // Intersection Observer 설정
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(handleObserver, {
      threshold: 0.1,
    });

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [handleObserver, sortedPosts]);

  const handleSortPosts = () => {
    setSortPosts(sortPosts === "asc" ? "desc" : "asc");
  };

  // 로딩 중이면 스피너 표시
  if (isLoading) {
    return <Spinner />;
  }

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
          {sortedPosts.map((post: any) => (
            <div key={post.id}>
              <PostCard post={post} />
            </div>
          ))}
          <div ref={loadMoreRef} className="loading-more">
            {isFetchingNextPage && <Spinner size="24px" />}
            {!hasNextPage && sortedPosts.length > 0 && (
              <Text variant="caption" color="var(--grey-500)">
                더 이상 게시물이 없습니다.
              </Text>
            )}
          </div>
        </div>
      ) : (
        <div className="empty-state">
          <Text color="var(--grey-500)">
            {searchQuery ? "검색 결과가 없습니다." : "게시물이 없습니다."}
          </Text>
        </div>
      )}
      <Footer />
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
