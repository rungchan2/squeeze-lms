import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { createClient } from "@/utils/supabase/client";
import { Notification, NotificationInsert } from "@/types";
import { useAuth } from "@/components/AuthProvider";

// 페이지네이션 타입 정의
type FetchNotificationsParams = {
  pageParam: number;
  pageSize: number;
  userId: number;
};

// 알림 페이지 결과 타입
interface NotificationPage {
  data: Notification[];
  nextPage: number | null;
}

// 알림을 가져오는 fetcher 함수
const fetchNotificationsPage = async ({
  pageParam = 0,
  pageSize = 10,
  userId
}: FetchNotificationsParams): Promise<NotificationPage> => {
  const supabase = createClient();
  
  // 페이지네이션 계산 (from-to 범위)
  const from = pageParam * pageSize;
  const to = from + pageSize - 1;
  
  const { data, error, count } = await supabase
    .from("notifications")
    .select("*", { count: 'exact' })
    .eq("receiver_id", userId)
    .order("read_at", { ascending: true, nullsFirst: true })
    .order("created_at", { ascending: false })
    .range(from, to);
    
  if (error) throw error;
  
  // 다음 페이지 계산
  const hasNextPage = count ? from + pageSize < count : false;
  const nextPage = hasNextPage ? pageParam + 1 : null;
  
  return {
    data: (data ?? []) as Notification[],
    nextPage
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
export const markAsRead = async (notificationId: number) => {
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
export const markAllAsRead = async (userId: number) => {
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
  const { id: userId } = useAuth();
  
  // userId가 숫자가 아니면 기본값 사용
  const numericUserId = typeof userId === 'number' ? userId : 0;
  
  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
    refetch
  } = useInfiniteQuery({
    queryKey: ['notifications', numericUserId],
    queryFn: ({ pageParam }) => fetchNotificationsPage({ 
      pageParam: pageParam as number, 
      pageSize, 
      userId: numericUserId 
    }),
    getNextPageParam: (lastPage: NotificationPage) => lastPage.nextPage,
    enabled: !!userId,
    initialPageParam: 0
  });
  
  // 모든 페이지의 데이터를 하나의 배열로 합치기
  const notifications = data?.pages.flatMap(page => (page as NotificationPage).data) || [];
  
  // 읽지 않은 알림 갯수 계산
  const unreadCount = notifications.filter(item => !item.read_at).length;
  
  return {
    notifications,
    unreadCount,
    error,
    isLoading: status === 'pending',
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch
  };
};

// 단일 알림 조회 훅
export const useNotification = (notificationId: number) => {
  const { id: userId } = useAuth();
  
  const fetchNotification = async (): Promise<Notification | null> => {
    if (!userId) return null;
    
    const supabase = createClient();
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("id", notificationId)
      .eq("receiver_id", userId)
      .single();
      
    if (error) return null;
    return data as Notification;
  };
  
  // 일반 쿼리 사용 (단일 알림 조회는 무한 스크롤이 필요 없음)
  const { data, error, refetch } = useQuery({
    queryKey: ['notification', notificationId, userId],
    queryFn: fetchNotification,
    enabled: !!notificationId && !!userId,
  });
  
  return {
    notification: data,
    error,
    refetch
  };
};