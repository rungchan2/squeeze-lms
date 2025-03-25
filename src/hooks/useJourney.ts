import useSWR from "swr";
import { createClient } from "@/utils/supabase/client";
import { Journey } from "@/types";
import { CreateJourney } from "@/types";


const fetchJourneys = async () => {
  const supabase = createClient();
  const { data, error } = await supabase.from("journeys").select("*");
  if (error) {
    throw new Error(error.message);
  }
  return data as Journey[];
};

export const fetchJourneyDetail = async (uuid: string) => {
  const trimmedUuid = uuid.trim();
  const supabase = createClient();
  const { data, error } = await supabase.from("journeys").select("*").eq("uuid", trimmedUuid).single();
  if (error) throw new Error(error.message);
  return { data, error };
};

export const useJourney = () => {
  const { data: journeys, error, isLoading, mutate: revalidate } = useSWR(
    "/api/journeys",
    fetchJourneys
  );
  
  // 여정 추가 함수
  const addJourney = async (journeyData: CreateJourney) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("journeys")
      .insert(journeyData)
      .select();

    if (error) throw new Error(error.message);
    
    // 데이터 갱신
    await revalidate();
    return data as Journey[];
  };

  // 여정 삭제 함수
  const removeJourney = async (journeyId: number) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("journeys")
      .delete()
      .eq("id", journeyId);

    if (error) throw new Error(error.message);
    
    // 데이터 갱신
    await revalidate();
    return true;
  };

  // 여정 수정 함수
  const updateJourney = async (journeyId: number, updateData: Partial<CreateJourney>) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("journeys")
      .update(updateData)
      .eq("id", journeyId)
      .select();

    if (error) throw new Error(error.message);
    
    // 데이터 갱신
    await revalidate();
    return data as Journey[];
  };

  return { 
    journeys: journeys || [], 
    error, 
    isLoading,
    addJourney,
    removeJourney,
    updateJourney,
    revalidate
  };
};
