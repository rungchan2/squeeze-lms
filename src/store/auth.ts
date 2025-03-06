import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase } from "@/utils/supabase/client";
import { Role } from "@/types/users";
import { encrypt, decrypt } from "@/utils/encryption";
import defaultProfile from "@/assets/default-profile.png";

export type UserState = {
  uid: string | null;
  id: number;
  email: string | null;
  role: Role | null;
  isAuthenticated: boolean;
  loading: boolean;
  profileImage: string;
  fullName: string | null;
  error: string | null;
  fetchUser: () => Promise<void>;
  logout: () => Promise<void>;
};

// ✅ 암호화된 스토리지 구현
const encryptedStorage = {
  getItem: (name: string) => {
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
    try {
      localStorage.setItem(name, encrypt(JSON.stringify(value)));
    } catch (error) {
      console.error("스토리지 데이터 암호화 오류:", error);
    }
  },
  removeItem: (name: string) => {
    localStorage.removeItem(name);
  },
};

// ✅ Zustand Store 생성
export const useAuthStore = create<UserState>()(
  persist(
    (set) => ({
      id: 0,
      uid: null,
      email: null,
      role: null,
      isAuthenticated: false,
      loading: false,
      profileImage: defaultProfile.src,
      error: null,
      fullName: null,
      // ✅ 로그인 후 유저 데이터 가져오기
      fetchUser: async () => {
        set({ loading: true, error: null });

        const { data: supabaseGetUser } = await supabase.auth.getUser();
        if (supabaseGetUser && supabaseGetUser.user) {

          set({
            profileImage: supabaseGetUser.user.user_metadata.picture,
            fullName: supabaseGetUser.user.user_metadata.full_name,
          });
        }

        // Supabase 세션 가져오기
        const { data: authUser, error: userError } =
          await supabase.auth.getUser();
        if (userError) {
          set({ isAuthenticated: false, loading: false });
          return;
        }
        // ✅ `users` 테이블에서 `role` 가져오기
        const { data: userData, error: userDataError } = await supabase
          .from("users")
          .select("uid, email, role, id")
          .eq("uid", authUser?.user.id ?? "")
          .single();

        if (userDataError) {
          console.error("Error fetching user data:", userDataError.message);
          set({
            id: 0,
            isAuthenticated: false,
            loading: false,
            error: userDataError.message,
          });
          return;
        }

        // 유효한 role 값인지 확인하는 함수
        const isValidRole = (role: string | null): role is Role => {
          return role === "user" || role === "teacher" || role === "admin";
        };

        // 데이터 설정 시 검증 추가
        set({
          id: userData.id,
          uid: userData.uid,
          email: userData.email,
          role: isValidRole(userData.role) ? userData.role : "user", // 기본값으로 "user" 사용
          isAuthenticated: true,
          loading: false,
        });
      },

      // ✅ 로그아웃 처리
      logout: async () => {
        try {
          await supabase.auth.signOut();
          set({
            id: 0,
            uid: null,
            email: null,
            role: null,
            isAuthenticated: false,
            error: null,
            fullName: null,
            profileImage: defaultProfile.src,
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "로그아웃 중 오류가 발생했습니다";
          set({ error: errorMessage });
        }
      },
    }),
    {
      name: "auth-store", // LocalStorage에 저장
      storage: {
        getItem: encryptedStorage.getItem,
        setItem: encryptedStorage.setItem,
        removeItem: encryptedStorage.removeItem,
      },
      // 선택적: 저장할 상태 제한
      partialize: (state) => ({
        uid: state.uid,
        email: state.email,
        role: state.role,
        isAuthenticated: state.isAuthenticated,
        // loading과 error는 저장하지 않음
      }),
    }
  )
);

// 스토어 초기화 함수 생성 (useEffect 제거)
export const initializeAuthStore = () => {
  const { fetchUser, isAuthenticated } = useAuthStore.getState();

  if (isAuthenticated) {
    fetchUser().catch((error) => {
      console.error("사용자 정보 갱신 오류:", error);
      useAuthStore.getState().logout();
    });
  }
};
