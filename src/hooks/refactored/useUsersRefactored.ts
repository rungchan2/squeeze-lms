import { 
  useSupabaseQuery, 
  useSupabaseInfiniteQuery,
  createCacheKey,
  createMutation,
  PaginatedResponse 
} from '../base/useSupabaseQuery';
import { Profile } from '@/types';

interface UserWithOrganization extends Profile {
  organizations?: {
    id: string;
    name: string;
  };
}

// 단일 사용자 조회 훅
export function useUserRefactored(userId: string | null) {
  const result = useSupabaseQuery<UserWithOrganization>(
    userId ? `user:${userId}` : null,
    async (supabase) => {
      if (!userId) throw new Error('User ID is required');

      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          organizations (
            id,
            name
          )
        `)
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data as UserWithOrganization;
    },
    {
      dedupingInterval: 30000, // 30초
    }
  );

  // 사용자 업데이트 함수
  const updateUser = createMutation<Profile, { userId: string; updates: Partial<Profile> }>(
    async (supabase, { userId, updates }) => {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return data as Profile;
    },
    {
      revalidateKeys: [`user:${userId}`, 'users'],
    }
  );

  return {
    user: result.data,
    error: result.error,
    isLoading: result.isLoading,
    mutate: result.refetch,
    updateUser,
  };
}

// 모든 사용자 무한 스크롤 훅
export function useAllUsersRefactored(pageSize = 10) {
  const getKey = (pageIndex: number, previousPageData: PaginatedResponse<UserWithOrganization> | null) => {
    if (previousPageData === null || previousPageData.nextPage !== null) {
      return createCacheKey('all-users', { page: pageIndex, size: pageSize });
    }
    return null;
  };

  const result = useSupabaseInfiniteQuery<UserWithOrganization>(
    getKey,
    async (supabase, pageIndex, pageSize) => {
      const from = pageIndex * pageSize;
      const to = from + pageSize - 1;

      const { data, error, count } = await supabase
        .from('profiles')
        .select(`
          *,
          organizations (
            id,
            name
          )
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      const hasNextPage = count ? from + pageSize < count : false;
      const nextPage = hasNextPage ? pageIndex + 1 : null;

      return {
        data: (data || []) as UserWithOrganization[],
        nextPage,
        total: count ?? 0,
      };
    },
    pageSize
  );

  return {
    users: result.data,
    error: result.error,
    isLoading: result.isLoading,
    isValidating: result.isValidating,
    loadMore: result.loadMore,
    isLoadingMore: result.isLoadingMore,
    isReachingEnd: !result.hasNextPage,
    total: result.total,
    size: result.size,
    setSize: result.setSize,
    mutate: result.refetch,
  };
}

// 조직별 사용자 무한 스크롤 훅
export function useOrganizationUsersRefactored(
  organizationId: string | null,
  pageSize = 10
) {
  const getKey = (pageIndex: number, previousPageData: PaginatedResponse<UserWithOrganization> | null) => {
    if (!organizationId) return null;
    
    if (previousPageData === null || previousPageData.nextPage !== null) {
      return createCacheKey('org-users', { 
        orgId: organizationId, 
        page: pageIndex, 
        size: pageSize 
      });
    }
    return null;
  };

  const result = useSupabaseInfiniteQuery<UserWithOrganization>(
    getKey,
    async (supabase, pageIndex, pageSize) => {
      if (!organizationId) throw new Error('Organization ID is required');

      const from = pageIndex * pageSize;
      const to = from + pageSize - 1;

      const { data, error, count } = await supabase
        .from('profiles')
        .select(`
          *,
          organizations!inner (
            id,
            name
          )
        `, { count: 'exact' })
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      const hasNextPage = count ? from + pageSize < count : false;
      const nextPage = hasNextPage ? pageIndex + 1 : null;

      return {
        data: (data || []) as UserWithOrganization[],
        nextPage,
        total: count ?? 0,
      };
    },
    pageSize
  );

  return {
    users: result.data,
    error: result.error,
    isLoading: result.isLoading,
    isValidating: result.isValidating,
    loadMore: result.loadMore,
    isLoadingMore: result.isLoadingMore,
    isReachingEnd: !result.hasNextPage,
    total: result.total,
    size: result.size,
    setSize: result.setSize,
    mutate: result.refetch,
  };
}

// 사용자 검색 훅
export function useUserSearchRefactored(searchTerm: string, filters?: {
  role?: string;
  organizationId?: string;
}) {
  const key = searchTerm ? createCacheKey('user-search', { search: searchTerm, ...filters }) : null;

  return useSupabaseQuery<UserWithOrganization[]>(
    key,
    async (supabase) => {
      let query = supabase
        .from('profiles')
        .select(`
          *,
          organizations (
            id,
            name
          )
        `);

      // 검색어 적용
      if (searchTerm) {
        query = query.or(
          `email.ilike.%${searchTerm}%,first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%`
        );
      }

      // 필터 적용
      if (filters?.role) {
        query = query.eq('role', filters.role);
      }
      if (filters?.organizationId) {
        query = query.eq('organization_id', filters.organizationId);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return (data || []) as UserWithOrganization[];
    }
  );
}