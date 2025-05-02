import { useEffect, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";
import { jwtDecode } from "jwt-decode";
import { create } from "zustand";

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
export interface DecodedToken {
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

// 인증 액션 인터페이스
interface AuthActions {
  updateAuthState: (session: any) => void;
  clearAuthState: () => void;
  setLoading: (loading: boolean) => void;
  refreshAuthState: () => Promise<void>;
  hasPermission: (requiredRole: string) => boolean;
}

// 역할 계층 정의
const roleHierarchy: Record<string, number> = {
  user: 1,
  teacher: 2,
  admin: 3,
};

// Zustand 스토어 생성
const useAuthStore = create<AuthState & AuthActions>((set, get) => ({
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
  
  updateAuthState: (session) => {
    try {
      const decodedToken = jwtDecode<DecodedToken>(session.access_token);
      
      const appMetadata = decodedToken.app_metadata || {};
      const userMetadata = decodedToken.user_metadata || {};
      
      set({
        user: session.user,
        session,
        decodedToken,
        isAdmin: appMetadata.role === "admin",
        organizationId: appMetadata.organization_id || null,
        firstName: userMetadata.first_name || null,
        lastName: userMetadata.last_name || null,
        role: appMetadata.role || null,
        loading: false,
        profileImage: userMetadata.profile_image || null,
      });
    } catch (error) {
      console.error("Error decoding JWT:", error);
      set({
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
  },
  
  clearAuthState: () => {
    set({
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
  },
  
  setLoading: (loading) => {
    set({ loading });
  },
  
  refreshAuthState: async () => {
    const supabase = createClient();
    
    try {
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error("Error refreshing session:", error.message);
        return;
      }
      
      if (data.session) {
        // 현재 상태를 저장하여 불필요한 상태 변경 방지
        const currentState = get();
        
        // 상태가 이미 정리된 경우(로그아웃) 업데이트하지 않음
        if (!currentState.user) {
          return;
        }
        
        get().updateAuthState(data.session);
        
        // 프로필 정보 업데이트
        if (data.session.user?.id) {
          await fetchUserProfile(data.session.user.id);
        }
      } else {
        // 세션이 없는 경우 상태 정리
        get().clearAuthState();
      }
    } catch (e) {
      console.error("Session refresh error:", e);
    }
  },
  
  hasPermission: (requiredRole) => {
    const userRole = get().role;
    if (!userRole) return false;
    
    const userRoleLevel = roleHierarchy[userRole] || 0;
    const requiredRoleLevel = roleHierarchy[requiredRole] || 999;
    
    return userRoleLevel >= requiredRoleLevel;
  },
}));

// 최근 프로필 로드 시간 추적을 위한 변수
let lastProfileFetchTime = 0;
const THROTTLE_INTERVAL = 5000; // 5초

// 사용자 프로필 정보 가져오기
const fetchUserProfile = async (userId: string) => {
  // 중복 호출 방지 (5초 이내 중복 호출 방지)
  const now = Date.now();
  if (now - lastProfileFetchTime < THROTTLE_INTERVAL) {
    return;
  }
  
  lastProfileFetchTime = now;
  
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("first_name, last_name, profile_image") // role 제외
    .eq("id", userId)
    .maybeSingle();

    if (error) {
      console.error("Error fetching user profile:", error.message);
      return;
    }
    
  // 세션 업데이트 시 role 정보는 JWT에서만 사용하고 profiles 테이블 데이터로 덮어쓰지 않음
  if (data && useAuthStore.getState().session) {
    const updatedSession = {
      ...useAuthStore.getState().session,
      user: {
        ...useAuthStore.getState().session.user,
        user_metadata: {
          ...useAuthStore.getState().session.user.user_metadata,
          first_name: data.first_name,
          last_name: data.last_name,
          profile_image: data.profile_image,
          // role은 업데이트하지 않음
        },
      },
    };
    useAuthStore.getState().updateAuthState(updatedSession);
  }
};

// 이벤트 리스너 초기화 (앱 시작 시 한 번만 실행)
const initAuthListener = () => {
  const supabase = createClient();
  
  // 이벤트 핸들러 함수 정의
  const handleAuthStateChange = (event: string, session: any) => {
    // setTimeout을 사용하여 콜백 내부에서 Supabase 함수 호출 시 교착 상태를 방지
    setTimeout(async () => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        if (session) {
          useAuthStore.getState().updateAuthState(session);
          
          // 로그인 또는 토큰 갱신 시 최신 프로필 정보도 가져오기
          // 단, 프로필 이미지가 없는 경우에만 가져오기
          if (session.user?.id) {
            const currentState = useAuthStore.getState();
            if (!currentState.profileImage) {
              await fetchUserProfile(session.user.id);
            }
          }
        }
      } else if (event === 'SIGNED_OUT') {
        useAuthStore.getState().clearAuthState();
      } else if (event === 'USER_UPDATED') {
        // 사용자 정보가 업데이트되면 최신 프로필 정보 가져오기
        if (session?.user?.id) {
          await fetchUserProfile(session.user.id);
        }
      }
    }, 0);
  };
  
  // 초기 세션 확인
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (session) {
      useAuthStore.getState().updateAuthState(session);
      
      // 세션이 있으면 프로필 정보도 함께 가져오기
      // 단, 프로필 이미지가 없는 경우에만 가져오기
      if (session.user?.id) {
        const currentState = useAuthStore.getState();
        if (!currentState.profileImage) {
          fetchUserProfile(session.user.id);
        }
      }
    } else {
      useAuthStore.getState().setLoading(false);
    }
  });
  
  // 인증 상태 변경 구독
  const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);
  
  return () => {
    subscription.unsubscribe();
  };
};

// 앱 초기화 시 인증 리스너 설정 (공유 상태)
if (typeof window !== 'undefined') {
  initAuthListener();
}

// 훅 함수
export function useSupabaseAuth() {
  const authState = useAuthStore();
  
  // 메모이제이션된 결과 객체
  const memoizedResult = useMemo(() => ({
    ...authState,
    isAuthenticated: !!authState.user,
    id: authState.user?.id || null,
    refreshToken: authState.refreshAuthState,
  }), [
    authState.user, 
    authState.loading,
    authState.firstName,
    authState.lastName,
    authState.role,
    authState.isAdmin,
    authState.organizationId,
    authState.profileImage,
    authState.session,
  ]);
  
  // 컴포넌트에서 필요한 추가 기능 설정 - 초기화 시에만 실행하도록 의존성 배열 비움
  useEffect(() => {
    // 컴포넌트가 마운트될 때 이미 로드된 상태이고 프로필 이미지가 없는 경우만 갱신
    if (!authState.loading && authState.user?.id && !authState.profileImage) {
      fetchUserProfile(authState.user.id);
    }
  }, []); // 빈 의존성 배열로 최초 렌더링 시에만 실행
  
  return memoizedResult;
}
