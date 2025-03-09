import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/utils/supabase/client";
import { Journey } from "@/types/journeys";

export const useJourney = (): {
  journeys: Journey[];
  error: any;
  isLoading: boolean;
} => {
  const fetchJourneys = async () => {
    const { data, error } = await supabase.from("journeys").select("*");
    if (error) {
      throw new Error(error.message);
    }
    return data;
  };

  const { data: journeys, error, isLoading } = useQuery({
    queryKey: ["journeys"],
    queryFn: fetchJourneys,
  });
  return { journeys: journeys as Journey[], error, isLoading };
};
