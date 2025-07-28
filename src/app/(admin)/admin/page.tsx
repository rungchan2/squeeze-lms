"use client";
import { Error } from "@/components/common/Error";
import { Tabs } from "@chakra-ui/react";
import OrganizationManagement from "./OrganizationManagement";
import { FaBuilding, FaTasks, FaUsers } from "react-icons/fa";
import styled from "@emotion/styled";
import MissionManagement from "./MissionManagement";
import UserManagement from "./UserManagement";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { Stack } from "@chakra-ui/react";

export default function AdminPage() {
  const { isAuthenticated, role } = useSupabaseAuth();


  if (!isAuthenticated || role !== "admin") {
    return <Error message="관리자 권한이 없습니다." />;
  }

  return (
    <AdminPageContainer>
      <AdminHeader>
        <Stack direction="row" alignItems="center" gap={3}>
          <AdminIcon>⚙️</AdminIcon>
          <div>
            <AdminTitle>관리자 대시보드</AdminTitle>
            <AdminSubtitle>시스템 관리 및 설정</AdminSubtitle>
          </div>
        </Stack>
      </AdminHeader>

      <AdminTabs>
        <Tabs.Root key="line" defaultValue="organization" variant="line">
          <TabsList>
            <Tabs.Trigger value="organization">
              <TabContent>
                <FaBuilding size={16} />
                <span>소속 관리</span>
              </TabContent>
            </Tabs.Trigger>
            <Tabs.Trigger value="projects">
              <TabContent>
                <FaTasks size={16} />
                <span>미션 관리</span>
              </TabContent>
            </Tabs.Trigger>
            <Tabs.Trigger value="posts">
              <TabContent>
                <FaUsers size={16} />
                <span>회원 관리</span>
              </TabContent>
            </Tabs.Trigger>
            <Tabs.Indicator rounded="l2" />
          </TabsList>
          
          <TabContentContainer>
            <Tabs.Content value="organization">
              <OrganizationManagement />
            </Tabs.Content>
            <Tabs.Content value="projects">
              <MissionManagement />
            </Tabs.Content>
            <Tabs.Content value="posts">
              <UserManagement />
            </Tabs.Content>
          </TabContentContainer>
        </Tabs.Root>
      </AdminTabs>
    </AdminPageContainer>
  );
}

const AdminPageContainer = styled.div`
  min-height: 100vh;
  background-color: var(--grey-25);
`;

const AdminHeader = styled.div`
  background: white;
  padding: 32px 24px;
  border-bottom: 1px solid var(--grey-200);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const AdminIcon = styled.div`
  font-size: 32px;
  line-height: 1;
`;

const AdminTitle = styled.h1`
  font-size: 24px;
  font-weight: bold;
  color: var(--grey-900);
  margin: 0 0 4px 0;
`;

const AdminSubtitle = styled.p`
  font-size: 14px;
  color: var(--grey-600);
  margin: 0;
`;

const AdminTabs = styled.div`
  background: white;
  margin-top: 0;
`;

const TabsList = styled(Tabs.List)`
  background: var(--grey-50);
  border-bottom: 1px solid var(--grey-200);
  padding: 0 24px;
  
  [data-part="trigger"] {
    padding: 16px 24px;
    font-weight: 500;
    color: var(--grey-600);
    border: none;
    background: transparent;
    
    &[data-state="active"] {
      color: var(--primary-600);
      background: transparent;
    }
    
    &:hover {
      color: var(--primary-500);
      background: rgba(59, 130, 246, 0.05);
    }
  }
`;

const TabContent = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const TabContentContainer = styled.div`
  [data-part="content"] {
    padding: 0;
    background: transparent;
  }
`;
