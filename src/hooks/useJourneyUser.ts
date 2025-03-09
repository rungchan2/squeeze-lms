import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/utils/supabase/client";

const getJourneyUser = async (journey_id: number) => {
  const { data, error } = await supabase
    .from("user_journeys")
    .select("*")
    .eq("journey_id", journey_id);

  if (error) {
    throw new Error(error.message);
  }
  return data;
};

export const useJourneyUser = (journey_id: number) => {
  let adminNum = 0;
  let participantNum = 0;
  let teacherNum = 0;
  const { data, isLoading } = useQuery({
    queryKey: ["journeyUser", journey_id],
    queryFn: () => getJourneyUser(journey_id),
  });

  if (data) {
    data.forEach((journey) => {
      if (journey.role_in_journey === "admin") adminNum++;
      else if (journey.role_in_journey === "teacher") teacherNum++;
      else participantNum++;
    });
  }

  return { data, isLoading, adminNum, participantNum, teacherNum };
};
