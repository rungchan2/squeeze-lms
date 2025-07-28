import { createClient } from "@/utils/supabase/server";
import { NextRequest } from "next/server";
import { apiGuards, createApiSuccessResponse, createApiErrorResponse, API_ERROR_CODES } from "@/utils/api";

export const GET = apiGuards.adminOnly(async (request: NextRequest, { user }) => {
  try {
    const supabase = await createClient();
    
    // role_access_code 테이블의 모든 데이터 가져오기
    const { data, error } = await supabase.from("role_access_code").select("*");
    
    if (error) {
      console.error("Error fetching role access codes:", error);
      return createApiErrorResponse(
        API_ERROR_CODES.SERVER_ERROR,
        error.message,
        500
      );
    }
    
    // 테이블 데이터 반환
    return createApiSuccessResponse({ data });
    
  } catch (e) {
    console.error("Error in role-access-code API route:", e);
    const errorMessage = e instanceof Error ? e.message : "Internal server error";
    
    return createApiErrorResponse(
      API_ERROR_CODES.SERVER_ERROR,
      errorMessage,
      500
    );
  }
}); 