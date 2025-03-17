import styles from "../Home.module.css"
import { FaBell } from "react-icons/fa";
import { HiDotsHorizontal } from "react-icons/hi";
import Text from "@/components/Text/Text";
import { Notification } from "@/types";
import { Modal } from "../../modal/Modal";
import { useState } from "react";
import dayjs from "@/utils/dayjs/dayjs";
import Button from "../../common/Button";
import Dropdown from "../../dropdown/Dropdown";
import { formatDifference } from "@/utils/dayjs/calcDifference";
export default function NotificationCard(notification: Notification) {
  const duration = formatDifference(notification.created_at || "");
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <div className={styles.notificationCard} onClick={() => setIsOpen(true)}>
        <div className={styles.contentContainer}>
          <FaBell color="var(--grey-500)" />
          <div className={styles.textContainer}>
            <Text variant="body" fontWeight="bold">
              {notification.message}
            </Text>
            <div className={styles.dateContainer}>
              <Text variant="small" color="var(--grey-400)">
                {duration}
              </Text>
            </div>
          </div>

          <Dropdown
            toggleButton={
              <div className={styles.dotsContainer}>
                <HiDotsHorizontal
                  className={styles.dots}
                  color="var(--grey-500)"
                />
              </div>
            }
            items={[
              <Text
                variant="small"
                key="accept"
                onClick={(e) => {
                  e.stopPropagation();
                  console.log("accept");
                }}
              >
                수락
              </Text>,
              <Text
                variant="small"
                key="reject"
                onClick={(e) => {
                  e.stopPropagation();
                  console.log("reject");
                }}
              >
                거절
              </Text>,
            ]}
          />
        </div>
        {notification.type === "request" && (
          <div className={styles.buttonContainer}>
            <Button
              variant="outline"
              onClick={(e) => e.stopPropagation()}
              maxWidth={60}
            >
              <Text variant="small">거절</Text>
            </Button>
            <Button
              variant="flat"
              onClick={(e) => e.stopPropagation()}
              maxWidth={60}
            >
              <Text variant="small">수락</Text>
            </Button>
          </div>
        )}
        <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
          <div className={styles.modalContent}>
            <Text variant="body" fontWeight="bold">
              알림 상세
            </Text>
            <Text>{notification.message}</Text>
            {notification.link && (
              <Text
                variant="small"
                color="var(--primary-400)"
                fontWeight="bold"
                className={styles.link}
                onClick={() =>
                  window.open(
                    window.location.origin + notification.link,
                    "_blank"
                  )
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
    </>
  );
}
