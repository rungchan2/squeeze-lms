import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { jwtDecode } from 'jwt-decode';

// 사용자 메타데이터 인터페이스
interface UserMetadata {
  first_name?: string;
  last_name?: string;
  profile_image?: string;
}

// 앱 메타데이터 인터페이스
interface AppMetadata {
  role?: string;
  organization_id?: string;
}

// 디코딩된 토큰 인터페이스
interface DecodedToken {
  app_metadata: AppMetadata;
  user_metadata: UserMetadata;
  exp: number;
  sub: string;
  [key: string]: any;
}

// 인증 상태 인터페이스
interface AuthState {
  user: any;
  session: any;
  decodedToken: DecodedToken | null;
  isAdmin: boolean;
  organizationId: string | null;
  firstName: string | null;
  lastName: string | null;
  role: string | null;
  loading: boolean;
  profileImage: string | null;
}

// 역할 계층 정의
const roleHierarchy: Record<string, number> = {
  user: 1,
  teacher: 2,
  admin: 3,
};

export function useSupabaseAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    decodedToken: null,
    isAdmin: false,
    organizationId: null,
    firstName: null,
    lastName: null,
    role: null,
    loading: true,
    profileImage: null,
  });

  useEffect(() => {
    const supabase = createClient();
    
    // 현재 세션 가져오기
    const getCurrentSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error getting session:', error.message);
        setAuthState(prev => ({ ...prev, loading: false }));
        return;
      }
      
      if (session) {
        updateAuthState(session);
      } else {
        setAuthState(prev => ({ ...prev, loading: false }));
      }
    };

    getCurrentSession();

    // 인증 상태 변경 구독
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session) {
          updateAuthState(session);
        } else {
          setAuthState({
            user: null,
            session: null,
            decodedToken: null,
            isAdmin: false,
            organizationId: null,
            firstName: null,
            lastName: null,
            role: null,
            loading: false,
            profileImage: null,
          });
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // JWT 토큰에서 정보 추출하여 상태 업데이트
  const updateAuthState = (session: any) => {
    try {
      const decodedToken = jwtDecode<DecodedToken>(session.access_token);
      
      const appMetadata = decodedToken.app_metadata || {};
      const userMetadata = decodedToken.user_metadata || {};
      
      setAuthState({
        user: session.user,
        session,
        decodedToken,
        isAdmin: appMetadata.role === 'admin',
        organizationId: appMetadata.organization_id || null,
        firstName: userMetadata.first_name || null,
        lastName: userMetadata.last_name || null,
        role: appMetadata.role || null,
        loading: false,
        profileImage: userMetadata.profile_image || null,
      });
    } catch (error) {
      console.error('Error decoding JWT:', error);
      setAuthState({
        user: session.user,
        session,
        decodedToken: null,
        isAdmin: false,
        organizationId: null,
        firstName: null,
        lastName: null,
        role: null,
        loading: false,
        profileImage: null,
      });
    }
  };

  // 권한 검사 헬퍼 함수
  const hasPermission = (requiredRole: string) => {
    if (!authState.role) return false;
    
    const userRoleLevel = roleHierarchy[authState.role] || 0;
    const requiredRoleLevel = roleHierarchy[requiredRole] || 999;
    
    return userRoleLevel >= requiredRoleLevel;
  };

  return {
    ...authState,
    hasPermission,
    isAuthenticated: !!authState.user,
    id: authState.user?.id || null,
  };
} 