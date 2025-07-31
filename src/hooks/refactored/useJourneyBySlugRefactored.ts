import { 
  useSupabaseQuery,
  createCacheKey
} from '../base/useSupabaseQuery';
import { Journey } from '@/types';
import {
  getJourneyBySlug,
  getJourneyByActualSlug,
  getJourneyDetailsById,
  getJourneyProgressById,
  searchJourneysBySlug
} from '@/utils/data/journey';

// 슬러그로 여정 조회 훅 (ID 기반)
export function useJourneyBySlugRefactored(slug: string | null) {
  return useSupabaseQuery<Journey>(
    slug ? createCacheKey('journey-by-slug', { slug }) : null,
    async () => {
      if (!slug) throw new Error('Journey slug is required');
      return await getJourneyBySlug(slug);
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 300000, // 5분 동안 중복 요청 방지
    }
  );
}

// 실제 슬러그 필드로 여정 조회 훅 (slug 필드가 있는 경우)
export function useJourneyByActualSlugRefactored(slug: string | null) {
  return useSupabaseQuery<Journey>(
    slug ? createCacheKey('journey-by-actual-slug', { slug }) : null,
    async () => {
      if (!slug) throw new Error('Journey slug is required');
      return await getJourneyByActualSlug(slug);
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 300000, // 5분 동안 중복 요청 방지
    }
  );
}

// 여정 기본 정보와 관련 데이터를 함께 조회하는 확장 훅
export function useJourneyDetailsBySlugRefactored(slug: string | null) {
  return useSupabaseQuery<Journey & {
    organization?: any;
    journey_weeks?: any[];
    user_journeys_count?: number;
  }>(
    slug ? createCacheKey('journey-details-by-slug', { slug }) : null,
    async () => {
      if (!slug) throw new Error('Journey slug is required');
      return await getJourneyDetailsById(slug) as Journey & {
        organization?: any;
        journey_weeks?: any[];
        user_journeys_count?: number;
      };
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 300000, // 5분 동안 중복 요청 방지
    }
  );
}

// 여정의 진행 상황 정보를 포함한 조회 훅
export function useJourneyProgressBySlugRefactored(slug: string | null) {
  return useSupabaseQuery(
    slug ? createCacheKey('journey-progress-by-slug', { slug }) : null,
    async () => {
      if (!slug) throw new Error('Journey slug is required');
      return await getJourneyProgressById(slug);
    },
    {
      dedupingInterval: 300000, // 5분 동안 중복 요청 방지
    }
  );
}

// 여정 검색 및 필터링 훅 (슬러그 패턴 매칭)
export function useJourneySearchBySlugRefactored(searchTerm: string | null) {
  return useSupabaseQuery<Journey[]>(
    searchTerm ? createCacheKey('journey-search-by-slug', { searchTerm }) : null,
    async () => {
      if (!searchTerm) return [];
      return await searchJourneysBySlug(searchTerm);
    },
    {
      dedupingInterval: 60000, // 1분 동안 중복 요청 방지
    }
  );
}