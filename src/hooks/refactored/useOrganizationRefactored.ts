import {
  useSupabaseQuery,
  createCacheKey,
  createMutation
} from '../base/useSupabaseQuery';
import { Organization } from '@/types';
import {
  getOrganizations,
  getOrganizationById,
  getPublicOrganizations,
  createOrganization,
  updateOrganization,
  deleteOrganization
} from '@/utils/data/organization';

// 전체 조직 목록 조회 훅
export function useOrganizationsRefactored() {
  return useSupabaseQuery<Organization[]>(
    createCacheKey('organizations'),
    async () => {
      const result = await getOrganizations();
      if (result.error) throw result.error;
      return (result.data || []) as Organization[];
    },
    {
      dedupingInterval: 300000, // 5분 동안 중복 요청 방지 (조직 정보는 자주 변경되지 않음)
    }
  );
}

// 공개 조직 목록 조회 훅 (내부 조직 제외)
export function usePublicOrganizationsRefactored() {
  return useSupabaseQuery<Organization[]>(
    createCacheKey('public-organizations'),
    async () => {
      const result = await getPublicOrganizations();
      if (result.error) throw result.error;
      return (result.data || []) as Organization[];
    },
    {
      dedupingInterval: 300000, // 5분 동안 중복 요청 방지
    }
  );
}

// 단일 조직 조회 훅
export function useOrganizationRefactored(organizationId: string | null) {
  return useSupabaseQuery<Organization>(
    organizationId ? createCacheKey('organization', { organizationId }) : null,
    async () => {
      if (!organizationId) throw new Error('Organization ID is required');
      
      const result = await getOrganizationById(organizationId);
      if (result.error) throw result.error;
      return result.data as Organization;
    }
  );
}

// 조직 CRUD 액션들
export function useOrganizationActionsRefactored() {
  // 조직 생성
  const createOrganizationMutation = createMutation<Organization, {
    name: string;
    description?: string;
    logo_url?: string;
  }>(
    async (organizationData) => {
      const result = await createOrganization(organizationData);
      if (result.error) throw result.error;
      return result.data as Organization;
    },
    {
      revalidateKeys: ['organizations', 'public-organizations']
    }
  );

  // 조직 수정
  const updateOrganizationMutation = createMutation<Organization, {
    id: string;
    updates: {
      name?: string;
      description?: string;
      logo_url?: string;
    };
  }>(
    async ({ id, updates }) => {
      const result = await updateOrganization(id, updates);
      if (result.error) throw result.error;
      return result.data as Organization;
    },
    {
      revalidateKeys: ['organizations', 'public-organizations', 'organization']
    }
  );

  // 조직 삭제
  const deleteOrganizationMutation = createMutation<void, string>(
    async (organizationId) => {
      const result = await deleteOrganization(organizationId);
      if (result.error) throw result.error;
    },
    {
      revalidateKeys: ['organizations', 'public-organizations', 'organization']
    }
  );

  return {
    createOrganization: createOrganizationMutation,
    updateOrganization: updateOrganizationMutation,
    deleteOrganization: deleteOrganizationMutation
  };
}

// 편의 함수들
export function useCreateOrganizationRefactored() {
  const actions = useOrganizationActionsRefactored();
  return actions.createOrganization;
}

export function useUpdateOrganizationRefactored() {
  const actions = useOrganizationActionsRefactored();
  return actions.updateOrganization;
}

export function useDeleteOrganizationRefactored() {
  const actions = useOrganizationActionsRefactored();
  return actions.deleteOrganization;
}