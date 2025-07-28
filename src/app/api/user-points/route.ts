import { NextRequest } from "next/server";
import { getUserPointsByJourneyId } from "@/app/journey/[slug]/actions";
import { apiGuards, createApiSuccessResponse, createApiErrorResponse, API_ERROR_CODES } from "@/utils/api";

export const GET = apiGuards.authenticated(async (request: NextRequest, { user }) => {
  try {
    const { searchParams } = new URL(request.url);
    const journeyId = searchParams.get("journey_id");
    
    if (!journeyId) {
      return createApiErrorResponse(
        API_ERROR_CODES.MISSING_PARAMETERS,
        "Journey ID is required",
        400
      );
    }
    
    const { data, error } = await getUserPointsByJourneyId(journeyId);
    
    if (error) {
      console.error("GET user-points API 오류:", error);
      const errorMessage = typeof error === 'object' && error !== null 
        ? (error as any).message || JSON.stringify(error)
        : String(error);
      
      return createApiErrorResponse(
        API_ERROR_CODES.SERVER_ERROR,
        errorMessage,
        500
      );
    }
    
    return createApiSuccessResponse({ data }, {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Surrogate-Control': 'no-store'
    });
    
  } catch (err) {
    console.error("Error in user-points GET API:", err);
    const errorMessage = err instanceof Error ? err.message : "Internal server error";
    
    return createApiErrorResponse(
      API_ERROR_CODES.SERVER_ERROR,
      errorMessage,
      500
    );
  }
});

export const POST = apiGuards.authenticated(async (request: NextRequest, { user }) => {
  try {
    let body;
    let journeyId;
    
    try {
      body = await request.json();
      journeyId = body.journeyId;
    } catch (parseError) {
      console.error("POST user-points JSON 파싱 오류:", parseError);
      return createApiErrorResponse(
        API_ERROR_CODES.INVALID_REQUEST,
        "Invalid JSON body",
        400
      );
    }
    
    if (!journeyId) {
      return createApiErrorResponse(
        API_ERROR_CODES.MISSING_PARAMETERS,
        "Journey ID is required",
        400
      );
    }
    
    try {
      const { data, error } = await getUserPointsByJourneyId(journeyId);
      
      if (error) {
        console.error("POST user-points API 오류:", error);
        const errorMessage = typeof error === 'object' && error !== null 
          ? (error as any).message || JSON.stringify(error)
          : String(error);
        
        return createApiErrorResponse(
          API_ERROR_CODES.SERVER_ERROR,
          errorMessage,
          500
        );
      }
      
      return createApiSuccessResponse({ data }, {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store'
      });
      
    } catch (serviceError) {
      console.error("POST user-points 서비스 호출 오류:", serviceError);
      const errorMessage = serviceError instanceof Error ? serviceError.message : "Service error";
      
      return createApiErrorResponse(
        API_ERROR_CODES.SERVER_ERROR,
        errorMessage,
        500
      );
    }
  } catch (err) {
    console.error("Error in user-points POST API:", err);
    const errorMessage = err instanceof Error ? err.message : "Internal server error";
    
    return createApiErrorResponse(
      API_ERROR_CODES.SERVER_ERROR,
      errorMessage,
      500
    );
  }
}); 