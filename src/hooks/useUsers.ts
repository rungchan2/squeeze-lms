import { createClient } from "@/utils/supabase/client";
import { User, CreateUser } from "@/types";
import useSWRInfinite from "swr/infinite";
import useSWR from "swr";

// 단일 사용자 조회 함수
async function fetchUser(userId: string) {
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
async function fetchOrganizationUsers(organizationId: string, pageIndex: number, pageSize: number) {
  // 파라미터 검증 및 로깅
  console.log(`fetchOrganizationUsers 호출: orgId=${organizationId}, pageIndex=${pageIndex}, pageSize=${pageSize}`);
  
  // organizationId 검증
  if (!organizationId || typeof organizationId !== 'string') {
    console.error(`잘못된 organizationId: ${organizationId}`);
    return { data: [], count: 0 };
  }
  
  // 숫자 파라미터 유효성 검사
  const validPageIndex = Number.isInteger(pageIndex) && pageIndex >= 0 ? pageIndex : 0;
  const validPageSize = Number.isInteger(pageSize) && pageSize > 0 ? pageSize : 10;
  
  console.log(`유효한 파라미터: orgId=${organizationId}, pageIndex=${validPageIndex}, pageSize=${validPageSize}`);
  
  const supabase = createClient();
  
  try {
    // 쿼리를 단순화하여 문제 지점 파악
    console.log(`쿼리 실행: SELECT * FROM profiles WHERE organization_id = ${organizationId} LIMIT ${validPageSize} OFFSET ${validPageIndex * validPageSize}`);
    
    const { data, error, count } = await supabase
      .from("profiles")
      .select("*", { count: 'exact' })
      .eq("organization_id", organizationId)
      .range(validPageIndex * validPageSize, (validPageIndex + 1) * validPageSize - 1);
    
    if (error) {
      // 자세한 에러 정보 로깅
      console.error("Supabase 쿼리 오류:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      throw error;
    }
    
    console.log(`쿼리 결과: ${data?.length || 0}개 항목, 총 ${count || 0}개`);
    return {
      data: data as User[] || [],
      count: count || 0
    };
  } catch (e: any) {
    // 더 자세한 에러 정보 수집
    console.error("Supabase 쿼리 오류 세부정보:", {
      name: e?.name,
      message: e?.message,
      stack: e?.stack,
      details: e?.details,
      hint: e?.hint,
      code: e?.code
    });
    
    return { data: [], count: 0 };
  }
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
async function updateUser(userId: string, userData: Partial<User>) {
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
async function deleteUser(userId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("profiles")
    .delete()
    .eq("id", userId);
  
  if (error) throw error;
  return true;
}

// 단일 사용자 조회 훅
export function useUser(userId: string) {
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
export function useOrganizationUsers(organizationId: string, pageSize = 10) {
  console.log(`useOrganizationUsers 초기화: orgId=${organizationId}, pageSize=${pageSize}`);
  
  // 페이지 크기 유효성 검사
  const validPageSize = Number.isInteger(pageSize) && pageSize > 0 ? pageSize : 10;
  
  const getKey = (pageIndex: number, previousPageData: any) => {
    // 유효성 검사
    if (!organizationId || organizationId === "") {
      console.log(`getKey: organizationId 없음 - null 반환`);
      return null;
    }
    
    if (previousPageData && !previousPageData.data.length) {
      console.log(`getKey: 이전 페이지 데이터 없음 - null 반환`);
      return null;
    }
    
    // 키 생성 형식을 변경 - 더 명확한 구분자 사용
    const key = `organization:${organizationId}:pageIndex:${pageIndex}:pageSize:${validPageSize}`;
    console.log(`getKey: ${key} 생성됨`);
    return key;
  };
  
  const { data, error, size, setSize, isLoading, isValidating, mutate } = useSWRInfinite(
    getKey,
    async (key) => {
      console.log(`무한 스크롤 fetcher 호출: key=${key}`);
      
      try {
        if (!key) {
          console.log(`key가 없음, 빈 결과 반환`);
          return { data: [], count: 0 };
        }
        
        // 새로운 키 형식 파싱: organization:ID:pageIndex:N:pageSize:M
        const parts = key.split(':');
        console.log(`키 분석: ${JSON.stringify(parts)}`);
        
        if (parts.length !== 6) {
          console.error(`유효하지 않은 키 형식: ${key}, 부분 수: ${parts.length}`);
          return { data: [], count: 0 };
        }
        
        const orgId = parts[1];
        const pageIndexStr = parts[3];
        const pageSizeStr = parts[5];
        
        console.log(`파싱된 값(Raw): orgId=${orgId}, pageIndexStr=${pageIndexStr}, pageSizeStr=${pageSizeStr}`);
        
        let pageIndex: number;
        try {
          pageIndex = parseInt(pageIndexStr, 10);
          if (isNaN(pageIndex)) {
            console.error(`정수 변환 실패: '${pageIndexStr}'는 유효한 정수가 아님`);
            pageIndex = 0;
          }
        } catch (e) {
          console.error(`pageIndex 파싱 오류:`, e);
          pageIndex = 0;
        }
        
        let finalPageSize: number;
        try {
          finalPageSize = parseInt(pageSizeStr, 10);
          if (isNaN(finalPageSize) || finalPageSize <= 0) {
            finalPageSize = validPageSize;
          }
        } catch (e) {
          finalPageSize = validPageSize;
        }
        
        console.log(`최종 파싱 값: orgId=${orgId}, pageIndex=${pageIndex}, pageSize=${finalPageSize}`);
        
        if (!orgId) {
          console.error(`유효하지 않은 organizationId: ${orgId}`);
          return { data: [], count: 0 };
        }
        
        console.log(`fetchOrganizationUsers 호출 준비: orgId=${orgId}, pageIndex=${pageIndex}, pageSize=${finalPageSize}`);
        return fetchOrganizationUsers(orgId, pageIndex, finalPageSize);
      } catch (e: any) {
        console.error("데이터 로딩 오류:", {
          name: e?.name,
          message: e?.message,
          stack: e?.stack
        });
        return { data: [], count: 0 };
      }
    },
    {
      revalidateFirstPage: false,
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1분 동안 중복 요청 방지
      onError: (err) => {
        console.error("SWR 에러 발생:", err);
      }
    }
  );
  
  // 모든 페이지의 데이터를 하나의 배열로 합치기
  const users = data ? data.flatMap(page => page.data) : [];
  // 총 사용자 수
  const total = data && data[0] ? data[0].count : 0;
  // 다음 페이지 존재 여부 확인
  const isReachingEnd = data ? data[data.length - 1]?.data.length < validPageSize : false;
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
