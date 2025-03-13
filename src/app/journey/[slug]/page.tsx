import { getJourney } from "@/app/journey/actions";
import { redirect } from "next/navigation";
import { Tabs, Tab } from "@/components/tab/Tabs";
import { FaSchool, FaCalendarAlt } from "react-icons/fa";
import { VscGraphLine } from "react-icons/vsc";
import { TbMessages } from "react-icons/tb";
import { FiMenu } from "react-icons/fi";
import PlanPage from "./_tabs/PlanPage";

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
  
  const { data, error } = await getJourney(slug);
  if (error) {
    redirect("/");
  }
  return (
    <div>
      <Tabs usePath={true} flexDirection="column">
        <Tab title="일정" icon={<FaSchool />} path="plan">
          <PlanPage />
        </Tab>
        <Tab title="미션" icon={<FaCalendarAlt />} path="schedule">
          <div>
            <h1>여행 정보2</h1>
          </div>
        </Tab>
        <Tab title="순위" icon={<VscGraphLine />} path="dashboard">
          <div>
            <h1>여행 정보3</h1>
          </div>
        </Tab>
        <Tab title="피드" icon={<TbMessages />} path="discussion">
          <div>
            <h1>여행 정보4</h1>
          </div>
        </Tab>
        <Tab title="설정" icon={<FiMenu />} path="settings">
          <div>
            <h1>여행 정보5</h1>
          </div>
        </Tab>
      </Tabs>
    </div>
  );
}
