"use client";

import React, { useState, useEffect } from "react";
import { sendNotification } from "@/app/journey/[slug]/actions";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import styled from "@emotion/styled";
import { createClient } from "@/utils/supabase/client";

const NotificationContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid var(--primary-300);
  border-radius: 0.5rem;
  max-width: 400px;
`;

const Button = styled.button`
  background-color: var(--primary-500);
  color: white;
  border: none;
  border-radius: 0.25rem;
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-weight: 500;
  
  &:hover {
    background-color: var(--primary-600);
  }
  
  &:disabled {
    background-color: var(--gray-300);
    cursor: not-allowed;
  }
`;

const Input = styled.input`
  padding: 0.5rem;
  border: 1px solid var(--gray-300);
  border-radius: 0.25rem;
  width: 100%;
`;

const StatusMessage = styled.p<{ isError?: boolean }>`
  color: ${props => props.isError ? 'var(--red-500)' : 'var(--green-500)'};
  font-size: 0.875rem;
`;

const SubscriptionInfo = styled.pre`
  font-size: 0.75rem;
  background-color: #f0f0f0;
  padding: 0.5rem;
  border-radius: 0.25rem;
  overflow: auto;
  max-height: 200px;
  word-break: break-all;
  white-space: pre-wrap;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

const StatusValue = styled.span`
  font-weight: bold;
`;

const FormGroup = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

