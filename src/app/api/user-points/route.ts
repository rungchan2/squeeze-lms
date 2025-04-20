import { NextResponse } from "next/server";
import { getUserPointsByJourneyId } from "@/app/journey/[slug]/actions";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const journeyId = searchParams.get("journey_id");
    
    console.log("GET user-points API 호출:", { journeyId });
    
    if (!journeyId) {
      return NextResponse.json(
        { error: "Journey ID is required" },
        { status: 400 }
      );
    }
    
    const { data, error } = await getUserPointsByJourneyId(journeyId);
    
    if (error) {
      console.error("GET user-points API 오류:", error);
      const errorMessage = typeof error === 'object' && error !== null 
        ? (error as any).message || JSON.stringify(error)
        : String(error);
      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      );
    }
    
    console.log("GET user-points API 응답:", { count: data?.length || 0 });
    
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store'
      }
    });
  } catch (err) {
    console.error("Error in user-points API:", err);
    const errorMessage = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // 요청 본문에서 journeyId 가져오기
    let body;
    let journeyId;
    
    try {
      body = await request.json();
      journeyId = body.journeyId;
      console.log("POST user-points API 호출:", { journeyId });
    } catch (parseError) {
      console.error("POST user-points JSON 파싱 오류:", parseError);
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }
    
    if (!journeyId) {
      return NextResponse.json(
        { error: "Journey ID is required" },
        { status: 400 }
      );
    }
    
    try {
      const { data, error } = await getUserPointsByJourneyId(journeyId);
      
      if (error) {
        console.error("POST user-points API 오류:", error);
        const errorMessage = typeof error === 'object' && error !== null 
          ? (error as any).message || JSON.stringify(error)
          : String(error);
        return NextResponse.json(
          { error: errorMessage },
          { status: 500 }
        );
      }
      
      console.log("POST user-points API 응답:", { count: data?.length || 0 });
      
      return NextResponse.json(data, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'Surrogate-Control': 'no-store'
        }
      });
    } catch (serviceError) {
      console.error("POST user-points 서비스 호출 오류:", serviceError);
      const errorMessage = serviceError instanceof Error ? serviceError.message : "Service error";
      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      );
    }
  } catch (err) {
    console.error("Error in user-points POST API:", err);
    const errorMessage = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 