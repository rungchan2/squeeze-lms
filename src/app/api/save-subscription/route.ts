import { createClient } from "@/utils/supabase/server";
import { NextRequest } from "next/server";
import { apiGuards, createApiSuccessResponse, createApiErrorResponse, API_ERROR_CODES } from "@/utils/api";

export const POST = apiGuards.postOnly(async (request: NextRequest, { user }) => {
  try {
    let body;
    
    try {
      body = await request.json();
    } catch (parseError) {
      return createApiErrorResponse(
        API_ERROR_CODES.INVALID_REQUEST,
        "Invalid JSON body",
        400
      );
    }

    const { subscription, userId } = body;

    if (!subscription || !userId) {
      return createApiErrorResponse(
        API_ERROR_CODES.MISSING_PARAMETERS,
        "구독 정보 또는 사용자 ID가 없습니다.",
        400
      );
    }

    // Security check: users can only save their own subscriptions unless admin
    if (userId !== user.id && user.role !== 'admin') {
      return createApiErrorResponse(
        API_ERROR_CODES.FORBIDDEN,
        "본인의 구독 정보만 저장할 수 있습니다.",
        403
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
      return createApiErrorResponse(
        API_ERROR_CODES.SERVER_ERROR,
        "구독 정보 조회 중 오류가 발생했습니다.",
        500
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
        .eq("id", (existingData as any).id);

      if (updateError) {
        console.error("구독 정보 업데이트 오류:", updateError);
        return createApiErrorResponse(
          API_ERROR_CODES.SERVER_ERROR,
          "구독 정보 업데이트 중 오류가 발생했습니다.",
          500
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
        return createApiErrorResponse(
          API_ERROR_CODES.SERVER_ERROR,
          "구독 정보 저장 중 오류가 발생했습니다.",
          500
        );
      }
      
      result = { message: "구독 정보가 저장되었습니다.", created: true };
    }

    return createApiSuccessResponse(result);
    
  } catch (error) {
    console.error("구독 처리 오류:", error);
    const errorMessage = error instanceof Error ? error.message : "서버 오류가 발생했습니다.";
    
    return createApiErrorResponse(
      API_ERROR_CODES.SERVER_ERROR,
      errorMessage,
      500
    );
  }
}); 