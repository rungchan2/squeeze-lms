import { MdSpaceDashboard } from "react-icons/md";
import { FaBell, FaPlus } from "react-icons/fa";
import { FaUser } from "react-icons/fa";
import JourneyCard from "@/components/home/space/JourneyCard";
import { useJourney } from "@/hooks/useJourney";
import Spinner from "@/components/common/Spinner";
import styled from "@emotion/styled";
import NoJourney from "./space/NoJourney";
import NotificationCard from "./notification/NotificationCard";
import { useNotifications, markAsRead } from "@/hooks/useNotification";
import MyPage from "./mypage/MyPage";
import { FloatingButton } from "@/components/common/FloatingButton";
import Text from "../Text/Text";
import { useRouter, useSearchParams } from "next/navigation";
import { AdminOnly } from "../auth/AdminOnly";
import { useCallback, useEffect, useRef } from "react";
import { useJourneyStore } from "@/store/journey";
import { useAuth } from "../AuthProvider";
import { Loading } from "../common/Loading";
import Footer from "../common/Footer";
import { toaster } from "../ui/toaster";
import { Tabs } from "@chakra-ui/react";

export default function HomeTab() {
  const { clearCurrentJourneyId } = useJourneyStore();
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab");

  useEffect(() => {
    if (!isAuthenticated && !loading) {
      toaster.create({
        title: "로그인 후 이용해주세요.",
        type: "warning",
      });
      router.push("/login");
    }
  }, [isAuthenticated, loading, router]);

  // 홈탭으로 돌아올 때만 상태 초기화
  useEffect(() => {
    if (currentTab === "home") {
      clearCurrentJourneyId();
    }
  }, [currentTab, clearCurrentJourneyId]);

  if (!isAuthenticated) {
    if (loading) {
      return <Loading />;
    }
    return null;
  }

  return (
    <Tabs.Root key="line" defaultValue="classes" variant="line" fitted>
      <Tabs.List>
        <Tabs.Trigger value="classes">
          <MdSpaceDashboard />
          클라스
        </Tabs.Trigger>
        <Tabs.Trigger value="notifications">
          <FaBell />
          알림
        </Tabs.Trigger>
        <Tabs.Trigger value="profile">
          <FaUser />
          프로필
        </Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="classes">
        <JourneyTab />
      </Tabs.Content>
      <Tabs.Content value="notifications">
        <NotificationTab />
      </Tabs.Content>
      <Tabs.Content value="profile">
        <ProfileTab />
      </Tabs.Content>
    </Tabs.Root>
  );
}

function JourneyTab() {
  const router = useRouter();
  //TODO: 0. 자기가 초대된 조직만 보이게 하기
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
      <Footer />
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
  const {
    notifications,
    error,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useNotifications(10);

  // 무한 스크롤을 위한 인터섹션 옵저버
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastItemRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isFetchingNextPage) return;

      if (observerRef.current) {
        observerRef.current.disconnect();
      }

      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasNextPage) {
          fetchNextPage();
        }
      });

      if (node) {
        observerRef.current.observe(node);
      }
    },
    [isFetchingNextPage, fetchNextPage, hasNextPage]
  );

  // 알림 읽음 처리
  const handleReadNotification = async (notificationId: number) => {
    await markAsRead(notificationId);
    refetch();
  };

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
      {notifications.length === 0 ? (
        <EmptyState>알림이 없습니다.</EmptyState>
      ) : (
        <div className="notification-list">
          {notifications.map((notification, index) => {
            const isLastItem = index === notifications.length - 1;
            return (
              <div key={notification.id} ref={isLastItem ? lastItemRef : null}>
                <NotificationCard
                  notification={notification}
                  readNotification={handleReadNotification}
                />
              </div>
            );
          })}

          {isFetchingNextPage && (
            <div>
              <Spinner size="24px" style={{ marginTop: "12px" }} />
            </div>
          )}
        </div>
      )}
      <Footer />
    </NotificationsContainer>
  );
}

const NotificationsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
  width: 100%;

  .notification-list {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
`;

const EmptyState = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100px;
  width: 100%;
  background-color: var(--grey-100);
  border-radius: 8px;
  margin-top: 16px;
  padding: 16px;
  color: var(--grey-600);
`;

function ProfileTab() {
  return (
    <>
      <MyPage />
      <Footer />
    </>
  );
}
