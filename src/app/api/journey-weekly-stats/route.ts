import { NextRequest, NextResponse } from "next/server";
import { getJourneyWeeklyStats } from "@/app/journey/[slug]/actions";

export async function POST(req: NextRequest) {
  try {
    let journeyId;
    try {
      const body = await req.json();
      journeyId = body.journeyId;
    } catch (parseError) {
      return NextResponse.json(
        { error: "요청 본문이 올바른 JSON 형식이 아닙니다" },
        { status: 400 }
      );
    }

    if (!journeyId) {
      return NextResponse.json(
        { error: "Journey ID가 필요합니다" },
        { status: 400 }
      );
    }

    const { data, error } = await getJourneyWeeklyStats(journeyId);

    if (error) {
      console.error("주차별 통계 API 오류:", error);

      let errorMessage = "통계 가져오기 오류";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === "object" && error !== null) {
        errorMessage = JSON.stringify(error);
      }

      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }

    return NextResponse.json({
      data,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("주차별 통계 가져오기 오류:", error);

    let errorMessage = "통계 가져오기 오류";
    let errorDetails = null;

    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === "object" && error !== null) {
      errorMessage = error.message || "알 수 없는 오류";
      errorDetails =
        error.details || error.code
          ? {
              code: error.code,
              details: error.details,
            }
          : null;
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: errorDetails,
      },
      {
        status: 500,
      }
    );
  }
}
