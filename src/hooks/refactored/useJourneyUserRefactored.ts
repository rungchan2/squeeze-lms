import { 
  useSupabaseQuery,
  createCacheKey,
  createMutation
} from '../base/useSupabaseQuery';
import { useSupabaseAuth } from '../useSupabaseAuth';

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
    title: string;
    slug: string;
    description?: string;
  };
}

// 특정 여정의 사용자 목록 조회 훅
export function useJourneyUsersRefactored(journeyId: string | null) {
  return useSupabaseQuery<UserJourney[]>(
    journeyId ? createCacheKey('journey-users', { journeyId }) : null,
    async (supabase) => {
      if (!journeyId) return [];

      const { data, error } = await supabase
        .from('user_journeys')
        .select(`
          *,
          profiles (
            id,
            first_name,
            last_name,
            profile_image,
            email
          )
        `)
        .eq('journey_id', journeyId)
        .order('joined_at', { ascending: false });

      if (error) throw error;
      return (data || []) as UserJourney[];
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
    async (supabase) => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('user_journeys')
        .select(`
          *,
          journeys (
            id,
            title,
            slug,
            description
          )
        `)
        .eq('user_id', userId)
        .order('joined_at', { ascending: false });

      if (error) throw error;
      return (data || []) as UserJourney[];
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
    async (supabase) => {
      if (!journeyId || !userId) return null;

      const { data, error } = await supabase
        .from('user_journeys')
        .select(`
          *,
          profiles (
            id,
            first_name,
            last_name,
            profile_image,
            email
          ),
          journeys (
            id,
            title,
            slug,
            description
          )
        `)
        .eq('journey_id', journeyId)
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      return data as UserJourney | null;
    }
  );
}

// 여정 사용자 CRUD 작업 훅
export function useJourneyUserActionsRefactored() {

  // 사용자를 여정에 추가
  const addUserToJourney = createMutation<
    UserJourney,
    { userId: string; journeyId: string; role?: 'participant' | 'teacher' | 'admin' }
  >(
    async (supabase, { userId, journeyId, role = 'participant' }) => {
      const { data, error } = await supabase
        .from('user_journeys')
        .insert({
          user_id: userId,
          journey_id: journeyId,
          role_in_journey: role,
          joined_at: new Date().toISOString(),
        })
        .select(`
          *,
          profiles (
            id,
            first_name,
            last_name,
            profile_image,
            email
          )
        `)
        .single();

      if (error) throw error;
      return data as UserJourney;
    },
    {
      revalidateKeys: ['journey-users', 'current-user-journeys', 'user-journey-status'],
    }
  );

  // 여정에서 사용자 제거
  const removeUserFromJourney = createMutation<
    boolean,
    { userId: string; journeyId: string }
  >(
    async (supabase, { userId, journeyId }) => {
      const { error } = await supabase
        .from('user_journeys')
        .delete()
        .eq('user_id', userId)
        .eq('journey_id', journeyId);

      if (error) throw error;
      return true;
    },
    {
      revalidateKeys: ['journey-users', 'current-user-journeys', 'user-journey-status'],
    }
  );

  // 사용자의 여정 내 역할 변경
  const updateUserRole = createMutation<
    UserJourney,
    { userId: string; journeyId: string; newRole: 'participant' | 'teacher' | 'admin' }
  >(
    async (supabase, { userId, journeyId, newRole }) => {
      const { data, error } = await supabase
        .from('user_journeys')
        .update({ 
          role_in_journey: newRole,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('journey_id', journeyId)
        .select(`
          *,
          profiles (
            id,
            first_name,
            last_name,
            profile_image,
            email
          )
        `)
        .single();

      if (error) throw error;
      return data as UserJourney;
    },
    {
      revalidateKeys: ['journey-users', 'user-journey-status'],
    }
  );

  // 여러 사용자를 한 번에 여정에 추가
  const addMultipleUsersToJourney = createMutation<
    UserJourney[],
    { userIds: string[]; journeyId: string; role?: 'participant' | 'teacher' | 'admin' }
  >(
    async (supabase, { userIds, journeyId, role = 'participant' }) => {
      const insertData = userIds.map(userId => ({
        user_id: userId,
        journey_id: journeyId,
        role_in_journey: role,
        joined_at: new Date().toISOString(),
      }));

      const { data, error } = await supabase
        .from('user_journeys')
        .insert(insertData)
        .select(`
          *,
          profiles (
            id,
            first_name,
            last_name,
            profile_image,
            email
          )
        `);

      if (error) throw error;
      return (data || []) as UserJourney[];
    },
    {
      revalidateKeys: ['journey-users', 'current-user-journeys'],
    }
  );

  return {
    addUserToJourney,
    removeUserFromJourney,
    updateUserRole,
    addMultipleUsersToJourney,
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
  const inviteUserByEmail = createMutation<
    boolean,
    { email: string; role?: 'participant' | 'teacher' | 'admin' }
  >(
    async (supabase, { email, role = 'participant' }) => {
      if (!journeyId) throw new Error('Journey ID is required');

      // 이메일로 사용자 찾기
      const { data: user, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single();

      if (userError || !user) {
        throw new Error('사용자를 찾을 수 없습니다.');
      }

      // 이미 참여 중인지 확인
      const { data: existingMembership } = await supabase
        .from('user_journeys')
        .select('id')
        .eq('user_id', user.id)
        .eq('journey_id', journeyId)
        .maybeSingle();

      if (existingMembership) {
        throw new Error('이미 여정에 참여 중인 사용자입니다.');
      }

      // 사용자를 여정에 추가
      const { error: insertError } = await supabase
        .from('user_journeys')
        .insert({
          user_id: user.id,
          journey_id: journeyId,
          role_in_journey: role,
          joined_at: new Date().toISOString(),
        });

      if (insertError) throw insertError;
      return true;
    },
    {
      revalidateKeys: ['journey-users'],
    }
  );

  return {
    inviteUserByEmail,
  };
}