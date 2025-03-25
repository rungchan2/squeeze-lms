import { createClient } from "@/utils/supabase/client";
import { User, CreateUser } from "@/types";
import useSWRInfinite from "swr/infinite";
import useSWR from "swr";

// 단일 사용자 조회 함수
async function fetchUser(userId: number) {
  if (!userId) return null;
  
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  
  if (error) throw error;
  return data as User | null;
}

// 모든 사용자 페이지네이션으로 조회 함수
async function fetchUsers(pageIndex: number, pageSize: number) {
  const supabase = createClient();
  
  const from = pageIndex * pageSize;
  const to = from + pageSize - 1;
  
  const { data, error, count } = await supabase
    .from("profiles")
    .select("*", { count: 'exact' })
    .order("id", { ascending: true })
    .range(from, to);
    
  if (error) throw error;
  
  return {
    data: data as User[] || [],
    count: count || 0
  };
}

// 조직에 속한 사용자 페이지네이션으로 조회 함수
async function fetchOrganizationUsers(organizationId: number, pageIndex: number, pageSize: number) {
  if (!organizationId) return { data: [], count: 0 };
  
  const supabase = createClient();
  
  const from = pageIndex * pageSize;
  const to = from + pageSize - 1;
  
  const { data, error, count } = await supabase
    .from("profiles")
    .select("*", { count: 'exact' })
    .eq("organization_id", organizationId)
    .order("id", { ascending: true })
    .range(from, to);
    
  if (error) throw error;
  
  return {
    data: data as User[] || [],
    count: count || 0
  };
}

// 사용자 생성 함수
async function createUser(userData: CreateUser) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .insert(userData)
    .select()
    .single();
  
  if (error) throw error;
  return data as User;
}

// 사용자 업데이트 함수
async function updateUser(userId: number, userData: Partial<User>) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .update(userData)
    .eq("id", userId)
    .select()
    .single();
  
  if (error) throw error;
  return data as User;
}

// 사용자 삭제 함수
async function deleteUser(userId: number) {
  const supabase = createClient();
  const { error } = await supabase
    .from("profiles")
    .delete()
    .eq("id", userId);
  
  if (error) throw error;
  return true;
}

// 단일 사용자 조회 훅
export function useUser(userId: number) {
  const { data, error, isLoading, mutate } = useSWR(
    userId ? `user-${userId}` : null,
    () => fetchUser(userId),
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1분 동안 중복 요청 방지
    }
  );

  return {
    user: data,
    error,
    isLoading,
    mutate
  };
}

// 모든 사용자 무한 스크롤 훅
export function useAllUsers(pageSize = 10) {
  const getKey = (pageIndex: number, previousPageData: any) => {
    // 더 이상 불러올 데이터가 없으면 null 반환
    if (previousPageData && !previousPageData.data.length) return null;
    return `all-users-page-${pageIndex}-${pageSize}`;
  };
  
  const { data, error, size, setSize, isLoading, isValidating, mutate } = useSWRInfinite(
    getKey,
    async (key) => {
      const pageIndex = parseInt(key.split('-')[3]);
      return fetchUsers(pageIndex, pageSize);
    },
    {
      revalidateFirstPage: false,
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1분 동안 중복 요청 방지
    }
  );
  
  // 모든 페이지의 데이터를 하나의 배열로 합치기
  const users = data ? data.flatMap(page => page.data) : [];
  // 총 사용자 수
  const total = data && data[0] ? data[0].count : 0;
  // 다음 페이지 존재 여부 확인
  const isReachingEnd = data ? data[data.length - 1]?.data.length < pageSize : false;
  // 추가 데이터 로딩 중 여부
  const isLoadingMore = isLoading || (size > 0 && data && typeof data[size - 1] === "undefined");
  
  // 다음 페이지 로드 함수
  const loadMore = () => {
    if (!isReachingEnd && !isLoadingMore) {
      setSize(size + 1);
    }
  };

  return {
    users,
    error,
    isLoading,
    isValidating,
    loadMore,
    isLoadingMore,
    isReachingEnd,
    total,
    size,
    setSize,
    mutate
  };
}

// 조직에 속한 사용자 무한 스크롤 훅
export function useOrganizationUsers(organizationId: number, pageSize = 10) {
  const getKey = (pageIndex: number, previousPageData: any) => {
    // organizationId가 없거나 더 이상 불러올 데이터가 없으면 null 반환
    if (!organizationId) return null;
    if (previousPageData && !previousPageData.data.length) return null;
    return `org-${organizationId}-users-page-${pageIndex}-${pageSize}`;
  };
  
  const { data, error, size, setSize, isLoading, isValidating, mutate } = useSWRInfinite(
    getKey,
    async (key) => {
      const parts = key.split('-');
      const orgId = parseInt(parts[1]);
      const pageIndex = parseInt(parts[4]);
      return fetchOrganizationUsers(orgId, pageIndex, pageSize);
    },
    {
      revalidateFirstPage: false,
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1분 동안 중복 요청 방지
    }
  );
  
  // 모든 페이지의 데이터를 하나의 배열로 합치기
  const users = data ? data.flatMap(page => page.data) : [];
  // 총 사용자 수
  const total = data && data[0] ? data[0].count : 0;
  // 다음 페이지 존재 여부 확인
  const isReachingEnd = data ? data[data.length - 1]?.data.length < pageSize : false;
  // 추가 데이터 로딩 중 여부
  const isLoadingMore = isLoading || (size > 0 && data && typeof data[size - 1] === "undefined");
  
  // 다음 페이지 로드 함수
  const loadMore = () => {
    if (!isReachingEnd && !isLoadingMore) {
      setSize(size + 1);
    }
  };

  return {
    users,
    error,
    isLoading,
    isValidating,
    loadMore,
    isLoadingMore,
    isReachingEnd,
    total,
    size,
    setSize,
    mutate
  };
}

// CRUD 함수 내보내기
export const usersApi = {
  create: createUser,
  update: updateUser,
  delete: deleteUser
};
