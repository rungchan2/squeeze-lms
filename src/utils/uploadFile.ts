import { supabase } from "@/utils/supabase/client";

export const uploadFile = async (file: File) => {
  const { data, error } = await supabase.storage
    .from("my-bucket")
    .upload(file.name, file);
  return { data, error };
};
