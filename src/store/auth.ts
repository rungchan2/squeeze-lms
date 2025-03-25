import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getUser, getUserProfile, logout } from "@/app/(auth)/actions";
import { encrypt, decrypt } from "@/utils/encryption";
import { redirect } from "next/navigation";
import { toaster } from "@/components/ui/toaster";
import Cookies from "js-cookie";

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
  // 액션
  fetchUser: () => void;
  refreshUser: () => Promise<void>;
  logout: () => Promise<{ success: boolean; error?: unknown }>;
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
            });
            return;
          }

          const { profile, error } = await getUserProfile();

          let currentPath = "";
          if (typeof window !== "undefined") {
            currentPath = window.location.pathname;
          }

          if ((error || !profile) && !currentPath.includes("/login/info")) {
            get().logout();
            toaster.create({
              title: "로그인 정보가 없거나 유효하지 않습니다",
              type: "error",
            });
            redirect("/error?message=로그인 정보가 없거나 유효하지 않습니다");
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
            });
          }
        } catch (error) {
          console.error("refreshUser 오류:", error);
          set({
            loading: false,
            error: error instanceof Error
              ? error.message
              : "사용자 정보 갱신 중 오류가 발생했습니다",
          });
        }
      },

      // 로그아웃 처리
      logout: async () => {
        try {
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
          });

          // 로컬 스토리지에서 auth-store 데이터 삭제
          if (typeof window !== "undefined") {
            localStorage.removeItem("auth-store");
            // 쿠키 삭제
            Object.keys(Cookies.get()).forEach(cookieName => {
              if (cookieName.startsWith('sb-') || cookieName === 'auth-token' || cookieName === 'auth_data') {
                Cookies.remove(cookieName);
              }
            });
          }

          // actions의 logout 함수 호출 제거 - 순환 참조 방지
          
          return { success: true };
        } catch (error) {
          console.error("logout 함수 오류:", error);
          set({
            loading: false,
            error:
              error instanceof Error
                ? error.message
                : "로그아웃 중 오류가 발생했습니다",
          });
          return { success: false, error };
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
