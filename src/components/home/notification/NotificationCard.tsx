import styles from "../Home.module.css";
import { FaBell } from "react-icons/fa";
import { HiDotsHorizontal } from "react-icons/hi";
import Text from "@/components/Text/Text";
import { Notification } from "@/types";
import { Modal } from "../../modal/Modal";
import { useState } from "react";
import dayjs from "@/utils/dayjs/dayjs";
import Button from "../../common/Button";
import { formatDifference } from "@/utils/dayjs/calcDifference";
import { Menu, Portal } from "@chakra-ui/react";
import styled from "@emotion/styled";
import { useRouter } from "next/navigation";

interface NotificationCardProps {
  notification: Notification;
  readNotification: (id: number) => void;
}

export default function NotificationCard({
  notification,
  readNotification,
}: NotificationCardProps) {
  const duration = formatDifference(notification.created_at || "");
  const [isOpen, setIsOpen] = useState(false);
  const isNotificationRead = notification.read_at !== null;
  const router = useRouter();
  return (
    <Container>
      <div className={styles.notificationCard} onClick={() => {
        setIsOpen(true)
        readNotification(notification.id)
      }}>
        <div className={styles.contentContainer}>
          <FaBell
            color={
              isNotificationRead ? "var(--grey-500)" : "var(--primary-400)"
            }
          />
          <div className={styles.textContainer}>
            <Text
              variant="body"
              fontWeight="bold"
              className={
                isNotificationRead
                  ? "read notification-title"
                  : "notification-title"
              }
            >
              {notification.message}
            </Text>
            <div className={styles.dateContainer}>
              <Text variant="small" color="var(--grey-400)">
                {duration} {isNotificationRead ? "(읽음)" : ""}
              </Text>
            </div>
          </div>
          <Menu.Root>
            <Menu.Trigger asChild>
              <div
                className={styles.dotsContainer}
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                <HiDotsHorizontal
                  className={styles.dots}
                  color="var(--grey-500)"
                />
              </div>
            </Menu.Trigger>
            <Portal>
              <Menu.Positioner>
                <Menu.Content>
                  <Menu.Item
                    value="reject"
                    style={{ cursor: "pointer" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      readNotification(notification.id);
                    }}
                  >
                    읽음
                  </Menu.Item>
                </Menu.Content>
              </Menu.Positioner>
            </Portal>
          </Menu.Root>
        </div>
        {notification.type === "request" && (
          <div className={styles.buttonContainer}>
            <Button
              variant="flat"
              maxWidth={100}
              onClick={(e) => {
                e.stopPropagation();
                router.push(notification.link || "");
              }}
            >
              <Text variant="caption">수락</Text>
            </Button>
          </div>
        )}
        <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
          <div className={styles.modalContent}>
            <Text variant="body" fontWeight="bold">
              알림 상세
            </Text>
            <Text>{notification.message}</Text>
            {notification.link && notification.type !== "request" && (
              <Text
                variant="small"
                color="var(--primary-400)"
                fontWeight="bold"
                className={styles.link}
                onClick={() =>
                  router.push(notification.link || "")
                }
              >
                {window.location.origin}
                {notification.link}
              </Text>
            )}
            <div className={styles.typeContainer}>
              <Text variant="small">{notification.type}</Text>
            </div>
            <Text color="var(--grey-400)" variant="caption">
              {dayjs(notification.created_at).format(
                "YYYY년 MM월 DD일, a HH:mm"
              )}
            </Text>
          </div>
        </Modal>
      </div>
    </Container>
  );
}

const Container = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;

  .read {
    color: var(--grey-400);
  }

  .notification-title {
    color: var(--primary-400);
    word-break: break-all;
    text-overflow: ellipsis;
    overflow: hidden;
    max-width: 100%;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
  }
`;
