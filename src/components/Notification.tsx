"use client";

import { urlB64ToUint8Array } from "@/utils/utils";
import { PiBellSimpleSlashBold, PiBellRingingBold } from "react-icons/pi";
import { toaster } from "@/components/ui/toaster";
import styled from "@emotion/styled";
import { useProfile } from "@/hooks/useProfile";
import React, { useEffect, useState } from "react";
import { useSubscription } from "@/hooks/useSubscription";

type NotificationPermission = "granted" | "denied" | "default" | "unsupported";

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
    // Notification API가 지원되는지 확인
    if (typeof Notification !== 'undefined') {
      const permission = Notification.permission;
      setNotificationPermission(permission);
    } else {
      // Notification API가 지원되지 않는 환경 (모바일 브라우저 등)
      console.log('이 브라우저는 알림 기능을 지원하지 않습니다.');
      setNotificationPermission('unsupported');
    }
  }, [user?.id]);

  // 알림 권한 요청 처리
  const requestPermission = async () => {
    // Notification API가 지원되지 않는 경우 처리
    if (typeof Notification === 'undefined') {
      console.log('이 브라우저는 알림 기능을 지원하지 않습니다.');
      toaster.create({
        title: "이 브라우저는 알림을 지원하지 않습니다.",
        description: "홈 화면에 추가하거나 데스크톱에서 이용해주세요."
      });
      return;
    }
    
    if (!user?.id) {
      toaster.create({
        title: "로그인이 필요합니다",
        description: "알림을 활성화하려면 먼저 로그인해주세요.",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      
      if (permission === "granted") {
        // 권한이 승인되면 구독 등록
        await subscribeToNotifications();
      } else {
        toaster.create({
          title: "알림 권한이 필요합니다",
          description: "브라우저 설정에서 알림 권한을 허용해주세요.",
          type: "error",
        });
      }
    } catch (error) {
      console.error("알림 권한 요청 오류:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 알림 구독 처리
  const subscribeToNotifications = async () => {
    // Notification API가 지원되지 않는 경우 처리
    if (typeof Notification === 'undefined') {
      return;
    }
    
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        throw new Error("서비스 워커 등록 실패");
      }
      const subscriptionData = await generateSubscription(registration);
      if (!subscriptionData) {
        throw new Error("구독 생성 실패");
      }

      await createSubscription(subscriptionData);
      refreshUser(); // 사용자 정보 새로고침
    } catch (error: any) {
      console.error("알림 구독 오류:", error);
      toaster.create({
        type: "error",
        title: "알림 구독 중 오류가 발생했습니다.",
        description: error.message || "다시 시도해주세요.",
      });
      throw error;
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
  };

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
        onClick={requestPermission}
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
