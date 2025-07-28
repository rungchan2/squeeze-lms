import { NextRequest } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { apiGuards, createApiSuccessResponse, createApiErrorResponse, API_ERROR_CODES } from '@/utils/api';

export const GET = apiGuards.getOnly(async (request: NextRequest, { user }) => {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("journeys").select("*");
    
    if (error) {
      console.error("[API] journeys 오류:", error);
      return createApiErrorResponse(
        API_ERROR_CODES.SERVER_ERROR,
        error.message,
        500,
        { details: error.details }
      );
    }
    
    return createApiSuccessResponse(
      { 
        data,
        timestamp: new Date().toISOString() 
      },
      { 'Cache-Control': 'no-store, max-age=0' }
    );
    
  } catch (error) {
    console.error("[API] journeys 예외:", error);
    const errorMessage = error instanceof Error ? error.message : "요청 처리 중 오류가 발생했습니다";
    
    return createApiErrorResponse(
      API_ERROR_CODES.SERVER_ERROR,
      errorMessage,
      500,
      { details: error instanceof Error ? error.message : String(error) }
    );
  }
});

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
    
    const { uuid } = body;
    
    if (!uuid) {
      console.error("[API] journeys/by-uuid 파라미터 누락:", body);
      return createApiErrorResponse(
        API_ERROR_CODES.MISSING_PARAMETERS,
        "UUID가 필요합니다",
        400
      );
    }
    
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("journeys")
      .select("*")
      .eq("id", uuid)
      .single();
    
    if (error) {
      console.error("[API] journeys/by-uuid 오류:", error);
      return createApiErrorResponse(
        API_ERROR_CODES.SERVER_ERROR,
        error.message,
        500,
        { details: error.details }
      );
    }
    
    return createApiSuccessResponse(
      { 
        data,
        timestamp: new Date().toISOString()
      },
      { 'Cache-Control': 'no-store, max-age=0' }
    );
    
  } catch (error) {
    console.error("[API] journeys/by-uuid 예외:", error);
    const errorMessage = error instanceof Error ? error.message : "요청 처리 중 오류가 발생했습니다";
    
    return createApiErrorResponse(
      API_ERROR_CODES.SERVER_ERROR,
      errorMessage,
      500,
      { details: error instanceof Error ? error.message : String(error) }
    );
  }
}); 