import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"; 
import { createClient } from "@/utils/supabase/client";
import { Notification } from "@/types";

// ✅ 최신 알림을 가져오는 함수
async function getNotifications(): Promise<Notification[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false }); // 최신 알림이 맨 위로

  if (error) throw error;
  return (data ?? []) as Notification[];
}

// ✅ 알림을 읽음 처리하는 함수
async function markAsRead(notificationId: number) {
  const supabase = createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId);

  if (error) throw error;
}

// ✅ `useNotification` 훅
export const useNotification = () => {
  const queryClient = useQueryClient();
    
  const { data, isLoading, error } = useQuery({
    queryKey: ["notifications"],
    queryFn: getNotifications,
  });

  const { mutate: readNotification } = useMutation({
    mutationFn: markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  return { data, isLoading, error, readNotification };
};