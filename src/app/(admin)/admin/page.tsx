"use client";
import { useOrganization } from "@/hooks/useOrganization";
import { Error } from "@/components/common/Error";
import { Tabs } from "@chakra-ui/react";
import OrganizationManagement from "./OrganizationManagement";
import { LuUser, LuFolder, LuSquareCheck } from "react-icons/lu";
import styled from "@emotion/styled";
import MissionManagement from "./MissionManagement";
import UserManagement from "./UserManagement";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";  

export default function AdminPage() {
  const { isAuthenticated, role } = useSupabaseAuth();

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
      <Tabs.Root key="line" defaultValue="organization" variant="line" fitted>
        <Tabs.List>
          <Tabs.Trigger value="organization">
            <LuUser />
            소속
          </Tabs.Trigger>
          <Tabs.Trigger value="projects">
            <LuFolder />
            미션 관리
          </Tabs.Trigger>
          <Tabs.Trigger value="posts">
            <LuSquareCheck />
            회원 관리
          </Tabs.Trigger>
          <Tabs.Indicator rounded="l2" />
        </Tabs.List>
        <Tabs.Content value="organization">
          <OrganizationManagement />
        </Tabs.Content>
        <Tabs.Content value="projects">
          <MissionManagement />
        </Tabs.Content>
        <Tabs.Content value="posts">
          <UserManagement />
        </Tabs.Content>
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
