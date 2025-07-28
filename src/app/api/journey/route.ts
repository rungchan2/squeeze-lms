import { NextRequest } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { apiGuards, createApiSuccessResponse, createApiErrorResponse, API_ERROR_CODES } from '@/utils/api';

export const GET = apiGuards.getOnly(async (request: NextRequest, { user }) => {
  try {
    // UUID 파라미터 가져오기
    const searchParams = request.nextUrl.searchParams;
    const uuid = searchParams.get('uuid');
        
    if (!uuid) {
      return createApiErrorResponse(
        API_ERROR_CODES.MISSING_PARAMETERS,
        "UUID가 제공되지 않았습니다",
        400
      );
    }
    
    // Supabase에서 데이터 가져오기
    const supabase = await createClient();
    const response = await supabase
      .from('journeys')
      .select('*')
      .eq('uuid', uuid)
      .single();
    
    // 데이터 반환
    if (response.error) {
      console.error("[API] Journey 오류:", response.error);
      return createApiErrorResponse(
        API_ERROR_CODES.SERVER_ERROR,
        response.error.message,
        response.status || 500
      );
    }
    
    return createApiSuccessResponse({ data: response.data });
    
  } catch (error) {
    console.error("[API] Journey 오류:", error);
    const errorMessage = error instanceof Error ? error.message : "요청 처리 중 오류가 발생했습니다";
    
    return createApiErrorResponse(
      API_ERROR_CODES.SERVER_ERROR,
      errorMessage,
      500
    );
  }
}); 