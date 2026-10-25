import { create } from 'zustand';
import {
  Profile,
  Task,
  AppLanguage,
  ActiveLocation,
  Coordinates,
  LocationSource,
  CHENNAI_LOCALITIES,
} from '@part/shared';
import { authService, mockStore } from '@part/shared';

export type AppTab = 'home' | 'explore' | 'campus' | 'post' | 'activity' | 'profile';

const STORAGE_ACTIVE_LOCATION_KEY = 'part_active_search_location';

function getPersistedActiveLocation(): ActiveLocation {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const stored = localStorage.getItem(STORAGE_ACTIVE_LOCATION_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (
          parsed &&
          parsed.coordinates &&
          typeof parsed.coordinates.latitude === 'number' &&
          typeof parsed.coordinates.longitude === 'number'
        ) {
          return parsed as ActiveLocation;
        }
      }
    } catch {}
  }
  return {
    coordinates: {
      latitude: 12.9815,
      longitude: 80.218,
    },
    label: 'Velachery, Chennai',
    source: 'search',
    updatedAt: Date.now(),
  };
}

interface AppState {
  currentTab: AppTab;
  language: AppLanguage;
  currentProfile: Profile | null;
  // Centralized active search location
  activeLocation: ActiveLocation;
  // Backward compatibility userLocation synced with activeLocation
  userLocation: {
    locality: string;
    latitude: number;
    longitude: number;
  };
  locationPermissionStatus: 'prompt' | 'granted' | 'denied';
  isLocatingGPS: boolean;
  gpsError: string | null;

  selectedTaskId: string | null;
  activeChatTaskId: string | null;
  activePaymentTaskId: string | null;
  activeReviewTaskId: string | null;
  activeDisputeTaskId: string | null;
  isPostSuccessModalOpen: boolean;
  theme: 'light' | 'dark';

  // Campus Community State
  selectedCollegeId: string;
  selectedCollegeName: string;
  isCollegeSelectorOpen: boolean;
  isPostCampusTaskOpen: boolean;

  // Notifications State
  isNotificationsOpen: boolean;
  unreadNotificationsCount: number;

  // Actions
  setTab: (tab: AppTab) => void;
  setLanguage: (lang: AppLanguage) => void;
  setCurrentProfile: (profile: Profile | null) => void;
  setActiveLocation: (loc: {
    coordinates: Coordinates;
    label: string;
    source: LocationSource;
    accuracyMeters?: number | null;
    isFallback?: boolean;
  }) => void;
  setUserLocation: (loc: {
    locality: string;
    latitude: number;
    longitude: number;
    source?: LocationSource;
  }) => void;
  setLocationPermissionStatus: (status: 'prompt' | 'granted' | 'denied') => void;
  setIsLocatingGPS: (isLocating: boolean) => void;
  setGpsError: (error: string | null) => void;
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
  openNotifications: () => void;
  closeNotifications: () => void;
  setUnreadNotificationsCount: (count: number) => void;
  toggleTheme: () => void;
  refreshProfile: () => void;
  logout: () => void;

  // Campus Community Actions
  openCollegeSelector: () => void;
  closeCollegeSelector: () => void;
  setSelectedCollege: (collegeId: string, collegeName: string) => void;
  openPostCampusTask: () => void;
  closePostCampusTask: () => void;
}

const initialActiveLocation = getPersistedActiveLocation();

