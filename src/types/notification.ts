import { z } from "zod";

// ✅ 알림 유형 (Enum)
export const NotificationTypeEnum = z.enum(["comment", "submission", "bug_report", "announcement"]);

// ✅ Notifications 테이블의 데이터 스키마
export const NotificationSchema = z.object({
  id: z.number().int().positive(), // 자동 증가 ID
  receiver_id: z.number().int().positive(), // 알림 받는 사용자 ID
  type: NotificationTypeEnum, // 알림 유형 (Enum)
  message: z.string().min(1), // 알림 메시지
  link: z.string().url().optional(), // 관련된 페이지 링크 (선택 사항)
  created_at: z.string().datetime({ offset: true }).optional(), // 생성된 시간
  read_at: z.string().datetime({ offset: true }).nullable().optional(), // 읽은 시간 (읽지 않았다면 null)
});

// ✅ 새로운 알림을 생성할 때의 입력 타입
export const NotificationInsertSchema = NotificationSchema.omit({ id: true, created_at: true, read_at: true }).extend({
  read_at: z.nullable(z.string().datetime({ offset: true })).optional(),
});

// ✅ 알림 업데이트 타입 (읽음 처리 등)
export const NotificationUpdateSchema = z.object({
  read_at: z.string().datetime({ offset: true }).nullable().optional(),
});

// ✅ 알림 데이터 타입
export type Notification = z.infer<typeof NotificationSchema>;

// ✅ 새로운 알림을 생성할 때 사용할 타입
export type NotificationInsert = z.infer<typeof NotificationInsertSchema>;

// ✅ 알림 업데이트 타입 (읽음 처리 등)
export type NotificationUpdate = z.infer<typeof NotificationUpdateSchema>;