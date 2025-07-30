import { useSupabaseCRUD } from '../base/useSupabaseCRUD';
import { useSupabaseQuery, createMutation } from '../base/useSupabaseQuery';
import { Organization } from '@/types';

// 조직 목록 조회 훅 (스퀴즈 조직 제외)
export function useOrganizationListRefactored() {
  return useSupabaseQuery<Organization[]>(
    'organizations-filtered',
    async (supabase) => {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .not('name', 'ilike', '%스퀴즈%')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as Organization[];
    }
  );
}

// 모든 조직 목록 조회 훅 (관리자용)
export function useAllOrganizationsRefactored() {
  const crud = useSupabaseCRUD({
    tableName: 'organizations',
    cacheKey: 'all-organizations',
  });

  return {
    organizations: crud.data as Organization[],
    isLoading: crud.isLoading,
    error: crud.error,
    refetch: crud.refetch,
  };
}

// 단일 조직 조회 훅
export function useOrganizationDetailRefactored(organizationId: string | null) {
  return useSupabaseQuery<Organization>(
    organizationId ? `organization:${organizationId}` : null,
    async (supabase) => {
      if (!organizationId) throw new Error('Organization ID is required');

      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', organizationId)
        .single();

      if (error) throw error;
      return data as Organization;
    }
  );
}

// 조직 통계 조회 훅
export function useOrganizationStatsRefactored(organizationId: string | null) {
  return useSupabaseQuery(
    organizationId ? `organization-stats:${organizationId}` : null,
    async (supabase) => {
      if (!organizationId) throw new Error('Organization ID is required');

      // 조직의 사용자 수
      const { count: userCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId);

      // 조직의 여정 수 (조직이 참여한 여정)
      const { count: journeyCount } = await supabase
        .from('journey_users')
        .select('profiles!inner(*)', { count: 'exact', head: true })
        .eq('profiles.organization_id', organizationId);

      // 조직의 활성 팀 수
      const { count: teamCount } = await supabase
        .from('team_members')
        .select('profiles!inner(*)', { count: 'exact', head: true })
        .eq('profiles.organization_id', organizationId);

      return {
        userCount: userCount || 0,
        journeyCount: journeyCount || 0,
        teamCount: teamCount || 0,
      };
    }
  );
}

// 조직 관련 작업 훅
export function useOrganizationActionsRefactored() {
  // 조직 생성
  const createOrganization = createMutation<Organization, Omit<Organization, 'id'>>(
    async (supabase, organizationData) => {
      const { data, error } = await supabase
        .from('organizations')
        .insert(organizationData)
        .select()
        .single();

      if (error) throw error;
      return data as Organization;
    },
    {
      revalidateKeys: ['organizations', 'all-organizations'],
    }
  );

  // 조직 업데이트
  const updateOrganization = createMutation<Organization, { id: string; updates: Partial<Organization> }>(
    async (supabase, { id, updates }) => {
      const { data, error } = await supabase
        .from('organizations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Organization;
    },
    {
      revalidateKeys: ['organizations', 'all-organizations', 'organization'],
    }
  );

  // 조직 삭제
  const deleteOrganization = createMutation<boolean, string>(
    async (supabase, organizationId) => {
      // 조직에 속한 사용자가 있는지 확인
      const { count: userCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId);

      if (userCount && userCount > 0) {
        throw new Error('조직에 속한 사용자가 있어 삭제할 수 없습니다.');
      }

      const { error } = await supabase
        .from('organizations')
        .delete()
        .eq('id', organizationId);

      if (error) throw error;
      return true;
    },
    {
      revalidateKeys: ['organizations', 'all-organizations'],
    }
  );

  return {
    createOrganization,
    updateOrganization,
    deleteOrganization,
  };
}

// 조직별 사용자 목록 조회
export function useOrganizationUsersRefactored(organizationId: string | null) {
  return useSupabaseQuery(
    organizationId ? `organization-users:${organizationId}` : null,
    async (supabase) => {
      if (!organizationId) throw new Error('Organization ID is required');

      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          first_name,
          last_name,
          role,
          profile_image,
          created_at
        `)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    }
  );
}