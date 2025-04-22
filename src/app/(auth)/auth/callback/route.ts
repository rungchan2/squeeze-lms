import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { encrypt } from "@/utils/encryption"; // 암호화 유틸리티 필요

export type NeededUserMetadata = {
  uid: string;
  email: string;
  first_name: string;
  last_name: string;
  profile_image: string;
  isEmailSignup?: boolean;
};

export async function GET(request: Request) {
  const supabase_server = await createClient();
  const { searchParams, origin } = new URL(request.url);
  const error = searchParams.get("error") || "";
  const error_description = searchParams.get("error_description") || "";
  const code = searchParams.get("code");
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get("next") ?? "/";

  if (error && error_description) {
    console.error("Auth error:", error, error_description);
    return NextResponse.redirect(
      `${origin}/auth/auth-code-error?error=${error}&error_description=${error_description}`
    );
  }

  if (code) {
    try {
      const { data, error } = await supabase_server.auth.exchangeCodeForSession(code);

      if (!error) {
        const userData = await supabase_server
          .from("profiles")
          .select("*")
          .eq("email", data.user.email || "")
          .single();

        const neededuserData: NeededUserMetadata = {
          uid: data.user.id,
          email: data.user.email || "",
          first_name: data.user.user_metadata.full_name.split(" ")[0],
          last_name: data.user.user_metadata.full_name.split(" ")[1] || "",
          profile_image: data.user.user_metadata.picture || "",
        };

        if (userData.data === null) {
          const response = NextResponse.redirect(`${origin}/login/info`);
          const encryptedData = encrypt(JSON.stringify(neededuserData));

          response.cookies.set("auth_data", encryptedData, {
            httpOnly: false,
            secure: process.env.NEXT_PUBLIC_VERCEL_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 10, // 10분
          });

          return response;
        }
        return NextResponse.redirect(`${origin}${next}`);
      }

      console.error("Session 교환 에러:", error);
      return NextResponse.redirect(
        `${origin}/auth/auth-code-error?reason=session_exchange_failed`
      );
    } catch (err) {
      console.error("예외 발생:", err);
      return NextResponse.redirect(
        `${origin}/auth/auth-code-error?reason=exception`
      );
    }
  }

  console.error("인증 코드 없음");
  return NextResponse.redirect(`${origin}/auth/auth-code-error?reason=no_code`);
}
