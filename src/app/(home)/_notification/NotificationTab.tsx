import { useRef, useCallback } from "react";
import { useNotifications, markAsRead } from "@/hooks/useNotification";
import Spinner from "@/components/common/Spinner";
import NotificationCard from "@/app/(home)/_notification/NotificationCard";
import Footer from "@/components/common/Footer";
import styled from "@emotion/styled";

export default function NotificationTab() {
    const {
      notifications,
      error,
      isLoading,
      fetchNextPage,
      hasNextPage,
      isFetchingNextPage,
      mutate,
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
    const handleReadNotification = async (notificationId: string) => {
      await markAsRead(notificationId);
      mutate();
    };
  
    if (error) {
      return (
        <NotificationsContainer>
          <EmptyState style={{ 
            color: 'var(--negative-500)',
            borderColor: 'var(--negative-200)',
            backgroundColor: 'var(--negative-50)'
          }}>
            오류가 발생했습니다: {error.message}
          </EmptyState>
        </NotificationsContainer>
      );
    }
    if (isLoading) {
      return (
        <NotificationsContainer>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            minHeight: '200px' 
          }}>
            <Spinner size="32px" />
          </div>
        </NotificationsContainer>
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
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                padding: '16px' 
              }}>
                <Spinner size="24px" />
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
    gap: 12px;
    width: 100%;
    padding: 16px;
  
    .notification-list {
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
  `;
  
  const EmptyState = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 200px;
    width: 100%;
    background-color: var(--grey-50);
    border: 1px dashed var(--grey-300);
    border-radius: 8px;
    padding: 32px 16px;
    color: var(--grey-500);
    font-size: 14px;
    text-align: center;
  `;