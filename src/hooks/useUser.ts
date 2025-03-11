import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";

export const useUser = (id: number | null) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["profile-user-data", id],
    queryFn: async () => {
      if (id === null) return null;
      const supabase = createClient();
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: id !== null,
  });

  return { data, isLoading, error };
};