import { createClient } from "@/utils/supabase/client";
import { getMarketingOptIn } from "@/utils/data/user";

export const sendEmail = async (
  email: string,
  subject: string,
  body: string,
  userId: string
) => {
  // const marketingOptIn = await getMarketingOptIn(userId);
  // if (!marketingOptIn) {
  //   return { data: {message: "이메일 전송 거절"}, error: null };
  // }

  try {
    console.log("이메일 전송 요청:", { email, subject, body });

    const supabase = createClient();
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
