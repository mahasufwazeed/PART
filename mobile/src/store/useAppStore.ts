import { create } from 'zustand';
import { Profile, Task, AppLanguage } from '@part/shared';
import { authService, mockStore } from '@part/shared';

export type AppTab = 'home' | 'explore' | 'post' | 'activity' | 'profile';

interface AppState {
  currentTab: AppTab;
  language: AppLanguage;
  currentProfile: Profile;
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
  switchPersona: (role: 'requester' | 'worker' | 'admin') => void;
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
}

export const useAppStore = create<AppState>((set, get) => ({
  currentTab: 'home',
  language: 'en',
  currentProfile: mockStore.profiles.get(mockStore.currentUserId)!,
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

  switchPersona: (role) => {
    const profile = authService.switchDemoUser(role);
    set({
      currentProfile: profile,
      language: profile.preferred_language,
      // Default location per persona for realistic local discovery
      userLocation:
        role === 'worker'
          ? { locality: 'Velachery, Chennai', latitude: 12.9815, longitude: 80.218 }
          : role === 'requester'
          ? { locality: 'Anna Nagar, Chennai', latitude: 13.085, longitude: 80.2101 }
          : { locality: 'T. Nagar, Chennai', latitude: 13.0418, longitude: 80.2341 },
    });
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
    const p = mockStore.profiles.get(get().currentProfile.id);
    if (p) set({ currentProfile: { ...p } });
  },
}));
