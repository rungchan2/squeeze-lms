import { createClient } from "@/utils/supabase/client";

export const getUser = async () => {
  const supabase = createClient();
  const { data, error } = await supabase.auth.getUser();
  return { data, error };
};

export const uploadFile = async (file: File) => {
  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from("images")
    .upload(file.name, file);
  return { data, error };
};