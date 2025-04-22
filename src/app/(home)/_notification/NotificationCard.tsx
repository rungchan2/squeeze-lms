import { FaBell } from "react-icons/fa";
import { HiDotsHorizontal } from "react-icons/hi";
import Text from "@/components/Text/Text";
import { Notification } from "@/types";
import { Modal } from "@/components/modal/Modal";
import { useState } from "react";
import dayjs from "@/utils/dayjs/dayjs";
import Button from "@/components/common/Button";
import { formatDifference } from "@/utils/dayjs/calcDifference";
import { Menu, Portal } from "@chakra-ui/react";
import styled from "@emotion/styled";
import { useRouter } from "next/navigation";

interface NotificationCardProps {
  notification: Notification;
  readNotification: (id: string) => void;
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
      <div className="notificationCard" onClick={() => {
        setIsOpen(true)
        readNotification(notification.id)
      }}>
        <div className="contentContainer">
          <FaBell
            color={
              isNotificationRead ? "var(--grey-500)" : "var(--primary-400)"
            }
          />
          <div className="textContainer">
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
            <div className="dateContainer">
              <Text variant="small" color="var(--grey-400)">
                {duration} {isNotificationRead ? "(읽음)" : ""}
              </Text>
            </div>
          </div>
          <Menu.Root>
            <Menu.Trigger asChild>
              <div
                className="dotsContainer"
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                <HiDotsHorizontal
                  className="dots"
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
          <div className="buttonContainer">
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
          <div className="modalContent">
            <Text variant="body" fontWeight="bold">
              알림 상세
            </Text>
            <Text>{notification.message}</Text>
            {notification.link && notification.type !== "request" && (
              <Text
                variant="small"
                color="var(--primary-400)"
                fontWeight="bold"
                className="link"
                onClick={() =>
                  router.push(notification.link || "")
                }
              >
                {window.location.origin}
                {notification.link}
              </Text>
            )}
            <div className="typeContainer">
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
