import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
  isLoggedIn: boolean;
  setLoggedIn: (val: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isLoggedIn: false,
      setLoggedIn: (val) => set({ isLoggedIn: val }),
    }),
    { name: "auth-storage" } // ✅ persists to localStorage across refreshes
  )
);
