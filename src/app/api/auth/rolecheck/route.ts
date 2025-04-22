import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { jwtDecode } from "jwt-decode";
import { DecodedToken } from "@/hooks/useSupabaseAuth";

// 역할 계층 정의 (useSupabaseAuth 훅과 동일하게 유지)
const roleHierarchy: Record<string, number> = {
  user: 1,
  teacher: 2,
  admin: 3,
};

/**
 * 역할 기반 권한 검증 API
 * 
 * 쿼리 파라미터:
 * - requiredRole: 필요한 역할 (user, teacher, admin)
 * - resourceId: 선택적, 특정 리소스 ID (예: journeyId, missionId 등)
 * - resourceType: 선택적, 리소스 유형 (예: journey, mission 등)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // 현재 세션 및 사용자 정보 가져오기
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    // 세션이 없거나 오류가 있는 경우
    if (sessionError || !session) {
      return NextResponse.json(
        { 
          error: "인증되지 않은, 사용자입니다.",
          code: "UNAUTHORIZED" 
        }, 
        { status: 401 }
      );
    }
    
    // URL 쿼리 파라미터에서 필요한 역할 추출
    const searchParams = request.nextUrl.searchParams;
    const requiredRole = searchParams.get("requiredRole");
    const resourceId = searchParams.get("resourceId");
    const resourceType = searchParams.get("resourceType");
    
    // 필수 파라미터 검사
    if (!requiredRole) {
      return NextResponse.json(
        { 
          error: "필수 파라미터가 누락되었습니다: requiredRole", 
          code: "MISSING_PARAMETERS" 
        }, 
        { status: 400 }
      );
    }
    const decodedToken = jwtDecode<DecodedToken>(session.access_token);
    
    // 사용자 역할 가져오기 (JWT에서)
    const { role } = decodedToken.app_metadata || {};

    if (!role) {
      return NextResponse.json(
        { 
          error: "사용자 역할 정보가 없습니다.", 
          code: "ROLE_NOT_FOUND" 
        }, 
        { status: 403 }
      );
    }
    
    // 기본 역할 기반 권한 검사
    const userRoleLevel = roleHierarchy[role] || 0;
    const requiredRoleLevel = roleHierarchy[requiredRole] || 999;
    const hasPermission = userRoleLevel >= requiredRoleLevel;
    
    if (!hasPermission) {
      return NextResponse.json(
        { 
          error: "접근 권한이 없습니다.", 
          code: "FORBIDDEN" 
        }, 
        { status: 403 }
      );
    }
    
    // 특정 리소스에 대한 추가 권한 검사 (리소스 ID와 타입이 제공된 경우)
    if (resourceId && resourceType) {
      // 리소스 유형에 따른 권한 검사 로직
      const hasResourcePermission = await checkResourcePermission(
        supabase,
        session.user.id,
        role,
        resourceType,
        resourceId
      );
      
      if (!hasResourcePermission) {
        return NextResponse.json(
          { 
            error: "해당 리소스에 접근할 권한이 없습니다.", 
            code: "RESOURCE_FORBIDDEN" 
          }, 
          { status: 403 }
        );
      }
    }
    
    // 모든 검사 통과 - 성공 응답 반환
    return NextResponse.json({
      authorized: true,
      role,
      user: {
        id: session.user.id,
        email: session.user.email,
        firstName: session.user.user_metadata?.first_name,
        lastName: session.user.user_metadata?.last_name,
      }
    });
    
  } catch (error: any) {
    console.error("권한 검증 오류:", error.message);
    return NextResponse.json(
      { 
        error: "서버 오류가 발생했습니다.", 
        code: "SERVER_ERROR",
        details: error.message
      }, 
      { status: 500 }
    );
  }
}

/**
 * 특정 리소스에 대한 추가 권한 검사
 */
async function checkResourcePermission(
  supabase: any,
  userId: string,
  userRole: string,
  resourceType: string,
  resourceId: string
): Promise<boolean> {
  // 관리자는 항상 모든 리소스에 접근 가능
  if (userRole === 'admin') {
    return true;
  }
  
  try {
    switch (resourceType) {
      case 'journey':
        // 여정에 대한 접근 권한 확인
        const { data: journeyUser } = await supabase
          .from('user_journeys')
          .select('role_in_journey')
          .eq('user_id', userId)
          .eq('journey_id', resourceId)
          .single();
          
        return !!journeyUser; // 사용자가 여정에 등록되어 있는지 확인
        
      case 'mission':
        // 미션에 대한 접근 권한 확인 (미션이 속한 여정에 사용자가 참여하는지)
        const { data: missionJourney } = await supabase
          .from('journey_missions')
          .select('journey_id')
          .eq('id', resourceId)
          .single();
          
        if (!missionJourney) return false;
        
        const { data: userJourney } = await supabase
          .from('user_journeys')
          .select('id')
          .eq('user_id', userId)
          .eq('journey_id', missionJourney.journey_id)
          .single();
          
        return !!userJourney;
        
      case 'team':
        // 팀에 대한 접근 권한 확인
        const { data: teamUser } = await supabase
          .from('team_users')
          .select('id')
          .eq('user_id', userId)
          .eq('team_id', resourceId)
          .single();
          
        return !!teamUser;
        
      // 필요한 다른 리소스 유형에 대한 케이스 추가 가능
        
      default:
        return false; // 알 수 없는 리소스 유형
    }
  } catch (error) {
    console.error(`리소스 권한 검증 오류 (${resourceType}/${resourceId}):`, error);
    return false;
  }
}
