"use client";

// TODO: 1. 제출된 과제 통계 확인할 수 있게 하기

import { usePosts } from "@/hooks/usePosts";
import { Table } from "@chakra-ui/react";
import { useAuth } from "@/components/AuthProvider";
import styled from "@emotion/styled";
import { useParams } from "next/navigation";
import { FaRegTrashAlt } from "react-icons/fa";
import { IconContainer } from "@/components/common/IconContainer";
import { deletePost } from "@/app/journey/actions";
import dayjs from "@/utils/dayjs/dayjs";
import Spinner from "@/components/common/Spinner";
export default function TeacherPostsPage() {
  const { slug } = useParams();
  const { data: posts, isLoading, error } = usePosts(10, slug as string);
  const { id: userId } = useAuth();

  const handleDelete = async (postId: number) => {
    if (confirm("정말 삭제하시겠습니까?")) {
      await deletePost(postId);
    }
  };
  if (isLoading) return <Spinner />;

  return (
    <TeacherPostsPageContainer>
      <Table.Root key="outline" size="sm" variant="outline">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader>제목</Table.ColumnHeader>
              <Table.ColumnHeader>작성자</Table.ColumnHeader>
              <Table.ColumnHeader>숨김</Table.ColumnHeader>
              <Table.ColumnHeader>제출날짜</Table.ColumnHeader>
              <Table.ColumnHeader>삭제</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {posts.map((post) => (
              <Table.Row key={post.id}>
                <Table.Cell>{post.title}</Table.Cell>
                <Table.Cell>
                  {post.profiles?.first_name} {post.profiles?.last_name}
                </Table.Cell>
                <Table.Cell>{post.is_hidden ? "숨김" : "보임"}</Table.Cell>
                <Table.Cell>{dayjs(post.created_at).format("YYYY-MM-DD")}</Table.Cell>
                <Table.Cell textAlign="end">
                  <IconContainer
                    onClick={() => handleDelete(post.id)}
                    hoverColor="var(--negative-600)"
                    iconColor="var(--negative-600)"
                  >
                    <FaRegTrashAlt />
                  </IconContainer>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </TeacherPostsPageContainer>
    );
}

const TeacherPostsPageContainer = styled.div`
  background-color: var(--white);
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;
