import { Tabs, Tab } from "@/components/tab/Tabs";
import { MdSpaceDashboard } from "react-icons/md";
import { FaBell, FaPlus } from "react-icons/fa";
import { FaUser } from "react-icons/fa";
import JourneyCard from "@/components/home/space/JourneyCard";
import { useJourney } from "@/hooks/useJourney";
import Spinner from "@/components/common/Spinner";
import styled from "@emotion/styled";
import NoJourney from "./space/NoJourney";
import NotificationCard from "./notification/NotificationCard";
import { useNotification } from "@/hooks/useNotification";
import MyPage from "./mypage/MyPage";
import { FloatingButton } from "@/components/common/FloatingButton";
import Text from "../Text/Text";
import { useRouter } from "next/navigation";
import { AdminOnly } from "../auth/AdminOnly";

export default function HomeTab() {

  return (
    <Tabs usePath={true}>
      <Tab title="내 조직" icon={<MdSpaceDashboard />} path="home">
        <JourneyTab />
      </Tab>
      <Tab title="알림" icon={<FaBell />} path="notifications">
        <NotificationTab />
      </Tab>
      <Tab title="프로필" icon={<FaUser />} path="profile">
        <ProfileTab />
      </Tab>
    </Tabs>
  );
}

function JourneyTab() {
  const router = useRouter();
  const { journeys, error, isLoading } = useJourney();
  if (error) {
    return <div>Error: {error.message}</div>;
  }
  
  return (
    <JourneysContainer>
      {isLoading ? (
        <div>
          <Spinner size="32px" />
        </div>
      ) : journeys.length > 0 ? (
        journeys.map((journey) => (
          <JourneyCard journey={journey} key={journey.id} />
        ))
      ) : (
        <NoJourney />
      )}
      <AdminOnly>
        <FloatingButton onClick={() => router.push("/create-journey")}>
          <FaPlus />
          <Text variant="body" fontWeight="bold" color="var(--white)">
            새 조직
          </Text>
        </FloatingButton>
      </AdminOnly>
    </JourneysContainer>
  );
}

const JourneysContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
`;

function NotificationTab() {
  const { data, isLoading, error, readNotification } = useNotification();
  
  if (error) {
    return <div>Error: {error.message}</div>;
  }
  if (isLoading) {
    return (
      <div>
        <Spinner size="32px" style={{ marginTop: "12px" }} />
      </div>
    );
  }
  return (
    <NotificationsContainer>
      {data?.map((notification) => (
        <NotificationCard
          key={notification.id}
          notification={notification}
          readNotification={readNotification}
        />
      ))}
    </NotificationsContainer>
  );
}

const NotificationsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
`;

function ProfileTab() {
  return <MyPage />;
}
