import { NextResponse } from "next/server";

export function clearCookie(res: NextResponse, cookieName: string) {
  res.cookies.delete(cookieName);
}

export function setCookie(res: NextResponse, cookieName: string, cookieValue: string, maxAge: number) {
  res.cookies.set(cookieName, cookieValue, {
    httpOnly: true,
    secure: process.env.NEXT_PUBLIC_VERCEL_ENV === "production",
    sameSite: "lax",
    maxAge: maxAge,
  });
}