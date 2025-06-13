import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { journeyUuid, weekId } = body;
    
    if (!journeyUuid) {
      console.error("[API] mission-instances 파라미터 누락:", body);
      return NextResponse.json(
        { error: "journeyUuid가 필요합니다" },
        { status: 400 }
      );
    }
    
    const supabase = await createClient();
    
    // 쿼리 생성
    let query = supabase
      .from("journey_mission_instances")
      .select(`*, missions(*)`)
      .eq("journey_id", journeyUuid)
      .lte("release_date", new Date().toISOString());
    
    // 주차 ID가 있으면 필터링
    if (weekId) {
      query = query.eq("journey_week_id", weekId);
    }
    
    // 쿼리 실행
    const { data, error } = await query;
    
    if (error) {
      console.error("[API] mission-instances 오류:", error);
      return NextResponse.json({ 
        error: error.message,
        details: error.details 
      }, { 
        status: 500,
        headers: {
          'Cache-Control': 'no-store, max-age=0'
        }
      });
    }
    
    // 데이터 변환 (missions → mission)
    const transformedData = data?.map(item => ({
      ...item,
      mission: item.missions
    })) || [];
    
    // 캐시 방지 헤더와 함께 응답
    return NextResponse.json({ 
      data: transformedData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("[API] mission-instances 예외:", error);
    return NextResponse.json(
      { 
        error: "요청 처리 중 오류가 발생했습니다",
        details: error instanceof Error ? error.message : String(error)
      },
      { 
        status: 500,
      }
    );
  }
} 