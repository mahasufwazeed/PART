import { create } from 'zustand';
import { Profile, Task, AppLanguage } from '@part/shared';
import { authService, mockStore } from '@part/shared';

export type AppTab = 'home' | 'explore' | 'post' | 'activity' | 'profile';

interface AppState {
  currentTab: AppTab;
  language: AppLanguage;
  currentProfile: Profile | null;
  userLocation: {
    locality: string;
    latitude: number;
    longitude: number;
  };
  selectedTaskId: string | null;
  activeChatTaskId: string | null;
  activePaymentTaskId: string | null;
  activeReviewTaskId: string | null;
  activeDisputeTaskId: string | null;
  isPostSuccessModalOpen: boolean;
  theme: 'light' | 'dark';

  // Actions
  setTab: (tab: AppTab) => void;
  setLanguage: (lang: AppLanguage) => void;
  setCurrentProfile: (profile: Profile | null) => void;
  setUserLocation: (loc: { locality: string; latitude: number; longitude: number }) => void;
  openTaskDetails: (taskId: string) => void;
  closeTaskDetails: () => void;
  openChat: (taskId: string) => void;
  closeChat: () => void;
  openPayment: (taskId: string) => void;
  closePayment: () => void;
  openReview: (taskId: string) => void;
  closeReview: () => void;
  openDispute: (taskId: string) => void;
  closeDispute: () => void;
  toggleTheme: () => void;
  refreshProfile: () => void;
  logout: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  currentTab: 'home',
  language: 'en',
  currentProfile: null, // Starts null until user registers or logs in
  userLocation: {
    locality: 'Velachery, Chennai',
    latitude: 12.9815,
    longitude: 80.218,
  },
  selectedTaskId: null,
  activeChatTaskId: null,
  activePaymentTaskId: null,
  activeReviewTaskId: null,
  activeDisputeTaskId: null,
  isPostSuccessModalOpen: false,
  theme: 'light',

  setTab: (tab) => set({ currentTab: tab }),
  setLanguage: (lang) => set({ language: lang }),
  setCurrentProfile: (profile) => {
    if (profile) {
      set({
        currentProfile: profile,
        language: profile.preferred_language,
        userLocation: {
          locality: profile.general_location || 'Velachery, Chennai',
          latitude: 12.9815,
          longitude: 80.218,
        },
      });
    } else {
      set({ currentProfile: null });
    }
  },

  setUserLocation: (loc) => set({ userLocation: loc }),
  openTaskDetails: (taskId) => set({ selectedTaskId: taskId }),
  closeTaskDetails: () => set({ selectedTaskId: null }),
  openChat: (taskId) => set({ activeChatTaskId: taskId }),
  closeChat: () => set({ activeChatTaskId: null }),
  openPayment: (taskId) => set({ activePaymentTaskId: taskId }),
  closePayment: () => set({ activePaymentTaskId: null }),
  openReview: (taskId) => set({ activeReviewTaskId: taskId }),
  closeReview: () => set({ activeReviewTaskId: null }),
  openDispute: (taskId) => set({ activeDisputeTaskId: taskId }),
  closeDispute: () => set({ activeDisputeTaskId: null }),
  toggleTheme: () =>
    set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
  refreshProfile: () => {
    const cp = get().currentProfile;
    if (cp) {
      const p = mockStore.profiles.get(cp.id);
      if (p) set({ currentProfile: { ...p } });
    }
  },
  logout: () => {
    authService.logout();
    set({ currentProfile: null, currentTab: 'home' });
  },
}));
