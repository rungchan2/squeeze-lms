import {
  useSupabaseQuery,
  createCacheKey,
  createMutation,
  PaginatedResponse,
  useSupabaseInfiniteQuery
} from '../base/useSupabaseQuery';
import { useSupabaseAuth } from '../useSupabaseAuth';
import { User, CreateUser, SignupPage } from '@/types';
import {
  getSession,
  getUser,
  getOrganizationUsersByPage,
  getAllUsersByPage,
  getUserById,
  getUserProfile,
  deleteProfile,
  deleteUser,
  updateProfile,
  updatePassword,
  createProfile,
  getProfileImage
} from '@/utils/data/user';

// 현재 사용자 세션 조회 훅
export function useSessionRefactored() {
  return useSupabaseQuery(
    createCacheKey('session'),
    async () => {
      const result = await getSession();
      if (result.error) throw result.error;
      return result.session;
    },
    {
      dedupingInterval: 60000, // 1분 동안 중복 요청 방지
    }
  );
}

// 현재 사용자 정보 조회 훅
export function useUserRefactored() {
  return useSupabaseQuery(
    createCacheKey('user'),
    async () => {
      const result = await getUser();
      if (result.error) throw result.error;
      return result.user;
    },
    {
      dedupingInterval: 60000, // 1분 동안 중복 요청 방지
    }
  );
}

// 조직 사용자들 페이지네이션 조회 훅
export function useOrganizationUsersRefactored(
  organizationId: string | null,
  pageSize = 10
) {
  const getKey = (pageIndex: number, previousPageData: PaginatedResponse<User> | null) => {
    if (!organizationId) return null;
    
    if (previousPageData === null || previousPageData.nextPage !== null) {
      return createCacheKey('organization-users', { 
        organizationId, 
        page: pageIndex,
        size: pageSize 
      });
    }
    return null;
  };

  return useSupabaseInfiniteQuery<User>(
    getKey,
    async (pageIndex, pageSize) => {
      if (!organizationId) throw new Error('Organization ID is required');

      const result = await getOrganizationUsersByPage(organizationId, pageIndex, pageSize);
      
      const hasNextPage = result.count === pageSize;
      const nextPage = hasNextPage ? pageIndex + 1 : null;

      return {
        data: result.data,
        nextPage,
        total: result.count
      };
    },
    pageSize
  );
}

// 전체 사용자 페이지네이션 조회 훅
export function useAllUsersRefactored(pageSize = 10) {
  const getKey = (pageIndex: number, previousPageData: PaginatedResponse<User> | null) => {
    if (previousPageData === null || previousPageData.nextPage !== null) {
      return createCacheKey('all-users', { 
        page: pageIndex,
        size: pageSize 
      });
    }
    return null;
  };

  return useSupabaseInfiniteQuery<User>(
    getKey,
    async (pageIndex, pageSize) => {
      const result = await getAllUsersByPage(pageIndex, pageSize);
      
      const hasNextPage = result.count === pageSize;
      const nextPage = hasNextPage ? pageIndex + 1 : null;

      return {
        data: result.data,
        nextPage,
        total: result.count
      };
    },
    pageSize
  );
}

// 단일 사용자 조회 훅
export function useUserByIdRefactored(userId: string | null) {
  return useSupabaseQuery<User>(
    userId ? createCacheKey('user-by-id', { userId }) : null,
    async () => {
      if (!userId) throw new Error('User ID is required');
      
      const result = await getUserById(userId);
      return result;
    }
  );
}

// 현재 사용자 프로필 조회 훅
export function useUserProfileRefactored() {
  return useSupabaseQuery<User>(
    createCacheKey('user-profile'),
    async () => {
      const result = await getUserProfile();
      if (result.error) throw result.error;
      return result.profile as User;
    },
    {
      dedupingInterval: 30000, // 30초 동안 중복 요청 방지
    }
  );
}

// 사용자 프로필 이미지 조회 훅
export function useProfileImageRefactored(userId: string | null) {
  return useSupabaseQuery<string | null>(
    userId ? createCacheKey('profile-image', { userId }) : null,
    async () => {
      if (!userId) return null;
      
      const result = await getProfileImage(userId);
      return result;
    },
    {
      dedupingInterval: 300000, // 5분 동안 중복 요청 방지 (이미지는 자주 변경되지 않음)
    }
  );
}

// 사용자 CRUD 액션들
export function useUserActionsRefactored() {
  // 프로필 생성
  const createProfileMutation = createMutation<void, SignupPage>(
    async (profileData) => {
      const result = await createProfile(profileData);
      if (result.error) throw result.error;
    },
    {
      revalidateKeys: ['user-profile', 'organization-users', 'all-users']
    }
  );

  // 프로필 업데이트
  const updateProfileMutation = createMutation<void, { id: string; data: any }>(
    async ({ id, data }) => {
      const result = await updateProfile(id, data);
      if (result.error) throw result.error;
    },
    {
      revalidateKeys: ['user-profile', 'user-by-id', 'organization-users', 'all-users', 'profile-image']
    }
  );

  // 비밀번호 변경
  const updatePasswordMutation = createMutation<void, string>(
    async (newPassword) => {
      const result = await updatePassword(newPassword);
      if (result.error) throw result.error;
    }
  );

  // 프로필 삭제
  const deleteProfileMutation = createMutation<void, string>(
    async (uid) => {
      const result = await deleteProfile(uid);
      if (result.error) throw result.error;
    },
    {
      revalidateKeys: ['organization-users', 'all-users']
    }
  );

  // 사용자 삭제 (관리자용)
  const deleteUserMutation = createMutation<void, string>(
    async (uid) => {
      const result = await deleteUser(uid);
      if (result.error) throw result.error;
    },
    {
      revalidateKeys: ['organization-users', 'all-users']
    }
  );

  return {
    createProfile: createProfileMutation,
    updateProfile: updateProfileMutation,
    updatePassword: updatePasswordMutation,
    deleteProfile: deleteProfileMutation,
    deleteUser: deleteUserMutation
  };
}

// 편의 함수들
export function useUpdateProfileRefactored() {
  const actions = useUserActionsRefactored();
  return actions.updateProfile;
}

export function useUpdatePasswordRefactored() {
  const actions = useUserActionsRefactored();
  return actions.updatePassword;
}

export function useCreateProfileRefactored() {
  const actions = useUserActionsRefactored();
  return actions.createProfile;
}