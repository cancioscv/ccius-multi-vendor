import { create } from "zustand";

interface AuthState {
  isLoggedIn: boolean;
  setLoggedIn: (val: boolean) => void;
}

// TODO: Remove this duplication from user-ui and seller-ui
export const useAuthStore = create<AuthState>((set) => ({
  isLoggedIn: true,
  setLoggedIn: (val) => set({ isLoggedIn: val }),
}));
