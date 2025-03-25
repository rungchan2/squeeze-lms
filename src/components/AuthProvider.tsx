import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useMemo,
  useCallback,
} from "react";
import { useAuthStore } from "@/store/auth";
import { Role } from "@/types";
import { createClient } from "@/utils/supabase/client";
import { toaster } from "@/components/ui/toaster";
// Context에서 제공할 값의 타입
interface AuthContextType {
  id: number | null;
  uid: string | null;
  email: string | null;
  role: Role | null;
  isAuthenticated: boolean;
  loading: boolean;
  profileImage: string | null;
  fullName: string | null;
  error: string | null;
  organizationId: number | null;

  // 액션 메서드
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (requiredRole: Role) => boolean;
}

// Context 생성
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 권한 체크 헬퍼 함수
const checkPermission = (
  userRole: Role | null,
  requiredRole: Role
): boolean => {
  if (!userRole) return false;

  const roleHierarchy: Record<Role, number> = {
    user: 1,
    teacher: 2,
    admin: 3,
  };

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
};

// 하나의 Supabase 클라이언트 인스턴스 생성
let supabaseClient: ReturnType<typeof createClient> | null = null;
const getSupabaseClient = () => {
  if (!supabaseClient && typeof window !== "undefined") {
    supabaseClient = createClient();
  }
  return supabaseClient;
};

// Provider 컴포넌트
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // 초기 상태를 관리하기 위한 로컬 상태
  const [isInitialized, setIsInitialized] = useState(false);

  // Zustand 스토어에서 상태와 액션 가져오기
  const {
    id,
    uid,
    email,
    role,
    isAuthenticated,
    loading: storeLoading,
    profileImage,
    fullName,
    error,
    lastUpdated,
    organizationId,
    refreshUser: storeRefreshUser,
    fetchUser,
    logout: storeLogout,
  } = useAuthStore();

  // 권한 확인 메서드 메모이제이션
  const hasPermission = useCallback(
    (requiredRole: Role): boolean => {
      return checkPermission(role, requiredRole);
    },
    [role]
  );

  // refreshUser 메모이제이션
  const refreshUser = useCallback(async () => {
    await storeRefreshUser();
  }, [storeRefreshUser]);

  // logout 메모이제이션
  const logout = useCallback(async () => {
    await storeLogout();
  }, [storeLogout]);

  // 컴포넌트 마운트 시 초기화 - 디바운싱 적용
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    let isMounted = true;
    let initTimer: NodeJS.Timeout | null = null;

    const initializeAuth = async () => {
      if (!isMounted) return;
      
      // 로컬 스토리지에서 먼저 데이터 가져오기
      fetchUser();
      
      try {
        const supabase = getSupabaseClient();
        if (!supabase) return;
        
        // 세션 확인 및 필요시 갱신
        const { data: { user } } = await supabase.auth.getUser();
        const now = Date.now();
        const needsRefresh = !lastUpdated || now - lastUpdated > 30 * 60 * 1000; // 30분

        if (user) {
          // 로그인은 되어 있지만 id가 없거나 인증 상태가 아니거나 리프레시가 필요한 경우
          if (!id || !isAuthenticated || needsRefresh) {
            await refreshUser();
          }
        } else if (isAuthenticated) {
          // Supabase 세션은 없는데 인증 상태인 경우 로그아웃
          await logout();
        }
      } catch (error) {
        if (isMounted) {
          toaster.create({
            title: "인증 초기화 오류",
            type: "error",
          });
        }
      } finally {
        // 초기화 완료 표시 (오류가 발생해도 초기화는 완료된 것으로 간주)
        if (isMounted) {
          setIsInitialized(true);
        }
      }
    };

    // 초기화 지연 적용 (디바운싱)
    initTimer = setTimeout(initializeAuth, 10);

    // 인증 상태 변경 이벤트 리스너
    const supabase = getSupabaseClient();
    let subscription: { unsubscribe: () => void } | null = null;
    
    if (supabase) {
      const { data } = supabase.auth.onAuthStateChange(async (event) => {
        if (!isMounted) return;
        
        if (event === "SIGNED_IN") {
          try {
            await refreshUser();
          } catch (error) {
            if (isMounted) {
              toaster.create({
                title: "로그인 후 사용자 정보 갱신 오류",
                type: "error",
              });
            }
          } finally {
            if (isMounted) {
              setIsInitialized(true);
            }
          }
        } else if (event === "SIGNED_OUT") {
          try {
            await logout();
          } catch (error) {
            if (isMounted) {
              toaster.create({
                title: "로그아웃 처리 오류",
                type: "error",
              });
            }
          } finally {
            if (isMounted) {
              setIsInitialized(true);
            }
          }
        }
      });
      
      subscription = data.subscription;
    }

    return () => {
      isMounted = false;
      if (initTimer) clearTimeout(initTimer);
      if (subscription) subscription.unsubscribe();
    };
  }, [fetchUser, id, isAuthenticated, lastUpdated, logout, refreshUser]);

  // 로딩 상태 계산 - 초기화가 완료되면 로딩 상태 종료
  const contextLoading = !isInitialized || storeLoading;

  // context 값 메모이제이션
  const contextValue = useMemo(
    () => ({
      id,
      uid,
      email,
      role,
      isAuthenticated,
      loading: contextLoading,
      profileImage,
      fullName,
      error,
      organizationId,
      refreshUser,
      logout,
      hasPermission,
    }),
    [
      id,
      uid,
      email,
      role,
      isAuthenticated,
      contextLoading,
      profileImage,
      fullName,
      error,
      organizationId,
      refreshUser,
      logout,
      hasPermission,
    ]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// useAuth 훅 - 메모이제이션 적용
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth는 AuthProvider 내에서 사용되어야 합니다");
  }

  return context;
};

// 특정 역할이 필요한 페이지를 위한 훅
export const useRequireAuth = (requiredRole?: Role) => {
  const auth = useAuth();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (!auth.loading) {
      if (!auth.isAuthenticated) {
        // 로그인 페이지로 리디렉션 로직
        window.location.href = "/login";
        return;
      }

      if (requiredRole && !auth.hasPermission(requiredRole)) {
        // 권한 없음 페이지로 리디렉션 로직
        window.location.href = "/unauthorized";
        return;
      }

      setIsAuthorized(true);
    }
  }, [auth.loading, auth.isAuthenticated, requiredRole, auth.hasPermission]);

  return {
    ...auth,
    isAuthorized,
  };
};
