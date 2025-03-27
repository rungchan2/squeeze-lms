import { createClient } from "@/utils/supabase/client";

export const checkUser = async (): Promise<boolean> => {
  const supabase = createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    return false;
  }
  return true;
};