import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    // 사이트맵 경로 재검증
    revalidatePath("/sitemap.xml");

    return NextResponse.json({ 
      message: "사이트맵이 성공적으로 재생성되었습니다.",
      revalidated: true,
      now: Date.now() 
    });
  } catch (error) {
    console.error("사이트맵 재생성 중 오류:", error);
    return NextResponse.json(
      { 
        message: "사이트맵 재생성 중 오류가 발생했습니다.",
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
} 