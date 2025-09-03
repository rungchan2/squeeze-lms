import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "사용자 ID가 필요합니다." },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 구독 정보 조회
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("receiver_id", userId)
      .eq("type", "push_subscription")
      .maybeSingle();

    if (error) {
      console.error("구독 정보 조회 오류:", error);
      return NextResponse.json(
        { error: "구독 정보 조회 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json({ 
        exists: false, 
        message: "구독 정보가 없습니다." 
      });
    }

    return NextResponse.json({
      exists: true,
      subscription: (data as any).notification_json ? JSON.parse((data as any).notification_json) : null,
      data: {
        id: (data as any).id,
        type: (data as any).type,
        receiver_id: (data as any).receiver_id,
        created_at: (data as any).created_at
      },
    });
    
  } catch (error) {
    console.error("구독 정보 확인 오류:", error);
    const errorMessage = error instanceof Error ? error.message : "서버 오류가 발생했습니다.";
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 