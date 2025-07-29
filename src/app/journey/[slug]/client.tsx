"use client";

import { FaSchool, FaBell } from "react-icons/fa";
import { VscGraphLine } from "react-icons/vsc";
import { TbMessages } from "react-icons/tb";
import { FiMenu } from "react-icons/fi";
import PlanTab from "./_plan/PlanTab";
import FeedTab from "./_feed/FeedTab";
import DashboardTab from "./_dashboard/DashboardTab";
import SettingTab from "./_setting/SettingTab";
import NotificationTab from "@/app/(home)/_notification/NotificationTab";
import { useEffect, useState, useCallback, memo } from "react";
import { Suspense } from "react";
import Spinner from "@/components/common/Spinner";
import { getJourneyByUuidRetrieveId } from "@/utils/data/journey";
import { Tabs } from "@chakra-ui/react";
import styled from "@emotion/styled";
import { useRouter, useSearchParams } from "next/navigation";

interface JourneyClientProps {
  slug: string;
  initialData?: any; // 서버에서 받은 여정 데이터
}

// Memoized Tab Content Wrapper
const TabContentWrapper = memo(({ value, children }: { value: string; children: React.ReactNode }) => {
  return (
    <Tabs.Content value={value}>
      <Suspense fallback={<Spinner />}>
        {children}
      </Suspense>
    </Tabs.Content>
  );
});

TabContentWrapper.displayName = 'TabContentWrapper';

export default function JourneyClient({
  slug,
  initialData,
}: JourneyClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isInitialized, setIsInitialized] = useState(false);

  // URL 파라미터로부터 현재 탭 값 결정
  const getCurrentTab = () => {
    const tab = searchParams.get("tab");
    if (tab && ["plan", "mission", "dashboard", "notifications", "feed", "settings"].includes(tab)) {
      return tab;
    }
    return "plan";
  };

  const currentTab = getCurrentTab();

  // 탭 변경 핸들러 - replace 사용으로 히스토리 스택 최적화
  const handleTabChange = useCallback((details: any) => {
    // Chakra UI Tabs의 onValueChange는 details 객체를 전달하므로 value를 추출
    const newTab = typeof details === 'string' ? details : details.value;
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", newTab);
    // replace를 사용해서 히스토리 스택이 쌓이지 않도록 함
    router.replace(`/journey/${slug}?${params.toString()}`, { scroll: false });
  }, [router, searchParams, slug]);

  // 페이지 진입 시 slug 설정 - 한 번만 실행
  useEffect(() => {
    if (!slug) return;

    if (isInitialized) return;

    const initJourney = async () => {
      try {
        // 서버에서 받은 초기 데이터가 있으면 사용
        if (initialData && initialData.id) {
          setIsInitialized(true);
          return;
        }

        // 초기 데이터가 없으면 클라이언트에서 조회
        const journeyData = await getJourneyByUuidRetrieveId(slug);
        if (journeyData && journeyData.length > 0) {
          setIsInitialized(true);
        } else {
          console.error("[JourneyClient] 여정 데이터 없음");
        }
      } catch (err) {
        console.error("[JourneyClient] 초기화 오류:", err);
      }
    };

    // 실행 지연을 통해 상태 초기화 경쟁 조건 방지
    const timer = setTimeout(initJourney, 10);
    return () => clearTimeout(timer);
  }, [slug, isInitialized, initialData]);

  const triggerStyle = {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column",
    gap: "6px",
  };

  return (
    <PageContainer>
      <PageHeader>
      </PageHeader>
      
      <Tabs.Root 
        value={currentTab} 
        onValueChange={handleTabChange}
        variant="line" 
        width="100%"
        lazyMount
        unmountOnExit={false}
      >
        <Tabs.List width="100%" justifyContent="center">
          <Tabs.Trigger value="plan" {...triggerStyle}>
            <FaSchool />
            일정
          </Tabs.Trigger>
          <Tabs.Trigger value="dashboard" {...triggerStyle}>
            <VscGraphLine />
            순위
          </Tabs.Trigger>
          <Tabs.Trigger value="notifications" {...triggerStyle}>
            <FaBell />
            알림
          </Tabs.Trigger>
          <Tabs.Trigger value="feed" {...triggerStyle}>
            <TbMessages />
            피드
          </Tabs.Trigger>
          <Tabs.Trigger value="settings" {...triggerStyle}>
            <FiMenu />
            설정
          </Tabs.Trigger>
        </Tabs.List>
        <TabContentWrapper value="plan" key="plan-content">
          <PlanTab slug={slug} />
        </TabContentWrapper>
        <TabContentWrapper value="dashboard" key="dashboard-content">
          <DashboardTab slug={slug} />
        </TabContentWrapper>
        <TabContentWrapper value="notifications" key="notifications-content">
          <NotificationTab />
        </TabContentWrapper>
        <TabContentWrapper value="feed" key="feed-content">
          <FeedTab slug={slug} />
        </TabContentWrapper>
        <TabContentWrapper value="settings" key="settings-content">
          <SettingTab slug={slug} />
        </TabContentWrapper>
      </Tabs.Root>
    </PageContainer>
  );
}

const PageContainer = styled.div`
  max-width: var(--breakpoint-tablet);
  margin: 0 auto;
`;

const PageHeader = styled.div`
  
`;
