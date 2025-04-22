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