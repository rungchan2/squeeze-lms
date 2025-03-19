import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

export const sendMail = async (to: string, subject: string, html: string) => {
  const { data, error } = await supabase.functions.invoke("resend", {
    body: { to, subject, html },
  });
  return { data, error };
};
