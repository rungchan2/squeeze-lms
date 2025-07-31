import { 
  useSupabaseQuery,
  createCacheKey,
  createMutation
} from '../base/useSupabaseQuery';
import { useSupabaseAuth } from '../useSupabaseAuth';
import {
  getJourneyUsers,
  getCurrentUserJourneys,
  getUserJourneyStatus,
  addUserToJourney,
  removeUserFromJourney,
  updateUserRole,
  addMultipleUsersToJourney,
  inviteUserByEmail
} from '@/utils/data/userJourney';

interface UserJourney {
  id: string;
  user_id: string;
  journey_id: string;
  role_in_journey: 'participant' | 'teacher' | 'admin';
  created_at: string;
  updated_at: string;
  joined_at: string;
  profiles?: {
    id: string;
    first_name: string;
    last_name: string;
    profile_image?: string;
    email: string;
  };
  journeys?: {
    id: string;
    name: string;
  };
}

// 특정 여정의 사용자 목록 조회 훅
export function useJourneyUsersRefactored(journeyId: string | null) {
  return useSupabaseQuery<UserJourney[]>(
    journeyId ? createCacheKey('journey-users', { journeyId }) : null,
    async () => {
      if (!journeyId) return [];
      return await getJourneyUsers(journeyId);
    },
    {
      dedupingInterval: 60000, // 1분 동안 중복 요청 방지
    }
  );
}

// 현재 사용자가 참여한 모든 여정 조회 훅
export function useCurrentUserJourneysRefactored() {
  const { id: userId } = useSupabaseAuth();

  return useSupabaseQuery<UserJourney[]>(
    userId ? createCacheKey('current-user-journeys', { userId }) : null,
    async () => {
      if (!userId) return [];
      return await getCurrentUserJourneys(userId);
    },
    {
      dedupingInterval: 60000, // 1분 동안 중복 요청 방지
    }
  );
}

// 특정 사용자의 여정 참여 상태 조회 훅
export function useUserJourneyStatusRefactored(journeyId: string | null) {
  const { id: userId } = useSupabaseAuth();

  return useSupabaseQuery<UserJourney | null>(
    journeyId && userId 
      ? createCacheKey('user-journey-status', { journeyId, userId })
      : null,
    async () => {
      if (!journeyId || !userId) return null;
      return await getUserJourneyStatus(journeyId, userId);
    }
  );
}

// 여정 사용자 CRUD 작업 훅
export function useJourneyUserActionsRefactored() {

  // 사용자를 여정에 추가
  const addUserToJourneyMutation = createMutation<
    UserJourney,
    { userId: string; journeyId: string; role?: 'participant' | 'teacher' | 'admin' }
  >(
    async ({ userId, journeyId, role = 'participant' }) => {
      return await addUserToJourney({ userId, journeyId, role });
    },
    {
      revalidateKeys: ['journey-users', 'current-user-journeys', 'user-journey-status'],
    }
  );

  // 여정에서 사용자 제거
  const removeUserFromJourneyMutation = createMutation<
    boolean,
    { userId: string; journeyId: string }
  >(
    async ({ userId, journeyId }) => {
      return await removeUserFromJourney(userId, journeyId);
    },
    {
      revalidateKeys: ['journey-users', 'current-user-journeys', 'user-journey-status'],
    }
  );

  // 사용자의 여정 내 역할 변경
  const updateUserRoleMutation = createMutation<
    UserJourney,
    { userId: string; journeyId: string; newRole: 'participant' | 'teacher' | 'admin' }
  >(
    async ({ userId, journeyId, newRole }) => {
      return await updateUserRole({ userId, journeyId, newRole });
    },
    {
      revalidateKeys: ['journey-users', 'user-journey-status'],
    }
  );

  // 여러 사용자를 한 번에 여정에 추가
  const addMultipleUsersToJourneyMutation = createMutation<
    UserJourney[],
    { userIds: string[]; journeyId: string; role?: 'participant' | 'teacher' | 'admin' }
  >(
    async ({ userIds, journeyId, role = 'participant' }) => {
      return await addMultipleUsersToJourney({ userIds, journeyId, role });
    },
    {
      revalidateKeys: ['journey-users', 'current-user-journeys'],
    }
  );

  return {
    addUserToJourney: addUserToJourneyMutation,
    removeUserFromJourney: removeUserFromJourneyMutation,
    updateUserRole: updateUserRoleMutation,
    addMultipleUsersToJourney: addMultipleUsersToJourneyMutation,
  };
}

// 여정 사용자 통계 훅
export function useJourneyUserStatsRefactored(journeyId: string | null) {
  const { data: journeyUsers } = useJourneyUsersRefactored(journeyId);

  return useSupabaseQuery(
    journeyId ? createCacheKey('journey-user-stats', { journeyId }) : null,
    async () => {
      if (!journeyUsers) return {};

      const stats = {
        total: journeyUsers.length,
        participants: journeyUsers.filter(user => user.role_in_journey === 'participant').length,
        teachers: journeyUsers.filter(user => user.role_in_journey === 'teacher').length,
        admins: journeyUsers.filter(user => user.role_in_journey === 'admin').length,
        recentJoins: journeyUsers.filter(user => {
          const joinDate = new Date(user.joined_at);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return joinDate > weekAgo;
        }).length,
      };

      return stats;
    },
    {
      // journeyUsers 데이터가 변경될 때만 재계산
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );
}

// 여정 권한 확인 훅
export function useJourneyPermissionsRefactored(journeyId: string | null) {
  const { id: userId } = useSupabaseAuth();
  const { data: userJourneyStatus } = useUserJourneyStatusRefactored(journeyId);

  const permissions = {
    isJoined: !!userJourneyStatus,
    isParticipant: userJourneyStatus?.role_in_journey === 'participant',
    isTeacher: userJourneyStatus?.role_in_journey === 'teacher',
    isAdmin: userJourneyStatus?.role_in_journey === 'admin',
    canManageUsers: userJourneyStatus?.role_in_journey === 'admin' || userJourneyStatus?.role_in_journey === 'teacher',
    canEditJourney: userJourneyStatus?.role_in_journey === 'admin',
    canCreateMissions: userJourneyStatus?.role_in_journey === 'admin' || userJourneyStatus?.role_in_journey === 'teacher',
  };

  return permissions;
}

// 사용자 초대 관리 훅 (이메일 기반)
export function useJourneyInvitationsRefactored(journeyId: string | null) {
  
  // 이메일로 사용자 초대
  const inviteUserByEmailMutation = createMutation<
    boolean,
    { email: string; role?: 'participant' | 'teacher' | 'admin' }
  >(
    async ({ email, role = 'participant' }) => {
      if (!journeyId) throw new Error('Journey ID is required');
      return await inviteUserByEmail({ email, journeyId, role });
    },
    {
      revalidateKeys: ['journey-users'],
    }
  );

  return {
    inviteUserByEmail: inviteUserByEmailMutation,
  };
}