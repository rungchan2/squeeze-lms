"use client";

import { MdSpaceDashboard } from "react-icons/md";
import { FaBell, FaPlus } from "react-icons/fa";
import { FaUser } from "react-icons/fa";
import JourneyCard from "@/app/(home)/_class/JourneyCard";
import { useJourney } from "@/hooks/useJourney";
import Spinner from "@/components/common/Spinner";
import styled from "@emotion/styled";
import NoJourney from "./_class/NoJourney";
import NotificationCard from "./_notification/NotificationCard";
import { useNotifications, markAsRead } from "@/hooks/useNotification";
import MyPage from "./_mypage/MyPage";
import { FloatingButton } from "@/components/common/FloatingButton";
import Text from "@/components/Text/Text";
import { useRouter, useSearchParams } from "next/navigation";
import { AdminOnly } from "@/components/auth/AdminOnly";
import { useCallback, useEffect, useRef, useMemo } from "react";
import { useJourneyStore } from "@/store/journey";
import { useAuth } from "@/components/AuthProvider";
import { Loading } from "@/components/common/Loading";
import Footer from "@/components/common/Footer";
import { toaster } from "@/components/ui/toaster";
import { Tabs } from "@chakra-ui/react";
import { useJourneyUser } from "@/hooks/useJourneyUser";

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
    <HomeContainer>
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
    </HomeContainer>
  );
}

function JourneyTab() {
  const router = useRouter();
  const { role, id: userId } = useAuth();
  const isAdmin = role === "admin";
  
  // 모든 여정 데이터 가져오기
  const { journeys, error, isLoading } = useJourney();
  
  // 현재 사용자가 참여 중인 여정 목록 가져오기
  const { 
    data: userJourneys, 
    isLoading: userJourneysLoading,
    error: userJourneysError
  } = useJourneyUser(0); // 0을 전달하면 특정 여정이 아닌 사용자의 모든 여정 참여 정보를 가져올 수 있음
  
  // 사용자가 참여 중인 여정 ID 목록 생성
  const userJourneyIds = useMemo(() => {
    if (!userJourneys) return [];
    // 새로운 데이터 구조에 맞게 수정 (journeys 필드에서 id 추출)
    return userJourneys.map(journey => 
      journey.journeys?.id || journey.journey_id
    ).filter(id => id !== null) as number[];
  }, [userJourneys]);
  
  // 권한에 따라 표시할 여정 목록 필터링
  const filteredJourneys = useMemo(() => {
    if (isAdmin) {
      // 관리자는 모든 여정 볼 수 있음
      return journeys || [];
    } else {
      // 일반 사용자는 참여 중인 여정만 볼 수 있음
      return (journeys || []).filter(journey => 
        userJourneyIds.includes(journey.id)
      );
    }
  }, [isAdmin, journeys, userJourneyIds]);
  
  // 에러 처리
  if (error) {
    return (
      <div>
        <Text variant="body" color="red">Error: {error.message}</Text>
      </div>
    );
  }
  
  if (userJourneysError && !isAdmin) {
    return (
      <div>
        <Text variant="body" color="red">사용자 여정 정보를 불러오는 중 오류가 발생했습니다.</Text>
      </div>
    );
  }
  
  // 로딩 중 표시
  const isPageLoading = isLoading || (!isAdmin && userJourneysLoading);
  
  return (
    <JourneysContainer>
      {isPageLoading ? (
        <div>
          <Spinner size="32px" />
        </div>
      ) : filteredJourneys.length > 0 ? (
        filteredJourneys.map((journey) => (
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

const HomeContainer = styled.div`
  max-width: var(--breakpoint-tablet);
  margin: 0 auto;
  .noJourney {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  .notificationCard {
    width: 100%;
    position: relative;
    border-radius: 10px;
    background-color: #fff;
    display: flex;
    flex-direction: column;
    padding: 10px 15px;
    box-sizing: border-box;
    text-align: left;
    font-size: 14px;
    color: #000;
    box-shadow: 0 0 10px 0 rgba(0, 0, 0, 0.1);

    &:hover {
      background-color: var(--grey-100);
      cursor: pointer;
    }
  }

  .contentContainer {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;
    gap: 15px;
    flex: 1;
  }

  .notificationIcon {
    width: 28px;
    position: relative;
    height: 32px;
  }

  .textContainer {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: flex-start;
  }

  .notificationTitle {
    align-self: stretch;
    position: relative;
    line-height: 28px;
    font-weight: 600;
  }

  .dateContainer {
    align-self: stretch;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;
    gap: 5px;
    text-align: center;
    font-size: 12px;
    color: #9b918d;
  }

  .dateLabel {
    position: relative;
    line-height: 24px;
  }

  .dateValue {
    position: relative;
    line-height: 24px;
  }

  .menuIcon {
    width: 13.5px;
    position: relative;
    height: 3.5px;
  }
  .dots {
    color: var(--grey-500);

    &:hover {
      color: var(--grey-600);
    }
  }

  .modalContent {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: flex-start;
    gap: 8px;
  }

  .typeContainer {
    background-color: var(--primary-400);
    padding: 4px 8px;
    border-radius: 4px;
    color: #fff;
    font-weight: 700;
  }
  .link {
    color: var(--primary-400);
    cursor: pointer;
    &:hover {
      color: var(--primary-500);
      text-decoration: underline;
    }
  }

  .buttonContainer {
    align-self: flex-end;
    margin-top: 10px;
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 8px;
  }

  .dotsContainer {
    color: var(--grey-500);
    padding: 4px;
    border-radius: 50%;
    &:hover {
      color: var(--grey-600);
      cursor: pointer;
      background-color: var(--grey-200);
    }
  }

  .dropdownItems {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: flex-start;
    gap: 4px;
  }
`;
