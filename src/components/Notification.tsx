"use client";

import { createClient } from "@/utils/supabase/client";
import { urlB64ToUint8Array } from "@/utils/utils";
import { PiBellSimpleSlashBold, PiBellRingingBold } from "react-icons/pi";
import { toaster } from "@/components/ui/toaster";
import styled from "@emotion/styled";
import { useProfile } from "@/hooks/useProfile";
import React, { useEffect, useState } from "react";
import { useSubscription } from "@/hooks/useSubscription";

type NotificationPermission = "granted" | "denied" | "default";

export default function NotificationRequest() {
  const { data: user, mutate: refreshUser } = useProfile();
  const [isLoading, setIsLoading] = useState(false);
  const {
    subscription,
    createSubscription,
    deleteSubscription,
  } = useSubscription(user?.id ?? "");
  const [notificationPermission, setNotificationPermission] =
    useState<NotificationPermission>("default");

  // 페이지 로드 시 알림 권한과 구독 상태 확인
  useEffect(() => {
    const permission = Notification.permission;
    setNotificationPermission(permission);
  }, [user?.id]);

  // 알림 권한 요청 및 구독 처리
  const enableNotifications = async () => {
    if (!user?.id) {
      toaster.create({
        title: "로그인이 필요합니다",
        description: "알림을 활성화하려면 먼저 로그인해주세요.",
      });
      return;
    }

    setIsLoading(true);

    try {
      if ("Notification" in window) {
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
          setNotificationPermission(permission);
        } else {
          toaster.create({
            title: "알림 권한이 필요합니다",
            description: "브라우저 설정에서 알림 권한을 허용해주세요.",
            type: "error",
          });
          return;
        }
        const registration = await navigator.serviceWorker.getRegistration();
        if (!registration) {
          throw new Error("서비스 워커 등록 실패");
        }
        const subscriptionData = await generateSubscription(registration);
        if (!subscriptionData) {
          throw new Error("구독 생성 실패");
        }

        if (permission === "granted") {
          await createSubscription(subscriptionData);
          refreshUser(); // 사용자 정보 새로고침
        } else {
          toaster.create({
            title: "알림 권한이 필요합니다",
            description: "브라우저 설정에서 알림 권한을 허용해주세요.",
          });
        }
      } else {
        toaster.create({
          title: "이 브라우저는 알림을 지원하지 않습니다.",
        });
      }
    } catch (error: any) {
      console.error("알림 활성화 오류:", error);
      toaster.create({
        type: "error",
        title: "알림 활성화 중 오류가 발생했습니다.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!("serviceWorker" in navigator)) {
    return null;
  }
  

  // 구독 정보 생성 및 저장
  const generateSubscription = async (
    registration: ServiceWorkerRegistration
  ) => {
    if (!user?.id) return;

    try {
      const applicationServerKey = urlB64ToUint8Array(
        process.env.NEXT_PUBLIC_VAPID_KEY!
      );

      const subscriptionOptions = {
        applicationServerKey,
        userVisibleOnly: true,
      };

      const subscription = await registration.pushManager.subscribe(
        subscriptionOptions
      );
      return subscription;
    } catch (error) {
      console.error("구독 생성 오류:", error);
      throw error;
    }
  };``

  // 알림 비활성화 처리
  const disableNotifications = async () => {
    if (!user?.id) return;

    setIsLoading(true);

    try {
      // 브라우저 구독 취소
      if ("serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          const subscription = await registration.pushManager.getSubscription();
          if (subscription) {
            await subscription.unsubscribe();
          }
        }
      }

      // 데이터베이스에서 구독 정보 삭제
      await deleteSubscription();

      refreshUser(); // 사용자 정보 새로고침

      toaster.create({
        title: "알림 비활성화 완료",
        description: "더 이상 스퀴즈 알림을 받지 않습니다.",
        duration: 1000,
      });
    } catch (error: any) {
      console.error("알림 비활성화 오류:", error);
      toaster.create({
        title: "알림 비활성화 중 오류가 발생했습니다.",
        description: error.message || "다시 시도해주세요.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 알림 상태에 따른 아이콘 및 동작 결정
  const renderNotificationIcon = () => {
    if (isLoading) {
      return <LoadingSpinner />;
    }

    // 알림이 활성화된 경우 (알림 권한 있고 실제 구독도 되어 있음)
    if (notificationPermission === "granted" && subscription) {
      return (
        <PiBellRingingBold
          onClick={disableNotifications}
          title="알림 비활성화"
        />
      );
    }

    // 알림이 비활성화된 경우
    return (
      <PiBellSimpleSlashBold
        onClick={enableNotifications}
        title="알림 활성화"
      />
    );
  };

  return (
    <NotificationContainer>{renderNotificationIcon()}</NotificationContainer>
  );
}

const NotificationContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 20px;
  width: 36px;
  height: 36px;

  &:hover {
    background-color: rgba(0, 0, 0, 0.05);
    border-radius: 50%;
  }
`;

const LoadingSpinner = styled.div`
  width: 18px;
  height: 18px;
  border: 2px solid rgba(0, 0, 0, 0.1);
  border-top: 2px solid var(--primary-500);
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;
