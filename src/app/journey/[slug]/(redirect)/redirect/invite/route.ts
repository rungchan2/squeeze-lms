import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const supabase_server = await createClient();

    // 현재 로그인한 사용자 정보 가져오기
    const {
      data: { session },
    } = await supabase_server.auth.getSession();

    if (!session) {
      // 로그인되지 않은 경우 로그인 페이지로 리다이렉트 (로그인 후 다시 이 페이지로 돌아오도록 쿼리 파라미터 추가)
      return NextResponse.redirect(
        new URL(
          `/login?redirectUrl=/journey/${slug}/redirect/invite`,
          request.url
        )
      );
    }
    const { data: profileId } = await supabase_server
      .from("profiles")
      .select("id")
      .eq("uid", session.user.id)
      .single();

    if (!profileId) {
      return NextResponse.redirect(
        new URL("/error?message=프로필을 찾을 수 없습니다", request.url)
      );
    }

    // Journey ID 가져오기
    const { data: journey, error: journeyError } = await supabase_server
      .from("journeys")
      .select("id")
      .eq("slug", slug)
      .single();

    if (journeyError || !journey) {
      // 여정을 찾을 수 없는 경우
      return NextResponse.redirect(
        new URL("/error?message=여정을 찾을 수 없습니다", request.url)
      );
    }

    // 이미 참여중인지 확인
    const { data: existingRecord } = await supabase_server
      .from("user_journeys")
      .select("id")
      .eq("user_id", profileId.id)
      .eq("journey_id", journey.id)
      .maybeSingle();

    if (existingRecord) {
      // 이미 참여중이면 여정 페이지로 리다이렉트
      return NextResponse.redirect(new URL(`/journey/${slug}`, request.url));
    }

    // 새 레코드 생성
    const { error: insertError } = await supabase_server
      .from("user_journeys")
      .insert({
        user_id: profileId.id,
        journey_id: journey.id,
        role_in_journey: "member", // 기본 역할 설정
        joined_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error("초대 처리 중 오류:", insertError);
      return NextResponse.redirect(
        new URL("/error?message=여정 참여 중 오류가 발생했습니다", request.url)
      );
    }

    // 성공적으로 처리된 경우 여정 페이지로 리다이렉트
    return NextResponse.redirect(new URL(`/journey/${slug}`, request.url));
  } catch (error) {
    console.error("초대 처리 중 예외 발생:", error);
    return NextResponse.redirect(
      new URL("/error?message=오류가 발생하였습니다", request.url)
    );
  }
}