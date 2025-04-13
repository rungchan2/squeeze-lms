import useSWR from 'swr';
import { createClient } from "@/utils/supabase/client";
import { Notification, NotificationInsert } from "@/types";
import { useSupabaseAuth } from "./useSupabaseAuth";
import { useState, useCallback, useEffect } from 'react';

// 알림을 가져오는 fetcher 함수
const fetchNotifications = async (
  userId: string,
  pageSize: number
): Promise<{ notifications: Notification[]; count: number }> => {
  if (!userId) return { notifications: [], count: 0 };
  
  const supabase = createClient();
  
  const { data, error, count } = await supabase
    .from("notifications")
    .select("*", { count: 'exact' })
    .eq("receiver_id", userId)
    .order("read_at", { ascending: true, nullsFirst: true })
    .order("created_at", { ascending: false })
    .limit(pageSize);
    
  if (error) throw error;
  
  return {
    notifications: (data ?? []) as Notification[],
    count: count || 0
  };
};

// 알림 생성 함수
export const createNotification = async (notification: NotificationInsert) => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("notifications")
    .insert(notification)
    .select()
    .single();
  
  if (error) throw error;
  return { data, error };
};

// 알림 읽음 처리 함수
export const markAsRead = async (notificationId: string) => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .select()
    .single();
  
  if (error) throw error;
  return data as Notification;
};

// 모든 알림 읽음 처리 함수
export const markAllAsRead = async (userId: string) => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("receiver_id", userId)
    .is("read_at", null)
    .select();
  
  if (error) throw error;
  return data as Notification[];
};

// 무한 스크롤을 위한 알림 훅
export const useNotifications = (pageSize = 10) => {
  const { id: userId } = useSupabaseAuth();
  const [page, setPage] = useState(1);
  const [loadedNotifications, setLoadedNotifications] = useState<Notification[]>([]);
  
  // userId가 숫자가 아니면 기본값 사용
  const numericUserId = typeof userId === 'string' ? userId : "";
  
  // SWR로 데이터 가져오기
  const {
    data,
    error,
    isLoading,
    isValidating,
    mutate
  } = useSWR(
    numericUserId ? [`notifications-${numericUserId}`, pageSize * page] : null,
    ([_, size]) => fetchNotifications(numericUserId, size),
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1분
    }
  );
  
  // 데이터가 로드되면 상태 업데이트
  useEffect(() => {
    if (data?.notifications) {
      setLoadedNotifications(data.notifications);
    }
  }, [data]);
  
  // 읽지 않은 알림 갯수 계산
  const unreadCount = loadedNotifications.filter(item => !item.read_at).length;
  
  // 다음 페이지 불러오기 함수
  const fetchNextPage = useCallback(() => {
    setPage(prev => prev + 1);
  }, []);
  
  // 다음 페이지가 있는지 확인
  const hasNextPage = data ? loadedNotifications.length < data.count : false;
  
  return {
    notifications: loadedNotifications,
    unreadCount,
    error,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage: isValidating && !isLoading,
    refetch: mutate
  };
};

// 단일 알림 조회 훅
export const useNotification = (notificationId: string) => {
  const { id: userId } = useSupabaseAuth();
  
  const fetchNotification = async ([key, nId, uId]: [string, string, string]): Promise<Notification | null> => {
    if (!uId) return null;
      
    const supabase = createClient();
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("id", nId)
      .eq("receiver_id", uId)
      .single();
      
    if (error) return null;
    return data as Notification;
  };
  
  // SWR 사용
  const { data, error, mutate } = useSWR(
    notificationId && userId ? ['notification', notificationId, userId] : null,
    fetchNotification,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1분
    }
  );
  
  return {
    notification: data,
    error,
    refetch: mutate
  };
};