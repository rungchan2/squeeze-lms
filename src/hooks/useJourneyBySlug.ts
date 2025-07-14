import useSWR from "swr";
import { createClient } from "@/utils/supabase/client";
import { Journey } from "@/types";

const fetchJourneyBySlug = async (slug: string) => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("journeys")
    .select("*")
    .eq("id", slug)
    .single();
  
  if (error) {
    throw new Error(error.message);
  }
  
  return data as Journey;
};

export const useJourneyBySlug = (slug: string) => {
  const { data: journey, error, isLoading, mutate: revalidate } = useSWR(
    slug ? `/api/journeys/${slug}` : null,
    () => fetchJourneyBySlug(slug),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  return {
    journey,
    error,
    isLoading,
    revalidate,
  };
};