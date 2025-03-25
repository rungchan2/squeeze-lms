import useSWR from "swr";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "@/components/AuthProvider";
const getJourneyUser = async (url: string) => {
  const journey_id = Number(url.split("/").pop());
  const supabase = createClient();
  const { data, error } = await supabase
    .from("user_journeys")
    .select("*, profiles(*)")
    .eq("journey_id", journey_id);

  if (error) {
    throw new Error(error.message);
  }
  return data || [];
};

export const useJourneyUser = (journey_id: number) => {
  const key = `/api/journey-users/${journey_id}`;
  const { data, error, isLoading, mutate: revalidate } = useSWR(
    key, 
    getJourneyUser
  );
  let currentJourneyUsers = data?.map((user) => user.profiles);

  const { id } = useAuth();
  const isUserJoined = data?.some((user) => user.user_id === id);
  const journeyTeacher = data?.filter((user) => user.role_in_journey === "teacher");
  const journeyAdmin = data?.filter((user) => user.role_in_journey === "admin");

  let adminNum = 0;
  let participantNum = 0;
  let teacherNum = 0;

  if (data) {
    data.forEach((journey) => {
      if (journey.role_in_journey === "admin") adminNum++;
      else if (journey.role_in_journey === "teacher") teacherNum++;
      else participantNum++;
    });
  }

  // 사용자 추가 함수
  const addUser = async (userId: number, role: string) => {
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
