"use client";

import { Tabs, Tab } from "@/components/tab/Tabs";
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
import { useJourneyStore } from "@/store/journey";
import { Suspense } from "react";
import Spinner from "@/components/common/Spinner";
import { journey } from "@/utils/data/journey";

interface JourneyClientProps {
  slug: string;
  initialData?: any; // 서버에서 받은 여정 데이터
}

export default function JourneyClient({ slug, initialData }: JourneyClientProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const { setCurrentJourneyId } = useJourneyStore();
  
  // 페이지 진입 시 slug 설정 - 한 번만 실행
  useEffect(() => {
    if (!slug) return;
    
    if (isInitialized) return;
    
    const initJourney = async () => {
      try {
        // 서버에서 받은 초기 데이터가 있으면 사용
        if (initialData && initialData.id) {
          setCurrentJourneyId(initialData.id);
          setIsInitialized(true);
          return;
        }
        
        // 초기 데이터가 없으면 클라이언트에서 조회
        const journeyData = await journey.getJourneyByUuidRetrieveId(slug);
        if (journeyData && journeyData.length > 0) {
          setCurrentJourneyId(journeyData[0].id);
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
  }, [slug, setCurrentJourneyId, isInitialized, initialData]);
  
  return (
    <div>
      <Tabs usePath={true} flexDirection="column" preserveContent>
        <Tab title="일정" icon={<FaSchool />} path="plan" key="plan-tab">
          <Suspense fallback={<Spinner />}>
            <PlanTab slug={slug} key={`plan-${slug}`}/>
          </Suspense>
        </Tab>
        <Tab title="미션" icon={<FaCalendarAlt />} path="missions" key="missions-tab">
          <Suspense fallback={<Spinner />}>
            <MissionTab slug={slug} key={`mission-${slug}`}/>
          </Suspense>
        </Tab>
        <Tab title="순위" icon={<VscGraphLine />} path="dashboard" key="dashboard-tab">
          <Suspense fallback={<Spinner />}>
            <DashboardTab slug={slug} key={`dashboard-${slug}`}/>
          </Suspense>
        </Tab>
        <Tab title="피드" icon={<TbMessages />} path="feed" key="feed-tab">
          <Suspense fallback={<Spinner />}>
            <FeedTab slug={slug} key={`feed-${slug}`}/>
          </Suspense>
        </Tab>
        <Tab title="설정" icon={<FiMenu />} path="settings" key="settings-tab">
          <Suspense fallback={<Spinner />}>
            <SettingTab slug={slug} key={`settings-${slug}`}/>
          </Suspense>
        </Tab>
      </Tabs>
    </div>
  );
} 