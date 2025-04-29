import useSWR, { mutate } from "swr";
import {
  getSubscription,
  createSubscription,
  deleteSubscription,
  getSubscriptionById
} from "@/utils/data/subscription";

export const useSubscription = (userId: string) => {
  const fetcher = async () => {
    try {
      return await getSubscription(userId);
    } catch (error) {
      throw error;
    }
  };

  const { data, error, isLoading } = useSWR(
    userId ? `subscriptions/${userId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1분
    }
  );

  const handleCreateSubscription = async (notificationJson: PushSubscription) => {
    try {
      const data = await createSubscription(userId, JSON.stringify(notificationJson));
      mutate(`subscriptions/${userId}`, data);
      return data;
    } catch (error) {
      throw error;
    }
  };

  const handleDeleteSubscription = async () => {
    try {
      await deleteSubscription(userId);
      mutate(`subscriptions/${userId}`, null);
      return true;
    } catch (error) {
      throw error;
    }
  };

  const handleGetSubscriptionById = async (id: string) => {
    try {
      return await getSubscriptionById(id);
    } catch (error) {
      throw error;
    }
  };

  return {
    subscription: data,
    error,
    isLoading,
    createSubscription: handleCreateSubscription,
    deleteSubscription: handleDeleteSubscription,
    getSubscriptionById: handleGetSubscriptionById
  };
};
