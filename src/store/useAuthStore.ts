import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Profile } from '@/types/knowledge';

interface AuthState {
  user: Profile | null;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  authError: string | null;
  hasHydrated: boolean;
  
  setUser: (user: Profile | null) => void;
  setAuthLoading: (loading: boolean) => void;
  setAuthError: (error: string | null) => void;
  setHasHydrated: (hydrated: boolean) => void;
  login: (user: Profile) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isAuthLoading: false,
      authError: null,
      hasHydrated: false,

      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setAuthLoading: (loading) => set({ isAuthLoading: loading }),
      setAuthError: (error) => set({ authError: error }),
      setHasHydrated: (hydrated) => set({ hasHydrated: hydrated }),
      
      login: (user) => set({ 
        user, 
        isAuthenticated: true, 
        authError: null 
      }),
      
      logout: () => set({ 
        user: null, 
        isAuthenticated: false,
        authError: null 
      }),
    }),
    {
      name: 'nexus-auth',
      partialize: (state) => ({ 
        user: state.user, 
        isAuthenticated: state.isAuthenticated 
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
        // Validation check for bad legacy data (numeric Google IDs)
        if (state?.user?.id && /^\d+$/.test(state.user.id)) {
           console.warn('[store] Found invalid numeric user ID, clearing session.');
           state.logout();
        }
      },
    }
  )
);
