import { useCallback, useMemo } from 'react';
import useSWR, { SWRConfiguration, mutate as globalMutate } from 'swr';
import useSWRInfinite, { SWRInfiniteConfiguration } from 'swr/infinite';
import { createClient } from '@/utils/supabase/client';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';

// 공통 타입 정의
export interface QueryError {
  message: string;
  code?: string;
  details?: any;
}

export interface PaginatedResponse<T> {
  data: T[];
  nextPage: number | null;
  total: number;
}

// 기본 SWR 설정
export const defaultSWRConfig: SWRConfiguration = {
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  revalidateIfStale: false,
  dedupingInterval: 60000, // 60초
  keepPreviousData: true,
  errorRetryCount: 3,
  errorRetryInterval: 5000,
};

// Supabase 클라이언트 싱글톤
let supabaseClient: SupabaseClient<Database> | null = null;

export function getSupabaseClient() {
  if (!supabaseClient) {
    supabaseClient = createClient();
  }
  return supabaseClient;
}

// 캐시 키 생성 유틸리티
export function createCacheKey(base: string, params?: Record<string, any>): string {
  if (!params) return base;
  
  const sortedParams = Object.keys(params)
    .sort()
    .reduce((acc, key) => {
      if (params[key] !== undefined && params[key] !== null) {
        acc[key] = params[key];
      }
      return acc;
    }, {} as Record<string, any>);
  
  return `${base}:${JSON.stringify(sortedParams)}`;
}

// 기본 쿼리 훅
export function useSupabaseQuery<T>(
  key: string | null,
  fetcher: (supabase: SupabaseClient<Database>) => Promise<T>,
  config?: SWRConfiguration
) {
  const supabase = useMemo(() => getSupabaseClient(), []);
  
  const wrappedFetcher = useCallback(async () => {
    try {
      return await fetcher(supabase);
    } catch (error: any) {
      throw {
        message: error.message || 'An error occurred',
        code: error.code,
        details: error.details,
      } as QueryError;
    }
  }, [fetcher, supabase]);

  const result = useSWR<T, QueryError>(
    key,
    wrappedFetcher,
    {
      ...defaultSWRConfig,
      ...config,
    }
  );

  return {
    ...result,
    refetch: result.mutate,
  };
}

// 페이지네이션 훅
export function useSupabaseInfiniteQuery<T>(
  getKey: (pageIndex: number, previousPageData: PaginatedResponse<T> | null) => string | null,
  fetcher: (
    supabase: SupabaseClient<Database>,
    pageIndex: number,
    pageSize: number,
    key: string
  ) => Promise<PaginatedResponse<T>>,
  pageSize = 10,
  config?: SWRInfiniteConfiguration
) {
  const supabase = useMemo(() => getSupabaseClient(), []);
  
  const wrappedFetcher = useCallback(
    async (key: string, pageIndex: number) => {
      try {
        return await fetcher(supabase, pageIndex, pageSize, key);
      } catch (error: any) {
        throw {
          message: error.message || 'An error occurred',
          code: error.code,
          details: error.details,
        } as QueryError;
      }
    },
    [fetcher, supabase, pageSize]
  );

  const result = useSWRInfinite<PaginatedResponse<T>, QueryError>(
    getKey,
    ([key, pageIndex]) => wrappedFetcher(key, pageIndex),
    {
      ...defaultSWRConfig,
      ...config,
      parallel: false,
      revalidateFirstPage: false,
    }
  );

  const data = useMemo(() => {
    if (!result.data) return [];
    return result.data.flatMap(page => page.data);
  }, [result.data]);

  const total = result.data?.[0]?.total ?? 0;
  const hasNextPage = result.data 
    ? result.data[result.data.length - 1]?.nextPage !== null 
    : false;

  return {
    ...result,
    data,
    total,
    hasNextPage,
    loadMore: () => result.setSize(result.size + 1),
    isLoadingMore: result.isValidating && !result.isLoading,
    refetch: result.mutate,
  };
}

// 뮤테이션 헬퍼
export function createMutation<T, P>(
  mutationFn: (supabase: SupabaseClient<Database>, params: P) => Promise<T>,
  options?: {
    onSuccess?: (data: T) => void;
    onError?: (error: QueryError) => void;
    revalidateKeys?: string[];
  }
) {
  return async (params: P) => {
    const supabase = getSupabaseClient();
    
    try {
      const result = await mutationFn(supabase, params);
      
      // 성공 시 관련 캐시 무효화
      if (options?.revalidateKeys) {
        await Promise.all(
          options.revalidateKeys.map(key => 
            globalMutate((k) => typeof k === 'string' && k.startsWith(key))
          )
        );
      }
      
      options?.onSuccess?.(result);
      return result;
    } catch (error: any) {
      const queryError: QueryError = {
        message: error.message || 'Mutation failed',
        code: error.code,
        details: error.details,
      };
      
      options?.onError?.(queryError);
      throw queryError;
    }
  };
}