import useSWR from "swr";
import { getUserById, getSession } from "@/utils/data/user";

const fetcher = async () => {
  const { session } = await getSession();
  if (!session) {
    throw new Error("사용자 정보를 찾을 수 없습니다.");
  }
  const data = await getUserById(session.user.id);
  return data;
};

export const useProfile = () => {
  const { data, error, isLoading, mutate } = useSWR("/api/profile", fetcher, {
    revalidateOnFocus: false,
    revalidateOnMount: true,
    revalidateOnReconnect: false,
    dedupingInterval: Infinity,
    revalidateIfStale: false,
    shouldRetryOnError: false,
  });

  return { data, error, isLoading, mutate };
};
