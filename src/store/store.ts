import { create } from "zustand";

type loginUser = {
    uid: string;
    firstName: string;
    lastName: string;
    email: string;
};

type loginUserStore = {
    loginUser: loginUser | null;
    setLoginUser: (loginUser: loginUser | null) => void;
    getLoginUser: () => loginUser | null;
    clearLoginUser: () => void;
};

export const useLoginUser = create<loginUserStore>((set, get) => ({
  loginUser: null,
  setLoginUser: (loginUser) => set({ loginUser }),
  getLoginUser: () => get().loginUser,
  clearLoginUser: () => set({ loginUser: null }),
}));