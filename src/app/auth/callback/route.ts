import { NextResponse } from "next/server";
// The client you created from the Server-Side Auth instructions
import { createClient } from "@/utils/supabase/server";
import { encrypt } from '@/utils/encryption';  // 암호화 유틸리티 필요

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const error = searchParams.get("error") || "";
  const error_description = searchParams.get("error_description") || "";
  const code = searchParams.get("code");
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get("next") ?? "/";

  // 디버깅을 위한 상세 로깅
  console.log('Callback Route 실행됨:', {
    code,
    next,
    origin,
    // headers: Object.fromEntries(request.headers),
  });

  if (error && error_description) {
    console.error("Auth error:", error, error_description);
    return NextResponse.redirect(
      `${origin}/auth/auth-code-error?error=${error}&error_description=${error_description}`
    );
  }

  if (code) {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      
      console.log('Exchange 결과:', { data, error });

      if (!error) {
        // const forwardedHost = request.headers.get("x-forwarded-host"); // original origin before load balancer
        // if (forwardedHost) {
        //   return NextResponse.redirect(`https://${forwardedHost}${next}`);
        // }
        const userData = await supabase.from("users").select("*").eq("uid", data.user.id).single();
        const neededuserData  = {
          uid: userData.data.uid,
          firstName: userData.data.firstName,
          lastName: userData.data.lastName,
          email: userData.data.email,
        };
        console.log('User Data:', userData);
        if (userData.data) {
          return NextResponse.redirect(`${origin}${next}`);
        } else {
          const response = NextResponse.redirect(`${origin}/login/info`);
          const encryptedData = encrypt(JSON.stringify(neededuserData));
          response.cookies.set('auth_data', encryptedData, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 5 // 5분
          });
          return response;
        }
      }
      
      console.error('Session 교환 에러:', error);
      return NextResponse.redirect(`${origin}/auth/auth-code-error?reason=session_exchange_failed`);
    } catch (err) {
      console.error('예외 발생:', err);
      return NextResponse.redirect(`${origin}/auth/auth-code-error?reason=exception`);
    }
  }

  console.error('인증 코드 없음');
  return NextResponse.redirect(`${origin}/auth/auth-code-error?reason=no_code`);
}