export default function NotificationTest() {
  const { id: userId } = useSupabaseAuth();
  const [permission, setPermission] = useState<NotificationPermission | "unknown">("unknown");
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [message, setMessage] = useState("새로운 알림이 도착했습니다!");
  const [title, setTitle] = useState("스퀴즈 알림");
  const [notificationUrl, setNotificationUrl] = useState("/");
  const [status, setStatus] = useState("");
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [subscriptionInfo, setSubscriptionInfo] = useState<string>("");
  const [marketingOptIn, setMarketingOptIn] = useState<boolean | null>(null);

  useEffect(() => {
    const checkNotificationStatus = async () => {
      if (!userId) return;
      
      // 브라우저 알림 권한 상태 확인
      if ("Notification" in window) {
        const permission = Notification.permission;
        setPermission(permission);
      }
      
      try {
        const supabase = createClient();
        
        // 구독 여부 확인 (subscriptions 테이블에서)
        const { data, error } = await supabase
          .from("subscriptions")
          .select("id, notification_json")
          .eq("user_id", userId)
          .maybeSingle();
        
        if (error) {
          console.error("구독 상태 확인 오류:", error);
          return;
        }
        
        // 구독 데이터가 있으면 hasSubscription = true
        setHasSubscription(!!data);
        
        if (data?.notification_json) {
          setSubscriptionInfo(
            typeof data.notification_json === 'string'
              ? data.notification_json
              : JSON.stringify(data.notification_json, null, 2)
          );
        }
        
        // 별도로 마케팅 수신 동의 여부 확인 (profiles 테이블에서)
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("marketing_opt_in")
          .eq("id", userId)
          .single();
        
        if (profileError) {
          console.error("마케팅 수신 동의 상태 확인 오류:", profileError);
          return;
        }
        
        setMarketingOptIn(profileData?.marketing_opt_in || false);
      } catch (error) {
        console.error("상태 확인 중 오류 발생:", error);
      }
    };
    
    checkNotificationStatus();
  }, [userId]);

  useEffect(() => {
    // 이미 등록된 서비스 워커와 구독 정보 확인
    const checkExistingSubscription = async () => {
      if ("serviceWorker" in navigator && "PushManager" in window) {
        try {
          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.getSubscription();
          
          if (subscription) {
            console.log("기존 구독 정보 발견:", subscription);
            setSubscription(subscription);
            
            // 이미 구독이 있으면 자동으로 서버에 저장
            if (userId) {
              await saveSubscription(subscription);
            }
          }
        } catch (error) {
          console.error("구독 확인 오류:", error);
        }
      }
    };
    
    if (permission === "granted") {
      checkExistingSubscription();
    }
  }, [permission, userId]);

  const saveSubscription = async (subscription: PushSubscription) => {
    try {
      setIsLoading(true);
      console.log("구독 정보 저장 시도:", subscription);

      // 직접 Supabase를 사용하여 구독 정보 저장
      const supabase = createClient();
      
      // 먼저 기존 구독 정보 삭제
      await supabase
        .from("subscriptions")
        .delete()
        .eq("user_id", userId);
      
      // 새 구독 정보 저장
      const { error } = await supabase
        .from("subscriptions")
        .insert({
          user_id: userId,
          notification_json: JSON.stringify(subscription)
        });

      if (error) {
        throw new Error(error.message);
      }

      setStatus(`구독이 저장되었습니다. ID: ${userId}`);
      setIsError(false);
      setHasSubscription(true);
      setSubscription(subscription);
    } catch (error: any) {
      console.error("구독 저장 오류:", error);
      setStatus(`구독 저장 실패: ${error.message || '알 수 없는 오류'}`);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const requestPermission = async () => {
    if (!("Notification" in window)) {
      setStatus("이 브라우저는 알림을 지원하지 않습니다.");
      setIsError(true);
      return;
    }

    try {
      setIsLoading(true);
      const permission = await window.Notification.requestPermission();
      setPermission(permission);

      if (permission === "granted") {
        setStatus("알림 권한이 허용되었습니다.");
        setIsError(false);
        
        // 서비스 워커 등록 확인
        const registration = await navigator.serviceWorker.ready;
        
        // 구독 확인 또는 새로 구독
        let subscription = await registration.pushManager.getSubscription();
        
        if (!subscription) {
          // 새 구독 생성
          const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_KEY;
          if (!vapidPublicKey) {
            setStatus("VAPID 키가 설정되지 않았습니다.");
            setIsError(true);
            return;
          }
          
          // VAPID 키를 Uint8Array로 변환
          const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
          
          // 구독 생성
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: convertedVapidKey,
          });
        }
        
        // 구독 정보 저장
        if (subscription) {
          await saveSubscription(subscription);
        }
      } else {
        setStatus(`알림 권한이 ${permission === "denied" ? "거부되었습니다." : "허용되지 않았습니다."}`);
        setIsError(true);
      }
    } catch (error) {
      console.error("알림 권한 요청 오류:", error);
      setStatus("알림 권한 요청 중 오류가 발생했습니다.");
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const updateMarketingOptIn = async (value: boolean) => {
    if (!userId) {
      setStatus("로그인이 필요합니다.");
      setIsError(true);
      return;
    }
    
    setIsLoading(true);
    
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("profiles")
        .update({ marketing_opt_in: value })
        .eq("id", userId);
      
      if (error) {
        throw new Error(error.message);
      }
      
      setMarketingOptIn(value);
      setStatus(`마케팅 수신 동의 상태가 ${value ? '활성화' : '비활성화'}되었습니다.`);
      setIsError(false);
    } catch (error: any) {
      console.error("마케팅 수신 동의 상태 업데이트 오류:", error);
      setStatus(`마케팅 수신 동의 상태 업데이트 오류: ${error.message}`);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const sendTestNotification = async () => {
    if (!userId) {
      setStatus("로그인이 필요합니다.");
      setIsError(true);
      return;
    }

    if (!marketingOptIn) {
      setStatus("알림을 보내려면 먼저 마케팅 수신에 동의해야 합니다.");
      setIsError(true);
      return;
    }
    
    if (!hasSubscription) {
      setStatus("알림을 보내려면 먼저 구독을 해야 합니다.");
      setIsError(true);
      return;
    }

    try {
      setIsLoading(true);

      
      
      const result = await sendNotification(
        message,     // body
        userId,      // user_id
        "/favicon-196.png", // icon
        title,  // title - 명시적으로 전달
        notificationUrl     // url
      );
      
      console.log("알림 전송 결과:", result);
      const response = JSON.parse(result);
      
      if (response.error) {
        // 구독 만료 오류 처리
        if (response.expired) {
          setStatus("구독이 만료되었습니다. 새 구독을 생성합니다...");
          setIsError(true);
          setHasSubscription(false);
          setSubscription(null);
          
          // 서비스 워커 구독 정보도 삭제
          if ("serviceWorker" in navigator) {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            if (subscription) {
              await subscription.unsubscribe();
              console.log("만료된 서비스 워커 구독 해제됨");
            }
            
            // 새 구독 생성 시도
            try {
              const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_KEY;
              if (!vapidPublicKey) {
                throw new Error("VAPID 키가 설정되지 않았습니다.");
              }
              
              // VAPID 키를 Uint8Array로 변환
              const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
              
              // 새 구독 생성
              const newSubscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: convertedVapidKey,
              });
              
              // 새 구독 정보 저장
              await saveSubscription(newSubscription);
              
              setStatus("새 구독이 생성되었습니다. 알림을 다시 시도해주세요.");
            } catch (renewError) {
              console.error("구독 갱신 오류:", renewError);
              setStatus("새 구독 생성 실패: " + (renewError instanceof Error ? renewError.message : "알 수 없는 오류"));
              setIsError(true);
            }
          }
        } else {
          setStatus(`알림 전송 실패: ${response.error}`);
          setIsError(true);
        }
      } else {
        setStatus(`알림이 성공적으로 전송되었습니다!`);
        setIsError(false);
      }
    } catch (error) {
      console.error("알림 전송 오류:", error);
      setStatus("알림 전송 중 오류가 발생했습니다.");
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  // VAPID 키를 Uint8Array로 변환하는 함수
  function urlBase64ToUint8Array(base64String: string) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // 구독 정보 직접 확인 기능
  const checkSubscriptionStatus = async () => {
    if (!userId) {
      setStatus("로그인이 필요합니다.");
      setIsError(true);
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Supabase에서 직접 구독 정보 조회
      const supabase = createClient();
      const { data, error } = await supabase
        .from("subscriptions")
        .select("notification_json")
        .eq("user_id", userId)
        .maybeSingle();
      
      if (error) {
        throw new Error(error.message);
      }
      
      if (data?.notification_json) {
        setStatus("구독 정보가 존재합니다.");
        setIsError(false);
        setHasSubscription(true);
        setSubscriptionInfo(
          typeof data.notification_json === 'string' 
            ? data.notification_json 
            : JSON.stringify(data.notification_json, null, 2)
        );
      } else {
        setStatus("구독 정보가 존재하지 않습니다.");
        setIsError(true);
        setHasSubscription(false);
        setSubscriptionInfo("");
      }
    } catch (error: any) {
      console.error("구독 상태 확인 오류:", error);
      setStatus(`구독 상태 확인 중 오류가 발생했습니다: ${error.message}`);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <NotificationContainer>
      <h3>웹 푸시 알림 테스트</h3>
      
      <div>
        <p>현재 알림 권한: <StatusValue>{permission}</StatusValue></p>
        <p>구독 여부: <StatusValue>{hasSubscription ? "구독됨" : "구독되지 않음"}</StatusValue></p>
        <p>마케팅 수신 동의: <StatusValue>{marketingOptIn === null ? "확인 중..." : marketingOptIn ? "동의함" : "동의 안함"}</StatusValue></p>
        
        <ButtonGroup>
          {permission !== "granted" && (
            <Button onClick={requestPermission} disabled={isLoading}>
              {isLoading ? "처리 중..." : "알림 권한 요청"}
            </Button>
          )}
          
          <Button 
            onClick={() => updateMarketingOptIn(!marketingOptIn)} 
            disabled={isLoading || !userId}
            style={{ 
              backgroundColor: marketingOptIn ? 'var(--red-500)' : 'var(--primary-500)'
            }}
          >
            {isLoading ? "처리 중..." : marketingOptIn ? "마케팅 수신 거부" : "마케팅 수신 동의"}
          </Button>
          
          <Button onClick={checkSubscriptionStatus} disabled={isLoading || !userId}>
            구독 상태 확인
          </Button>
        </ButtonGroup>
      </div>
      
      {permission === "granted" && (
        <>
          <FormGroup>
            <div>
              <label htmlFor="title">알림 제목:</label>
              <Input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="알림 제목 입력"
              />
            </div>
            
            <div>
              <label htmlFor="message">알림 내용:</label>
              <Input
                id="message"
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="알림 내용 입력"
              />
            </div>
            
            <div>
              <label htmlFor="url">알림 클릭 시 이동할 URL:</label>
              <Input
                id="url"
                type="text"
                value={notificationUrl}
                onChange={(e) => setNotificationUrl(e.target.value)}
                placeholder="알림 URL 입력 (기본값: /)"
              />
            </div>
          </FormGroup>
          
          <Button onClick={sendTestNotification} disabled={isLoading || !userId || !hasSubscription || !marketingOptIn}>
            {isLoading ? "처리 중..." : "테스트 알림 보내기"}
          </Button>
        </>
      )}
      
      {status && <StatusMessage isError={isError}>{status}</StatusMessage>}
      
      {subscriptionInfo && (
        <>
          <p>구독 정보:</p>
          <SubscriptionInfo>{subscriptionInfo}</SubscriptionInfo>
        </>
      )}
    </NotificationContainer>
  );
}