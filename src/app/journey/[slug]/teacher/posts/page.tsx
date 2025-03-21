"use client";

// TODO: 1. 제출된 과제 관리 페이지 만들기

import { usePosts } from "@/hooks/usePosts";
import { Table } from "@chakra-ui/react";
import { useAuth } from "@/components/AuthProvider";
import styled from "@emotion/styled";

export default function TeacherPostsPage() {
  const {
    data: posts,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = usePosts();
  const { id: userId } = useAuth();
  return (
    <TeacherPostsPageContainer>
        
    </TeacherPostsPageContainer>
  );
}

const TeacherPostsPageContainer = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;
