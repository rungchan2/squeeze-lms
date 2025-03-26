import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

export const sendEmail = async (
  email: string,
  subject: string,
  body: string
) => {
  try {
    console.log("이메일 전송 요청:", { email, subject });
    
    const { data, error } = await supabase.functions.invoke("resend", {
      body: { to: email, subject, html: body },
    });
    
    if (error) {
      console.error("이메일 전송 오류:", error);
      throw error;
    }
    
    console.log("이메일 전송 성공:", data);
    return { data, error: null };
  } catch (err) {
    console.error("이메일 전송 중 예외 발생:", err);
    return { data: null, error: err };
  }
};
