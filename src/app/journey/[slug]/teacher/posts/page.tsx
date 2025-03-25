"use client";

// TODO: 1. 제출된 과제 통계 확인할 수 있게 하기

import { usePosts } from "@/hooks/usePosts";
import { Table } from "@chakra-ui/react";
import { useAuth } from "@/components/AuthProvider";
import styled from "@emotion/styled";
import { useParams } from "next/navigation";
import { FaRegTrashAlt } from "react-icons/fa";
import { IconContainer } from "@/components/common/IconContainer";
import { posts } from "@/utils/posts/posts";
import dayjs from "@/utils/dayjs/dayjs";
import { toaster } from "@/components/ui/toaster";
import { Loading } from "@/components/common/Loading";
import { Error } from "@/components/common/Error";
export default function TeacherPostsPage() {
  const { slug } = useParams();
  const { data: postsData, isLoading, error } = usePosts(10, slug as string, true);
  const { id: userId } = useAuth();

  //TODO: 2. 과제 통계 확인할 수 있게 하기
  //TODO: 2. ERROR, LOADING 컴포넌트 추가

  const handleDelete = async (postId: number) => {
    if (confirm("정말 삭제하시겠습니까?")) {
      await posts.deletePost(postId);
    }
  };

  const handleHide = async (postId: number, value: string) => {
    if (value === "hide") {
      await posts.hidePost(postId);
      toaster.create({
        title: "게시물이 숨김 처리되었습니다.",
        type: "success",
      });
    } else {
      await posts.unhidePost(postId);
      toaster.create({
        title: "게시물이 숨김 해제되었습니다.",
        type: "success",
      });
    }
  };

  if (isLoading) return <Loading />;
  if (error) return <Error message={error.message} />;

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
            {postsData.map((post) => (
              <Table.Row key={post.id}>
                <Table.Cell>{post.title}</Table.Cell>
                <Table.Cell>
                  {post.profiles?.first_name} {post.profiles?.last_name}
                </Table.Cell>
                <Table.Cell>
                    <select defaultValue={post.is_hidden ? "hide" : "show"} onChange={(e) => handleHide(post.id, e.target.value)}>
                        <option value="show">보임</option>
                        <option value="hide">숨김</option>
                    </select>
                </Table.Cell>
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
