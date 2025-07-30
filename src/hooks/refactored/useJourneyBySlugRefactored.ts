import { 
  useSupabaseQuery,
  createCacheKey
} from '../base/useSupabaseQuery';
import { Journey } from '@/types';

// 슬러그로 여정 조회 훅 (ID 기반)
export function useJourneyBySlugRefactored(slug: string | null) {
  return useSupabaseQuery<Journey>(
    slug ? createCacheKey('journey-by-slug', { slug }) : null,
    async (supabase) => {
      if (!slug) throw new Error('Journey slug is required');

      const { data, error } = await supabase
        .from('journeys')
        .select('*')
        .eq('id', slug) // 현재 구현에서는 ID를 slug로 사용
        .single();

      if (error) throw error;
      return data as Journey;
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
    async (supabase) => {
      if (!slug) throw new Error('Journey slug is required');

      const { data, error } = await supabase
        .from('journeys')
        .select('*')
        .eq('slug', slug) // 실제 slug 필드 사용
        .single();

      if (error) throw error;
      return data as Journey;
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
    async (supabase) => {
      if (!slug) throw new Error('Journey slug is required');

      const { data, error } = await supabase
        .from('journeys')
        .select(`
          *,
          organizations (
            id,
            name
          ),
          journey_weeks (
            id,
            title,
            week_number,
            start_date,
            end_date
          )
        `)
        .eq('id', slug)
        .single();

      if (error) throw error;

      // 참여자 수 조회
      const { count: userCount } = await supabase
        .from('user_journeys')
        .select('*', { count: 'exact', head: true })
        .eq('journey_id', slug);

      return {
        ...data,
        user_journeys_count: userCount || 0,
      } as Journey & {
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
    async (supabase) => {
      if (!slug) throw new Error('Journey slug is required');

      // 기본 여정 정보
      const { data: journey, error: journeyError } = await supabase
        .from('journeys')
        .select('*')
        .eq('id', slug)
        .single();

      if (journeyError) throw journeyError;

      // 전체 주차 수
      const { count: totalWeeks } = await supabase
        .from('journey_weeks')
        .select('*', { count: 'exact', head: true })
        .eq('journey_id', slug);

      // 전체 미션 수
      const { count: totalMissions } = await supabase
        .from('journey_mission_instances')
        .select('*', { count: 'exact', head: true })
        .eq('journey_id', slug);

      // 전체 게시물 수
      const { count: totalPosts } = await supabase
        .from('posts')
        .select('journey_mission_instances!inner(*)', { count: 'exact', head: true })
        .eq('journey_mission_instances.journey_id', slug);

      // 참여자 수
      const { count: participantCount } = await supabase
        .from('user_journeys')
        .select('*', { count: 'exact', head: true })
        .eq('journey_id', slug);

      // 현재 활성 주차 계산 (현재 날짜 기준)
      const now = new Date();
      const { data: currentWeek } = await supabase
        .from('journey_weeks')
        .select('*')
        .eq('journey_id', slug)
        .lte('start_date', now.toISOString())
        .gte('end_date', now.toISOString())
        .maybeSingle();

      return {
        journey: journey as Journey,
        stats: {
          totalWeeks: totalWeeks || 0,
          totalMissions: totalMissions || 0,
          totalPosts: totalPosts || 0,
          participantCount: participantCount || 0,
        },
        currentWeek: currentWeek || null,
        progress: {
          weeksCompleted: 0, // 완료된 주차 수 (별도 계산 필요)
          missionsCompleted: 0, // 완료된 미션 수 (별도 계산 필요)
          completionRate: 0, // 전체 완료율 (별도 계산 필요)
        },
      };
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
    async (supabase) => {
      if (!searchTerm) return [];

      const { data, error } = await supabase
        .from('journeys')
        .select('*')
        .or(`slug.ilike.%${searchTerm}%,title.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return (data || []) as Journey[];
    },
    {
      dedupingInterval: 60000, // 1분 동안 중복 요청 방지
    }
  );
}