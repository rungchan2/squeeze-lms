"use client";

import { FaSchool, FaCalendarAlt } from "react-icons/fa";
import { VscGraphLine } from "react-icons/vsc";
import { TbMessages } from "react-icons/tb";
import { FiMenu } from "react-icons/fi";
import PlanTab from "./_plan/PlanTab";
import MissionTab from "./_mission/MissionTab";
import FeedTab from "./_feed/FeedTab";
import DashboardTab from "./_dashboard/DashboardTab";
import SettingTab from "./_setting/SettingTab";
import { useEffect, useState } from "react";
import { Suspense } from "react";
import Spinner from "@/components/common/Spinner";
import { journey } from "@/utils/data/journey";
import { Tabs } from "@chakra-ui/react";

interface JourneyClientProps {
  slug: string;
  initialData?: any; // 서버에서 받은 여정 데이터
}

export default function JourneyClient({
  slug,
  initialData,
}: JourneyClientProps) {
  const [isInitialized, setIsInitialized] = useState(false);

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
        const journeyData = await journey.getJourneyByUuidRetrieveId(slug);
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
    <div style={{ maxWidth: "var(--breakpoint-tablet)", margin: "0 auto" }}>
      <Tabs.Root defaultValue="plan" key={slug} variant="line" width="100%">
        <Tabs.List width="100%" justifyContent="center">
          <Tabs.Trigger value="plan" {...triggerStyle}>
            <FaSchool />
            일정
          </Tabs.Trigger>
          <Tabs.Trigger value="mission" {...triggerStyle}>
            <FaCalendarAlt />
            미션
          </Tabs.Trigger>
          <Tabs.Trigger value="dashboard" {...triggerStyle}>
            <VscGraphLine />
            순위
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
        <Tabs.Content value="plan">
          <Suspense fallback={<Spinner />}>
            <PlanTab slug={slug} key={`plan-${slug}`} />
          </Suspense>
        </Tabs.Content>
        <Tabs.Content value="mission">
          <Suspense fallback={<Spinner />}>
            <MissionTab slug={slug} key={`mission-${slug}`} />
          </Suspense>
        </Tabs.Content>
        <Tabs.Content value="dashboard">
          <Suspense fallback={<Spinner />}>
            <DashboardTab slug={slug} key={`dashboard-${slug}`} />
          </Suspense>
        </Tabs.Content>
        <Tabs.Content value="feed">
          <Suspense fallback={<Spinner />}>
            <FeedTab slug={slug} key={`feed-${slug}`} />
          </Suspense>
        </Tabs.Content>
        <Tabs.Content value="settings">
          <Suspense fallback={<Spinner />}>
            <SettingTab slug={slug} key={`settings-${slug}`} />
          </Suspense>
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}

const VerticalTaab = ({ children }: { children: React.ReactNode }) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "6px",
        width: "100%",
      }}
    >
      {children}
    </div>
  );
};
