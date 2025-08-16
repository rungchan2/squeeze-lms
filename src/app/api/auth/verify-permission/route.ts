import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// 역할 계층 정의
const roleHierarchy: Record<string, number> = {
  user: 1,
  teacher: 2,
  admin: 3,
};

/**
 * 보안 권한 검증 전용 API - POST 요청으로만 작동
 * 클라이언트에서 조작할 수 없는 서버 사이드 권한 검증
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // 요청 본문에서 검증할 권한 정보 추출
    const { 
      requiredRole, 
      resourceId, 
      resourceType,
      action 
    } = await request.json();
    
    if (!requiredRole) {
      return NextResponse.json(
        { 
          hasPermission: false,
          error: "필수 파라미터가 누락되었습니다: requiredRole",
          code: "MISSING_PARAMETERS" 
        }, 
        { status: 400 }
      );
    }

    // 현재 사용자 세션 확인
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.user) {
      return NextResponse.json(
        { 
          hasPermission: false,
          error: "인증되지 않은 사용자입니다.",
          code: "UNAUTHORIZED" 
        }, 
        { status: 401 }
      );
    }

    // 서버에서 직접 데이터베이스 조회로 권한 확인
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role, organization_id, id")
      .eq("id", session.user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { 
          hasPermission: false,
          error: "사용자 프로필을 찾을 수 없습니다.",
          code: "PROFILE_NOT_FOUND" 
        }, 
        { status: 404 }
      );
    }

    // 기본 역할 기반 권한 검사
    const userRole = profile.role || "user";
    const userRoleLevel = roleHierarchy[userRole] || 0;
    const requiredRoleLevel = roleHierarchy[requiredRole] || 999;
    
    let hasPermission = userRoleLevel >= requiredRoleLevel;

    // 리소스 기반 세부 권한 검사
    if (hasPermission && resourceId && resourceType) {
      hasPermission = await checkResourcePermission(
        supabase,
        session.user.id,
        userRole,
        profile.organization_id || '',
        resourceType,
        resourceId,
        action
      );
    }

    return NextResponse.json({
      hasPermission,
      userRole,
      requiredRole,
      resourceId,
      resourceType,
      action,
      timestamp: Date.now(),
      // 디버깅 정보 (개발 환경에서만)
      ...(process.env.NODE_ENV === 'development' && {
        debug: {
          userRoleLevel,
          requiredRoleLevel,
          organizationId: profile.organization_id
        }
      })
    });

  } catch (error: any) {
    console.error("권한 검증 오류:", error);
    return NextResponse.json(
      { 
        hasPermission: false,
        error: "서버 오류가 발생했습니다.",
        code: "SERVER_ERROR"
      }, 
      { status: 500 }
    );
  }
}

/**
 * 리소스별 세부 권한 검사
 */
async function checkResourcePermission(
  supabase: any,
  userId: string,
  userRole: string,
  organizationId: string,
  resourceType: string,
  resourceId: string,
  action?: string
): Promise<boolean> {
  // 관리자는 자신의 조직 내 모든 리소스에 접근 가능
  if (userRole === 'admin') {
    // 조직 기반 권한 검사
    return await checkOrganizationAccess(supabase, resourceType, resourceId, organizationId);
  }
  
  try {
    switch (resourceType) {
      case 'journey':
        return await checkJourneyPermission(supabase, userId, organizationId, resourceId, action);
        
      case 'mission':
        return await checkMissionPermission(supabase, userId, organizationId, resourceId, action);
        
      case 'post':
        return await checkPostPermission(supabase, userId, organizationId, resourceId, action);
        
      case 'profile':
        // 본인 프로필이거나 같은 조직의 teacher/admin인 경우
        if (resourceId === userId) return true;
        if (userRole === 'teacher') {
          return await checkSameOrganization(supabase, resourceId, organizationId);
        }
        return false;
        
      default:
        return false;
    }
  } catch (error) {
    console.error(`리소스 권한 검증 오류 (${resourceType}/${resourceId}):`, error);
    return false;
  }
}

// 조직 기반 접근 권한 검사
async function checkOrganizationAccess(
  supabase: any, 
  resourceType: string, 
  resourceId: string, 
  organizationId: string
): Promise<boolean> {
  // 리소스가 같은 조직에 속하는지 확인
  const tables: Record<string, string> = {
    'journey': 'journeys',
    'mission': 'missions',
    'profile': 'profiles'
  };
  
  const tableName = tables[resourceType];
  if (!tableName) return false;
  
  const { data } = await supabase
    .from(tableName)
    .select('organization_id')
    .eq('id', resourceId)
    .single();
    
  return data?.organization_id === organizationId;
}

// 여정 권한 검사
async function checkJourneyPermission(
  supabase: any, 
  userId: string, 
  organizationId: string, 
  journeyId: string, 
  action?: string
): Promise<boolean> {
  // 여정 소유자 또는 참여자인지 확인
  const { data: userJourney } = await supabase
    .from('user_journeys')
    .select('role_in_journey, journey:journeys(organization_id)')
    .eq('user_id', userId)
    .eq('journey_id', journeyId)
    .single();
  
  if (!userJourney) return false;
  
  // 조직 확인
  if (userJourney.journey?.organization_id !== organizationId) return false;
  
  // 액션별 권한 검사
  if (action === 'edit' || action === 'delete') {
    return userJourney.role_in_journey === 'creator' || userJourney.role_in_journey === 'admin';
  }
  
  return true; // 일반 읽기 권한
}

// 미션 권한 검사
async function checkMissionPermission(
  supabase: any, 
  userId: string, 
  organizationId: string, 
  missionId: string, 
  action?: string
): Promise<boolean> {
  // 미션이 속한 여정에 대한 권한 확인
  const { data: mission } = await supabase
    .from('journey_mission_instances')
    .select(`
      journey_id,
      journey:journeys(organization_id),
      user_journey:user_journeys!inner(role_in_journey)
    `)
    .eq('id', missionId)
    .eq('user_journeys.user_id', userId)
    .single();
  
  if (!mission) return false;
  
  // 조직 확인
  if (mission.journey?.organization_id !== organizationId) return false;
  
  return true;
}

// 게시물 권한 검사  
async function checkPostPermission(
  supabase: any, 
  userId: string, 
  organizationId: string, 
  postId: string, 
  action?: string
): Promise<boolean> {
  const { data: post } = await supabase
    .from('posts')
    .select(`
      user_id,
      journey_mission_instance:journey_mission_instances(
        journey:journeys(organization_id)
      )
    `)
    .eq('id', postId)
    .single();
  
  if (!post) return false;
  
  // 조직 확인
  const postOrgId = post.journey_mission_instance?.journey?.organization_id;
  if (postOrgId !== organizationId) return false;
  
  // 본인 게시물이거나 읽기 권한
  if (action === 'edit' || action === 'delete') {
    return post.user_id === userId;
  }
  
  return true;
}

// 같은 조직인지 확인
async function checkSameOrganization(
  supabase: any, 
  targetUserId: string, 
  organizationId: string
): Promise<boolean> {
  const { data } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', targetUserId)
    .single();
    
  return data?.organization_id === organizationId;
}