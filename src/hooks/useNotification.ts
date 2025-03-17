import useSWR from "swr";
import { createClient } from "@/utils/supabase/client";
import { Notification, NotificationInsert } from "@/types";

// 알림을 가져오는 fetcher 함수
const fetchNotifications = async (): Promise<Notification[]> => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false }); // 최신 알림이 맨 위로

  if (error) throw error;
  return (data ?? []) as Notification[];
};

// `useNotification` 훅
export const useNotification = () => {
  const { data, error, isLoading, mutate: revalidate } = useSWR(
    "/api/notifications",
    fetchNotifications
  );

  // 알림을 읽음 처리하는 함수
  const readNotification = async (notificationId: number) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", notificationId);

    if (error) throw error;
    
    // 데이터 갱신
    await revalidate();
    return true;
  };

  // 새 알림 생성 함수
  const createNotification = async (notification: NotificationInsert) => {
    const supabase = createClient();
    const { data: newData, error } = await supabase
      .from("notifications")
      .insert({
        ...notification,
        read_at: null
      })
      .select();

    if (error) throw error;
    
    // 데이터 갱신
    await revalidate();
    return newData as Notification[];
  };

  // 알림 삭제 함수
  const deleteNotification = async (notificationId: number) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", notificationId);

    if (error) throw error;
    
    // 데이터 갱신
    await revalidate();
    return true;
  };

  // 모든 알림 읽음 처리 함수
  const readAllNotifications = async (userId: number) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("receiver_id", userId)
      .is("read_at", null);

    if (error) throw error;
    
    // 데이터 갱신
    await revalidate();
    return true;
  };

  return { 
    data, 
    error, 
    isLoading, 
    readNotification,
    createNotification,
    deleteNotification,
    readAllNotifications,
    revalidate
  };
};