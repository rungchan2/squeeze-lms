import { createClient } from "@/utils/supabase/client";
import { UserJourneyWithJourney } from "@/types";

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

// 특정 여정의 사용자 목록 조회
export async function getJourneyUsers(journeyId: string): Promise<UserJourney[]> {
  const supabase = createClient();
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
}

// 현재 사용자가 참여한 모든 여정 조회
export async function getCurrentUserJourneys(userId: string): Promise<UserJourney[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('user_journeys')
    .select(`
      *,
      journeys (
        id,
        name
      )
    `)
    .eq('user_id', userId)
    .order('joined_at', { ascending: false });

  if (error) throw error;
  return (data || []) as UserJourney[];
}

// 특정 사용자의 여정 참여 상태 조회
export async function getUserJourneyStatus(journeyId: string, userId: string): Promise<UserJourney | null> {
  const supabase = createClient();
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
        name
      )
    `)
    .eq('journey_id', journeyId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data as UserJourney | null;
}

// 사용자를 여정에 추가
export async function addUserToJourney({
  userId,
  journeyId,
  role = 'participant'
}: {
  userId: string;
  journeyId: string;
  role?: 'participant' | 'teacher' | 'admin';
}): Promise<UserJourney> {
  const supabase = createClient();
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
}

// 여정에서 사용자 제거
export async function removeUserFromJourney(userId: string, journeyId: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from('user_journeys')
    .delete()
    .eq('user_id', userId)
    .eq('journey_id', journeyId);

  if (error) throw error;
  return true;
}

// 사용자의 여정 내 역할 변경
export async function updateUserRole({
  userId,
  journeyId,
  newRole
}: {
  userId: string;
  journeyId: string;
  newRole: 'participant' | 'teacher' | 'admin';
}): Promise<UserJourney> {
  const supabase = createClient();
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
}

// 여러 사용자를 한 번에 여정에 추가
export async function addMultipleUsersToJourney({
  userIds,
  journeyId,
  role = 'participant'
}: {
  userIds: string[];
  journeyId: string;
  role?: 'participant' | 'teacher' | 'admin';
}): Promise<UserJourney[]> {
  const supabase = createClient();
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
}

// 이메일로 사용자 초대
export async function inviteUserByEmail({
  email,
  journeyId,
  role = 'participant'
}: {
  email: string;
  journeyId: string;
  role?: 'participant' | 'teacher' | 'admin';
}): Promise<boolean> {
  const supabase = createClient();
  
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
}

// 기존 함수들 (하위 호환성을 위해 유지)
export async function getJourney(userId: string) {
  if (!userId) {
    return [];
  }
  return await getCurrentUserJourneys(userId);
}

export async function createJourney(userId: string, journey: UserJourneyWithJourney) {
  return await addUserToJourney({
    userId,
    journeyId: journey.journey_id,
    role: 'participant'
  });
}

export async function deleteUserFromJourney(journeyId: string, userId: string) {
  try {
    await removeUserFromJourney(userId, journeyId);
    return { data: null, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

