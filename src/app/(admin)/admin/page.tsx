"use client";
import { useOrganization } from "@/hooks/useOrganization";
import { useAuth } from "@/components/AuthProvider";
import { Error } from "@/components/common/Error";
import { Tabs } from "@chakra-ui/react"
import OrganizationManagement from "./OrganizationManagement";
import { LuUser, LuFolder, LuSquareCheck } from "react-icons/lu";
import styled from "@emotion/styled";
export default function AdminPage() {
  const { isAuthenticated, role } = useAuth();

  const {
    data: { useOrganizationList },
  } = useOrganization();
  const { organizations } = useOrganizationList();
  const organizationOptions = organizations?.map((organization) => ({
    label: organization.name,
    value: organization.id,
  }));
  if (!isAuthenticated || role !== "admin") {
    return <Error message="관리자 권한이 없습니다." />;
  }

  return (
    <AdminPageContainer>
      <Tabs.Root defaultValue="members" variant="plain">
      <Tabs.List bg="bg.muted" rounded="l3" p="1">
        <Tabs.Trigger value="members">
          <LuUser />
          소속
        </Tabs.Trigger>
        <Tabs.Trigger value="projects">
          <LuFolder />
          회원
        </Tabs.Trigger>
        <Tabs.Trigger value="tasks">
          <LuSquareCheck />
          게시글
        </Tabs.Trigger>
        <Tabs.Indicator rounded="l2" />
      </Tabs.List>
      <Tabs.Content value="members">
        <OrganizationManagement />
      </Tabs.Content>
      <Tabs.Content value="projects">기능 구현중입니다.</Tabs.Content>
      <Tabs.Content value="tasks">기능 구현중입니다.</Tabs.Content>
    </Tabs.Root>
    </AdminPageContainer>
  );
}

const AdminPageContainer = styled.div`
  max-width: var(--breakpoint-tablet);
  margin: 0 auto;
  width: 100%;
`;

//TODO: 2. 어드민패널 페이지 만들기
