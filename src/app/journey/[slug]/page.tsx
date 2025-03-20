import { getJourney } from "@/app/journey/actions";
import { redirect } from "next/navigation";
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

// params 타입을 Promise로 정의
type Params = Promise<{ slug: string }>;

export default async function JourneyPage({
  params,
}: {
  params: Params;
}) {
  // params 전체를 await
  const resolvedParams = await params;
  const { slug } = resolvedParams;
  const { error } = await getJourney(slug);
  if (error) {
    redirect("/");
  }
  return (
    <div>
      <Tabs usePath={true} flexDirection="column">
        <Tab title="일정" icon={<FaSchool />} path="plan">
          <PlanTab slug={slug}/>
        </Tab>
        <Tab title="미션" icon={<FaCalendarAlt />} path="missions">
          <MissionTab slug={slug}/>
        </Tab>
        <Tab title="순위" icon={<VscGraphLine />} path="dashboard">
          <DashboardTab/>
        </Tab>
        <Tab title="피드" icon={<TbMessages />} path="feed">
          <FeedTab />
        </Tab>
        <Tab title="설정" icon={<FiMenu />} path="settings">
          <SettingTab slug={slug} />
        </Tab>
      </Tabs>
    </div>
  );
}