export const useAppStore = create<AppState>((set, get) => ({
  currentTab: 'home',
  language: 'en',
  currentProfile: null, // Starts null until user registers or logs in
  activeLocation: initialActiveLocation,
  userLocation: {
    locality: initialActiveLocation.label,
    latitude: initialActiveLocation.coordinates.latitude,
    longitude: initialActiveLocation.coordinates.longitude,
  },
  locationPermissionStatus: 'prompt',
  isLocatingGPS: false,
  gpsError: null,
  selectedTaskId: null,
  activeChatTaskId: null,
  activePaymentTaskId: null,
  activeReviewTaskId: null,
  activeDisputeTaskId: null,
  isPostSuccessModalOpen: false,
  theme: 'light',

  // Campus Community State
  selectedCollegeId: 'vels-university',
  selectedCollegeName: 'VELS University',
  isCollegeSelectorOpen: false,
  isPostCampusTaskOpen: false,

  // Notifications State
  isNotificationsOpen: false,
  unreadNotificationsCount: 0,

  setTab: (tab) => set({ currentTab: tab }),
  setLanguage: (lang) => set({ language: lang }),
  setCurrentProfile: (profile) => {
    if (profile) {
      const currentActive = get().activeLocation;
      let targetActive = currentActive;

      // Only if current active location was from profile or not yet customized, check profile
      if (
        profile.general_location &&
        (currentActive.source === 'profile' || currentActive.label.includes('Velachery'))
      ) {
        const foundLoc = CHENNAI_LOCALITIES.find(
          (l) => profile.general_location?.toLowerCase().includes(l.name.toLowerCase())
        );
        if (foundLoc && currentActive.source === 'profile') {
          targetActive = {
            coordinates: {
              latitude: foundLoc.latitude,
              longitude: foundLoc.longitude,
            },
            label: `${profile.general_location}, Chennai`,
            source: 'profile',
            updatedAt: Date.now(),
          };
        }
      }

      set({
        currentProfile: profile,
        language: profile.preferred_language,
        activeLocation: targetActive,
        userLocation: {
          locality: targetActive.label,
          latitude: targetActive.coordinates.latitude,
          longitude: targetActive.coordinates.longitude,
        },
        selectedCollegeId: profile.college_id || get().selectedCollegeId || 'vels-university',
        selectedCollegeName: profile.college_name || get().selectedCollegeName || 'VELS University',
      });
    } else {
      set({ currentProfile: null });
    }
  },

  setActiveLocation: (loc) => {
    const updated: ActiveLocation = {
      coordinates: {
        latitude: loc.coordinates.latitude,
        longitude: loc.coordinates.longitude,
      },
      label: loc.label,
      source: loc.source,
      updatedAt: Date.now(),
      accuracyMeters: loc.accuracyMeters ?? null,
      isFallback: loc.isFallback ?? false,
    };

    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem(STORAGE_ACTIVE_LOCATION_KEY, JSON.stringify(updated));
      } catch {}
    }

    set({
      activeLocation: updated,
      userLocation: {
        locality: updated.label,
        latitude: updated.coordinates.latitude,
        longitude: updated.coordinates.longitude,
      },
      gpsError: loc.source === 'gps' ? null : get().gpsError,
    });
  },

  setUserLocation: (loc) => {
    get().setActiveLocation({
      coordinates: {
        latitude: loc.latitude,
        longitude: loc.longitude,
      },
      label: loc.locality,
      source: loc.source || 'search',
    });
  },

  setLocationPermissionStatus: (status) => set({ locationPermissionStatus: status }),
  setIsLocatingGPS: (isLocating) => set({ isLocatingGPS: isLocating }),
  setGpsError: (error) => set({ gpsError: error }),
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
  openNotifications: () => set({ isNotificationsOpen: true }),
  closeNotifications: () => set({ isNotificationsOpen: false }),
  setUnreadNotificationsCount: (count) => set({ unreadNotificationsCount: count }),
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

  // Campus Community Actions
  openCollegeSelector: () => set({ isCollegeSelectorOpen: true }),
  closeCollegeSelector: () => set({ isCollegeSelectorOpen: false }),
  setSelectedCollege: (collegeId, collegeName) =>
    set({ selectedCollegeId: collegeId, selectedCollegeName: collegeName }),
  openPostCampusTask: () => set({ isPostCampusTaskOpen: true }),
  closePostCampusTask: () => set({ isPostCampusTaskOpen: false }),
}));
