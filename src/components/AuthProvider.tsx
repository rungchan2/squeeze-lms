import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
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

// Provider 컴포넌트
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // 초기 상태를 관리하기 위한 로컬 상태
  const [isInitialized, setIsInitialized] = useState(false);

  // Zustand 스토어에서 상태와 액션 가져오기
  const id = useAuthStore((state) => state.id);
  const uid = useAuthStore((state) => state.uid);
  const email = useAuthStore((state) => state.email);
  const role = useAuthStore((state) => state.role);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const loading = useAuthStore((state) => state.loading);
  const profileImage = useAuthStore((state) => state.profileImage);
  const fullName = useAuthStore((state) => state.fullName);
  const error = useAuthStore((state) => state.error);
  const lastUpdated = useAuthStore((state) => state.lastUpdated);

  const refreshUser = useAuthStore((state) => state.refreshUser);
  const fetchUser = useAuthStore((state) => state.fetchUser);
  const logout = useAuthStore((state) => state.logout);

  // 권한 확인 메서드
  const hasPermission = (requiredRole: Role): boolean => {
    return checkPermission(role, requiredRole);
  };

  // 컴포넌트 마운트 시 초기화
  useEffect(() => {
    if (typeof window === "undefined") return;

    const initializeAuth = async () => {
      toaster.create({
        title: "초기화 시작",
        type: "info",
      });
      // 로컬 스토리지에서 먼저 데이터 가져오기
      fetchUser();
      console.log("fetchUser 호출");
      try {
        const supabase = createClient();
        // 세션 확인 및 필요시 갱신
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const now = Date.now();
        const needsRefresh = !lastUpdated || now - lastUpdated > 30 * 60 * 1000; // 30분

        if (session && (!isAuthenticated || needsRefresh)) {
          await refreshUser();
        } else if (!session && isAuthenticated) {
          await logout();
        }
      } catch (error) {
        toaster.create({
          title: "인증 초기화 오류",
          type: "error",
        });
      } finally {
        // 초기화 완료 표시 (오류가 발생해도 초기화는 완료된 것으로 간주)
        setIsInitialized(true);
        toaster.create({
          title: "초기화 완료",
          type: "success",
        });
      }
    };

    initializeAuth();

    // 인증 상태 변경 이벤트 리스너
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event) => {
      toaster.create({
        title: `인증 상태 변경 ${event}`,
        type: "info",
      });
      if (event === "SIGNED_IN") {
        try {
          await refreshUser();
        } catch (error) {
          toaster.create({
            title: "로그인 후 사용자 정보 갱신 오류",
            type: "error",
          });
        } finally {
          setIsInitialized(true);
        }
      } else if (event === "SIGNED_OUT") {
        try {
          await logout();
        } catch (error) {
          toaster.create({
            title: "로그아웃 처리 오류",
            type: "error",
          });
        } finally {
          setIsInitialized(true);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // 로딩 상태 계산 - 초기화가 완료되면 로딩 상태 종료
  const contextLoading = !isInitialized;

  return (
    <AuthContext.Provider
      value={{
        id,
        uid,
        email,
        role,
        isAuthenticated,
        loading: contextLoading, // 수정된 로딩 상태
        profileImage,
        fullName,
        error,
        refreshUser,
        logout,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// useAuth 훅
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
  }, [auth.loading, auth.isAuthenticated, requiredRole]);

  return {
    ...auth,
    isAuthorized,
  };
};
