import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { subscription, userId } = await request.json();

    if (!subscription || !userId) {
      return NextResponse.json(
        { error: "구독 정보 또는 사용자 ID가 없습니다." },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 구독 정보를 JSON 문자열로 변환
    const subscriptionJson = JSON.stringify(subscription);

    // 이미 존재하는 구독 정보 확인
    const { data: existingData, error: selectError } = await supabase
      .from("notifications")
      .select("*")
      .eq("receiver_id", userId)
      .eq("type", "push_subscription")
      .maybeSingle();

    if (selectError) {
      console.error("구독 정보 조회 오류:", selectError);
      return NextResponse.json(
        { error: "구독 정보 조회 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    let result;
    
    if (existingData) {
      // 기존 구독 정보 업데이트
      const { error: updateError } = await supabase
        .from("notifications")
        .update({
          notification_json: subscriptionJson,
          message: "푸시 알림 구독 정보"
        })
        .eq("id", existingData.id);

      if (updateError) {
        console.error("구독 정보 업데이트 오류:", updateError);
        return NextResponse.json(
          { error: "구독 정보 업데이트 중 오류가 발생했습니다." },
          { status: 500 }
        );
      }
      
      result = { message: "구독 정보가 업데이트되었습니다.", updated: true };
    } else {
      // 새 구독 정보 저장
      const { error: insertError } = await supabase
        .from("notifications")
        .insert({
          receiver_id: userId,
          notification_json: subscriptionJson,
          type: "push_subscription",
          message: "푸시 알림 구독 정보"
        });

      if (insertError) {
        console.error("구독 정보 저장 오류:", insertError);
        return NextResponse.json(
          { error: "구독 정보 저장 중 오류가 발생했습니다." },
          { status: 500 }
        );
      }
      
      result = { message: "구독 정보가 저장되었습니다.", created: true };
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("구독 처리 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
} 