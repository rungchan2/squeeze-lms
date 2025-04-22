"use client";

import { MdSpaceDashboard } from "react-icons/md";
import { FaBell } from "react-icons/fa";
import { FaUser } from "react-icons/fa";
import styled from "@emotion/styled";

import MyPage from "./_mypage/MyPage";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loading } from "@/components/common/Loading";
import Footer from "@/components/common/Footer";
import { toaster } from "@/components/ui/toaster";
import { Tabs, Link } from "@chakra-ui/react";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import JourneyTab from "./_class/JourneyTab";
import NotificationTab from "./_notification/NotificationTab";
import { createClient } from "@/utils/supabase/client";
import { useNotifications } from "@/hooks/useNotification";

export default function HomeTab() {
  const router = useRouter();
  const { isAuthenticated, loading } = useSupabaseAuth();
  const { mutate } = useNotifications();

  // 현재 해시로부터 초기 탭 값 결정
  const getInitialTab = () => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash.replace("#", "");
      if (hash && ["classes", "notifications", "profile"].includes(hash)) {
        return hash;
      }
    }
    return "classes";
  };

  // 토스터 액션에서 탭 전환을 위한 함수

  useEffect(() => {
    const switchToNotificationsTab = () => {
      window.location.hash = "notifications";
      // SWR 캐시 업데이트
      mutate();
      // 해시 변경만으로 탭이 바뀌지 않는 경우 페이지 리로드
      if (window.location.hash === "#notifications") {
        window.location.reload();
      }
    };

    const supabase = createClient();
    const channel = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        (payload) => {
          console.log(payload);
          toaster.create({
            type: "info",
            title: "새로운 알림이 있습니다.",
            description: `${payload.new.message}`,
            action: {
              label: "보기",
              onClick: switchToNotificationsTab,
            },
            duration: 5000,
          });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [router, mutate]);

  useEffect(() => {
    if (!isAuthenticated && !loading) {
      toaster.create({
        title: "로그인 후 이용해주세요.",
        type: "warning",
      });
      router.push("/login");
    }
  }, [isAuthenticated, loading, router]);

  if (!isAuthenticated) {
    if (loading) {
      return <Loading />;
    }
    return null;
  }
  const linkStyle = {
    textDecoration: "none",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  };
  //[ ] 불필요 리 렌더링 해소. 탭별로 컴포넌트 분리하기 및 렌더링 확인

  return (
    <HomeContainer>
      <Tabs.Root
        key="line"
        defaultValue={getInitialTab()}
        variant="line"
        fitted
      >
        <Tabs.List>
          <Tabs.Trigger value="classes" asChild>
            <Link unstyled href="#classes" style={linkStyle}>
              <MdSpaceDashboard />
              클라스
            </Link>
          </Tabs.Trigger>
          <Tabs.Trigger value="notifications" asChild>
            <Link unstyled href="#notifications" style={linkStyle}>
              <FaBell />
              알림
            </Link>
          </Tabs.Trigger>
          <Tabs.Trigger value="profile" asChild>
            <Link unstyled href="#profile" style={linkStyle}>
              <FaUser />
              프로필
            </Link>
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
