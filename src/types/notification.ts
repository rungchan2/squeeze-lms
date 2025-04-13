import { z } from "zod";

// ✅ 알림 유형 (Enum)
export const NotificationTypeEnum = z.enum(["comment", "submission", "bug_report", "announcement", "request", "mention"]);

// ✅ Notifications 테이블의 데이터 스키마
export const NotificationSchema = z.object({
  id: z.string().uuid(), // UUID
  receiver_id: z.string().uuid(), // 알림 받는 사용자 ID
  type: z.string(), // 알림 유형
  message: z.string().min(1), // 알림 메시지
  link: z.string().nullable().optional(), // 관련된 페이지 링크 (선택 사항)
  created_at: z.string().nullable().optional(), // 생성된 시간
  read_at: z.string().nullable().optional(), // 읽은 시간 (읽지 않았다면 null)
});

// ✅ 새로운 알림을 생성할 때의 입력 타입
export const NotificationInsertSchema = NotificationSchema.omit({ id: true, created_at: true, read_at: true }).extend({
  read_at: z.nullable(z.string()).optional(),
});

// ✅ 알림 업데이트 타입 (읽음 처리 등)
export const NotificationUpdateSchema = z.object({
  read_at: z.string().nullable().optional(),
});

export type Notification = z.infer<typeof NotificationSchema>;
export type NotificationInsert = z.infer<typeof NotificationInsertSchema>;
export type NotificationUpdate = z.infer<typeof NotificationUpdateSchema>;