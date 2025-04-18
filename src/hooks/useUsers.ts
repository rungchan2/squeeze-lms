import useSWRInfinite from "swr/infinite";
import useSWR from "swr";
import {
  updateProfile,
  getUserById,
  getAllUsersByPage,
  getOrganizationUsersByPage,
} from "@/utils/data/user";

// 단일 사용자 조회 훅
export function useUser(userId: string) {
  const { data, error, isLoading, mutate } = useSWR(
    userId ? `user-${userId}` : null,
    () => getUserById(userId),
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000, // 30초 동안 중복 요청 방지
    }
  );

  return {
    updateUser: updateProfile,
    user: data,
    error,
    isLoading,
    mutate,
  };
}

// 모든 사용자 무한 스크롤 훅
export function useAllUsers(pageSize = 10) {
  const getKey = (pageIndex: number, previousPageData: any) => {
    // 더 이상 불러올 데이터가 없으면 null 반환
    if (previousPageData && !previousPageData.data.length) return null;
    return `all-users-page-${pageIndex}-${pageSize}`;
  };

  const { data, error, size, setSize, isLoading, isValidating, mutate } =
    useSWRInfinite(
      getKey,
      async (key) => {
        const pageIndex = parseInt(key.split("-")[3]);
        return getAllUsersByPage(pageIndex, pageSize);
      },
      {
        revalidateFirstPage: false,
        revalidateOnFocus: false,
        dedupingInterval: 60000, // 1분 동안 중복 요청 방지
      }
    );

  // 모든 페이지의 데이터를 하나의 배열로 합치기
  const users = data ? data.flatMap((page) => page.data) : [];
  // 총 사용자 수
  const total = data && data[0] ? data[0].count : 0;
  // 다음 페이지 존재 여부 확인
  const isReachingEnd = data
    ? data[data.length - 1]?.data.length < pageSize
    : false;
  // 추가 데이터 로딩 중 여부
  const isLoadingMore =
    isLoading || (size > 0 && data && typeof data[size - 1] === "undefined");

  // 다음 페이지 로드 함수
  const loadMore = () => {
    if (!isReachingEnd && !isLoadingMore) {
      setSize(size + 1);
    }
  };

  return {
    updateUser: updateProfile,
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
    mutate,
  };
}

// 조직에 속한 사용자 무한 스크롤 훅
export function useOrganizationUsers(organizationId: string, pageSize = 10) {
  console.log(
    `useOrganizationUsers 초기화: orgId=${organizationId}, pageSize=${pageSize}`
  );

  // 페이지 크기 유효성 검사
  const validPageSize =
    Number.isInteger(pageSize) && pageSize > 0 ? pageSize : 10;

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

  const { data, error, size, setSize, isLoading, isValidating, mutate } =
    useSWRInfinite(
      getKey,
      async (key) => {
        console.log(`무한 스크롤 fetcher 호출: key=${key}`);

        try {
          if (!key) {
            console.log(`key가 없음, 빈 결과 반환`);
            return { data: [], count: 0 };
          }
          const parts = key.split(":");

          if (parts.length !== 6) {
            console.error(
              `유효하지 않은 키 형식: ${key}, 부분 수: ${parts.length}`
            );
            return { data: [], count: 0 };
          }

          const orgId = parts[1];
          const pageIndexStr = parts[3];
          const pageSizeStr = parts[5];

          let pageIndex: number;
          try {
            pageIndex = parseInt(pageIndexStr, 10);
            if (isNaN(pageIndex)) {
              console.error(
                `정수 변환 실패: '${pageIndexStr}'는 유효한 정수가 아님`
              );
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

          console.log(
            `최종 파싱 값: orgId=${orgId}, pageIndex=${pageIndex}, pageSize=${finalPageSize}`
          );

          if (!orgId) {
            console.error(`유효하지 않은 organizationId: ${orgId}`);
            return { data: [], count: 0 };
          }

          console.log(
            `fetchOrganizationUsers 호출 준비: orgId=${orgId}, pageIndex=${pageIndex}, pageSize=${finalPageSize}`
          );
          return getOrganizationUsersByPage(orgId, pageIndex, finalPageSize);
        } catch (e: any) {
          console.error("데이터 로딩 오류:", {
            name: e?.name,
            message: e?.message,
            stack: e?.stack,
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
        },
      }
    );

  // 모든 페이지의 데이터를 하나의 배열로 합치기
  const users = data ? data.flatMap((page) => page.data) : [];
  // 총 사용자 수
  const total = data && data[0] ? data[0].count : 0;
  // 다음 페이지 존재 여부 확인
  const isReachingEnd = data
    ? data[data.length - 1]?.data.length < validPageSize
    : false;
  // 추가 데이터 로딩 중 여부
  const isLoadingMore =
    isLoading || (size > 0 && data && typeof data[size - 1] === "undefined");

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
    mutate,
  };
}
