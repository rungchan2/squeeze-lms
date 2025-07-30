import { useMemo } from 'react';
import { 
  useSupabaseQuery,
  useSupabaseInfiniteQuery,
  createCacheKey,
  createMutation,
  PaginatedResponse
} from '../base/useSupabaseQuery';
import { useSupabaseAuth } from '../useSupabaseAuth';
import { Notification, NotificationInsert } from '@/types';

// 알림 페이지네이션 훅
export function useNotificationsRefactored(pageSize = 10) {
  const { id: userId } = useSupabaseAuth();

  const getKey = (pageIndex: number, previousPageData: PaginatedResponse<Notification> | null) => {
    if (!userId) return null;
    
    if (previousPageData === null || previousPageData.nextPage !== null) {
      return createCacheKey('notifications', { 
        userId, 
        page: pageIndex,
        size: pageSize 
      });
    }
    return null;
  };

  const result = useSupabaseInfiniteQuery<Notification>(
    getKey,
    async (supabase, pageIndex, pageSize) => {
      if (!userId) throw new Error('User ID is required');

      const from = pageIndex * pageSize;
      const to = from + pageSize - 1;

      const { data, error, count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact' })
        .eq('receiver_id', userId)
        .order('read_at', { ascending: true, nullsFirst: true })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      const hasNextPage = count ? from + pageSize < count : false;
      const nextPage = hasNextPage ? pageIndex + 1 : null;

      return {
        data: (data || []) as Notification[],
        nextPage,
        total: count ?? 0,
      };
    },
    pageSize
  );

  // 읽지 않은 알림 개수
  const unreadCount = useMemo(() => 
    result.data.filter(item => !item.read_at).length,
    [result.data]
  );

  return {
    notifications: result.data,
    unreadCount,
    error: result.error,
    isLoading: result.isLoading,
    fetchNextPage: result.loadMore,
    hasNextPage: result.hasNextPage,
    isFetchingNextPage: result.isLoadingMore,
    mutate: result.refetch,
    total: result.total,
  };
}

// 단일 알림 조회 훅
export function useNotificationRefactored(notificationId: string | null) {
  const { id: userId } = useSupabaseAuth();

  return useSupabaseQuery<Notification>(
    notificationId && userId 
      ? createCacheKey('notification', { notificationId, userId })
      : null,
    async (supabase) => {
      if (!notificationId || !userId) {
        throw new Error('Notification ID and User ID are required');
      }

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('id', notificationId)
        .eq('receiver_id', userId)
        .single();

      if (error) throw error;
      return data as Notification;
    }
  );
}

// 알림 관련 작업 훅
export function useNotificationActionsRefactored() {
  const { id: userId } = useSupabaseAuth();

  // 알림 생성
  const createNotification = createMutation<Notification, NotificationInsert>(
    async (supabase, notification) => {
      const { data, error } = await supabase
        .from('notifications')
        .insert(notification)
        .select()
        .single();

      if (error) throw error;
      return data as Notification;
    },
    {
      revalidateKeys: ['notifications'],
    }
  );

  // 알림 읽음 처리
  const markAsRead = createMutation<Notification, string>(
    async (supabase, notificationId) => {
      const { data, error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId)
        .select()
        .single();

      if (error) throw error;
      return data as Notification;
    },
    {
      revalidateKeys: ['notifications', 'notification'],
    }
  );

  // 모든 알림 읽음 처리
  const markAllAsRead = createMutation<Notification[], void>(
    async (supabase) => {
      if (!userId) throw new Error('User ID is required');

      const { data, error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('receiver_id', userId)
        .is('read_at', null)
        .select();

      if (error) throw error;
      return (data || []) as Notification[];
    },
    {
      revalidateKeys: ['notifications'],
    }
  );

  // 알림 삭제
  const deleteNotification = createMutation<boolean, string>(
    async (supabase, notificationId) => {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;
      return true;
    },
    {
      revalidateKeys: ['notifications'],
    }
  );

  // 여러 알림 삭제
  const deleteNotifications = createMutation<boolean, string[]>(
    async (supabase, notificationIds) => {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .in('id', notificationIds);

      if (error) throw error;
      return true;
    },
    {
      revalidateKeys: ['notifications'],
    }
  );

  return {
    createNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteNotifications,
  };
}

// 읽지 않은 알림 개수만 조회하는 경량 훅
export function useUnreadNotificationCountRefactored() {
  const { id: userId } = useSupabaseAuth();

  return useSupabaseQuery<number>(
    userId ? createCacheKey('unread-notifications-count', { userId }) : null,
    async (supabase) => {
      if (!userId) return 0;

      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', userId)
        .is('read_at', null);

      if (error) throw error;
      return count ?? 0;
    },
    {
      refreshInterval: 30000, // 30초마다 자동 갱신
    }
  );
}

// 실시간 알림 구독 훅
export function useNotificationSubscriptionRefactored(
  onNewNotification?: (notification: Notification) => void
) {
  const { id: userId } = useSupabaseAuth();
  const { refetch } = useNotificationsRefactored();

  useSupabaseQuery(
    userId ? `notification-subscription:${userId}` : null,
    async (supabase) => {
      if (!userId) return null;

      const subscription = supabase
        .channel(`notifications:${userId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `receiver_id=eq.${userId}`,
          },
          (payload) => {
            const newNotification = payload.new as Notification;
            onNewNotification?.(newNotification);
            refetch();
          }
        )
        .subscribe();

      // Cleanup 함수 반환
      return () => {
        subscription.unsubscribe();
      };
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );
}