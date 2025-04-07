import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getUser, logout } from "@/app/(auth)/actions";
import { encrypt, decrypt } from "@/utils/encryption";
import { redirect } from "next/navigation";
import { toaster } from "@/components/ui/toaster";
import { user as userUtil } from "@/utils/data/user";

// 역할 타입 정의
export type Role = "user" | "teacher" | "admin";

// 사용자 상태 타입
export interface UserState {
  id: number | null;
  uid: string | null;
  email: string | null;
  role: Role | null;
  isAuthenticated: boolean;
  loading: boolean;
  profileImage: string | null;
  fullName: string | null;
  error: string | null;
  lastUpdated: number | null;
  organizationId: number | null;
  loginMethod: string | null;
  // 액션
  fetchUser: () => void;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
}

// 암호화된 스토리지 구현
const encryptedStorage = {
  getItem: (name: string) => {
    if (typeof window === "undefined") return null;
    const value = localStorage.getItem(name);
    if (!value) return null;
    try {
      return JSON.parse(decrypt(value));
    } catch (error) {
      console.error("스토리지 데이터 복호화 오류:", error);
      localStorage.removeItem(name);
      return null;
    }
  },
  setItem: (name: string, value: any) => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(name, encrypt(JSON.stringify(value)));
    } catch (error) {
      console.error("스토리지 데이터 암호화 오류:", error);
    }
  },
  removeItem: (name: string) => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(name);
  },
};

// Zustand 스토어 생성
export const useAuthStore = create<UserState>()(
  persist(
    (set, get) => ({
      id: null,
      uid: null,
      email: null,
      role: null,
      isAuthenticated: false,
      loading: false,
      profileImage: null,
      fullName: null,
      error: null,
      lastUpdated: null,
      organizationId: null, // 로컬 스토리지에서 사용자 데이터 가져오기
      loginMethod: null,
      fetchUser: () => {
        try {
          if (typeof window === "undefined") return;
          const storedData = encryptedStorage.getItem("auth-store");
          if (storedData) {
            set({ ...storedData, loading: false });
          }
        } catch (error) {
          console.error("fetchUser 오류:", error);
          set({ loading: false });
        }
      },

      // 데이터베이스에서 최신 사용자 데이터 가져오기
      refreshUser: async () => {
        set({ loading: true, error: null });

        try {
          const user = await getUser();

          // 현재 경로 가져오기
          let currentPath = "";
          if (typeof window !== "undefined") {
            currentPath = window.location.pathname;
          }

          // 로그인 관련 경로인지 확인
          const isLoginPath =
            currentPath.includes("/login") ||
            currentPath.includes("/signup") ||
            currentPath.includes("/forgot-password");

          if (!user) {
            set({
              id: null,
              uid: null,
              email: null,
              role: null,
              isAuthenticated: false,
              loading: false,
              profileImage: null,
              fullName: null,
              lastUpdated: null,
              organizationId: null,
              loginMethod: null,
            });
            return;
          }

          const { profile, error } = await userUtil.getUserProfile();

          // 로그인 관련 경로에서는 프로필 검증 및 리다이렉트 건너뛰기
          if (isLoginPath) {
            set({
              uid: user.id || null,
              email: user.email || null,
              isAuthenticated: true,
              loading: false,
              lastUpdated: Date.now(),
            });
            return;
          }

          // 로그인 관련 경로가 아닌데 프로필이 없거나 오류가 있는 경우
          if (error || !profile) {
            // 에러 처리 개선
            get().logout();
            toaster.create({
              title: "로그인 정보가 없거나 유효하지 않습니다",
              type: "error",
            });

            redirect("/login");
          } else if (profile) {
            set({
              id: profile.id,
              uid: profile.uid,
              email: profile.email,
              role: profile.role as Role,
              isAuthenticated: true,
              loading: false,
              profileImage: profile.profile_image,
              fullName: `${profile.first_name} ${profile.last_name}`,
              lastUpdated: Date.now(),
              organizationId: profile.organization_id,
              loginMethod: user.identities?.[0]?.provider || null,
            });
          } else {
            set({
              id: null,
              uid: user.id || null,
              email: user.email || null,
              role: null,
              isAuthenticated: true,
              loading: false,
              profileImage: null,
              fullName: null,
              lastUpdated: Date.now(),
              organizationId: null,
              loginMethod: null,
            });
          }
        } catch (error) {
          console.error("refreshUser 오류:", error);
          set({
            loading: false,
            error:
              error instanceof Error
                ? error.message
                : "사용자 정보 갱신 중 오류가 발생했습니다",
          });
        }
      },

      // 로그아웃 처리
      logout: async () => {
        try {
          console.log("logout 함수 호출됨");

          // 상태를 먼저 초기화하고 나서 supabase.auth.signOut() 호출
          set({
            id: null,
            uid: null,
            email: null,
            role: null,
            isAuthenticated: false,
            loading: false,
            profileImage: null,
            fullName: null,
            error: null,
            lastUpdated: null,
            organizationId: null,
            loginMethod: null,
          });
          console.log("상태 초기화 완료");

          // 로컬 스토리지에서 auth-store 데이터 삭제
          if (typeof window !== "undefined") {
            localStorage.removeItem("auth-store");
          }

          // 마지막으로 supabase.auth.signOut() 호출
          // 이 함수가 실패하더라도 이미 상태와 로컬 스토리지는 초기화됨
          try {
            await logout();
          } catch (error) {
            console.error("supabase.auth.signOut() 오류:", error);
          }
        } catch (error) {
          console.error("logout 함수 오류:", error);
          set({
            loading: false,
            error:
              error instanceof Error
                ? error.message
                : "로그아웃 중 오류가 발생했습니다",
          });
        }
      },
    }),
    {
      name: "auth-store",
      storage: {
        getItem: encryptedStorage.getItem,
        setItem: encryptedStorage.setItem,
        removeItem: encryptedStorage.removeItem,
      },
      partialize: (state) => ({
        id: state.id,
        uid: state.uid,
        email: state.email,
        role: state.role,
        isAuthenticated: state.isAuthenticated,
        profileImage: state.profileImage,
        fullName: state.fullName,
        lastUpdated: state.lastUpdated,
        organizationId: state.organizationId,
      }),
    }
  )
);
