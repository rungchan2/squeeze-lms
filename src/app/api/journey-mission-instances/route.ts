import { NextRequest } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { apiGuards, createApiSuccessResponse, createApiErrorResponse, API_ERROR_CODES } from '@/utils/api';

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
    
    const { journeyUuid, weekId } = body;
    
    if (!journeyUuid) {
      console.error("[API] mission-instances 파라미터 누락:", body);
      return createApiErrorResponse(
        API_ERROR_CODES.MISSING_PARAMETERS,
        "journeyUuid가 필요합니다",
        400
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
      return createApiErrorResponse(
        API_ERROR_CODES.SERVER_ERROR,
        error.message,
        500,
        { details: error.details }
      );
    }
    
    // 데이터 변환 (missions → mission)
    const transformedData = data?.map(item => ({
      ...(item as any),
      mission: (item as any).missions
    })) || [];
    
    // 캐시 방지 헤더와 함께 응답
    return createApiSuccessResponse(
      { 
        data: transformedData,
        timestamp: new Date().toISOString()
      },
      { 'Cache-Control': 'no-store, max-age=0' }
    );
    
  } catch (error) {
    console.error("[API] mission-instances 예외:", error);
    const errorMessage = error instanceof Error ? error.message : "요청 처리 중 오류가 발생했습니다";
    
    return createApiErrorResponse(
      API_ERROR_CODES.SERVER_ERROR,
      errorMessage,
      500,
      { details: error instanceof Error ? error.message : String(error) }
    );
  }
}); 