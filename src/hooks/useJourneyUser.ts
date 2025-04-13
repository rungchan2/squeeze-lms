import useSWR from "swr";
import { createClient } from "@/utils/supabase/client";
import { useSupabaseAuth } from "./useSupabaseAuth";

// 데이터 타입 정의
type UserJourneyWithProfiles = {
  id: string;
  user_id: string | null;
  journey_id: string | null;
  role_in_journey: string | null;
  created_at: string | null;
  updated_at: string | null;
  joined_at: string | null;
  profiles: Record<string, any> | null;
  journeys?: Record<string, any> | null;
};

// 특정 여정의 사용자 목록을 가져오는 함수
const getJourneyUser = async (url: string): Promise<UserJourneyWithProfiles[]> => {
  const journey_id = url.split("/").pop();
  const supabase = createClient();

  // 요청 경로에 따라 다른 쿼리 실행
  if (journey_id === undefined) {
    // 이 경우는 처리되지 않음 - getCurrentUserJourneys 함수에서 처리됨
    return [];
  }
  
  const { data, error } = await supabase
    .from("user_journeys")
    .select("*, profiles(*)")
    .eq("journey_id", journey_id);

  if (error) {
    throw new Error(error.message);
  }
  return (data || []) as UserJourneyWithProfiles[];
};

// 현재 로그인한 사용자가 참여한 모든 여정 정보를 가져오는 함수
const getCurrentUserJourneys = async (userId: string): Promise<UserJourneyWithProfiles[]> => {
  if (!userId) return [];
  
  const supabase = createClient();
  const { data, error } = await supabase
    .from("user_journeys")
    .select("*, journeys(*)")
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }
  
  // 반환 데이터 구조를 일관되게 맞추기 - profiles 필드 추가
  return (data || []).map(item => ({
    ...item,
    profiles: null // profiles 필드 추가 (빈 값으로)
  })) as UserJourneyWithProfiles[];
};

export const useJourneyUser = (journey_id: string) => {
  const { id: userId } = useSupabaseAuth();
  
  // journey_id가 0이면 현재 로그인한 사용자의 모든 여정 참여 정보 가져오기
  const isUserJourneysMode = journey_id === "0";
  
  // 적절한 SWR 키와 fetcher 설정
  const key = isUserJourneysMode 
    ? userId ? `user-journeys/${userId}` : null 
    : `/api/journey-users/${journey_id}`;
  
  // SWR 타입 일관성을 위해 래퍼 함수 사용 
  const fetchData = async (url: string) => {
    if (isUserJourneysMode && userId) {
      return getCurrentUserJourneys(userId);
    } else {
      return getJourneyUser(url);
    }
  };
  
  const { data, error, isLoading, mutate: revalidate } = useSWR<UserJourneyWithProfiles[]>(
    key,
    fetchData,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1분 동안 중복 요청 방지
    }
  );
  
  let currentJourneyUsers = !isUserJourneysMode 
    ? data?.map((user) => user.profiles)
    : [];

  // 특정 여정 사용자 정보인 경우에만 계산
  const isUserJoined = !isUserJourneysMode
    ? data?.some((user) => user.user_id === userId)
    : false;
    
  const journeyTeacher = !isUserJourneysMode
    ? data?.filter((user) => user.role_in_journey === "teacher")
    : [];
    
  const journeyAdmin = !isUserJourneysMode
    ? data?.filter((user) => user.role_in_journey === "admin")
    : [];

  let adminNum = 0;
  let participantNum = 0;
  let teacherNum = 0;

  if (data && !isUserJourneysMode) {
    data.forEach((journey) => {
      if (journey.role_in_journey === "admin") adminNum++;
      else if (journey.role_in_journey === "teacher") teacherNum++;
      else participantNum++;
    });
  }

  // 사용자 추가 함수
  const addUser = async (userId: string, role: string) => {
    if (isUserJourneysMode) return null; // 모드가 맞지 않으면 동작하지 않음
    
    const supabase = createClient();
    const { data: newData, error } = await supabase
      .from("user_journeys")
      .insert({ user_id: userId, journey_id, role_in_journey: role })
      .select();

    if (error) throw new Error(error.message);
    
    // 데이터 갱신
    await revalidate();
    return newData;
  };

  // 사용자 삭제 함수
  const removeUser = async (userId: number) => {
    if (isUserJourneysMode) return false; // 모드가 맞지 않으면 동작하지 않음
    
    const supabase = createClient();
    const { error } = await supabase
      .from("user_journeys")
      .delete()
      .match({ user_id: userId, journey_id });

    if (error) throw new Error(error.message);
    
    // 데이터 갱신
    await revalidate();
    return true;
  };

  // 사용자 역할 수정 함수
  const updateUserRole = async (userId: number, newRole: string) => {
    if (isUserJourneysMode) return null; // 모드가 맞지 않으면 동작하지 않음
    
    const supabase = createClient();
    const { data: updatedData, error } = await supabase
      .from("user_journeys")
      .update({ role_in_journey: newRole })
      .match({ user_id: userId, journey_id })
      .select();

    if (error) throw new Error(error.message);
    
    // 데이터 갱신
    await revalidate();
    return updatedData;
  };

  return { 
    data, 
    error, 
    isLoading,
    isUserJoined,
    journeyTeacher,
    journeyAdmin,
    adminNum, 
    participantNum, 
    teacherNum,
    currentJourneyUsers,
    addUser,
    removeUser,
    updateUserRole,
    revalidate
  };
};
