import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Sesión del panel: persiste en el navegador hasta que el usuario cierre sesión.
interface SessionState {
  userId: string | null;
  login: (userId: string) => void;
  logout: () => void;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      userId: null,
      login: (userId) => set({ userId }),
      logout: () => set({ userId: null }),
    }),
    { name: 'rust-lens-session' }
  )
);
