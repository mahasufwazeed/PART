import { supabase, isLiveSupabaseConfigured } from './client';
import { mockStore } from './mockStore';
import { Profile, AppLanguage } from '../types';
import { OnboardingProfileInput } from '../schemas';

export interface AuthSession {
  user: {
    id: string;
    email: string;
  };
  profile: Profile;
}

export const authService = {
  /**
   * Register a new user
   */
  async register(
    email: string,
    password: string,
    fullName: string,
    preferredLanguage: AppLanguage = 'en'
  ): Promise<{ user: any; profile: Profile; error?: string }> {
    if (isLiveSupabaseConfigured) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            preferred_language: preferredLanguage,
            city: 'Chennai',
          },
        },
      });

      if (error) return { user: null, profile: null as any, error: error.message };

      const profile = await this.getProfile(data.user!.id);
      return { user: data.user, profile: profile! };
    }

    // Fallback sandbox simulation for local execution
    const newId = `user-${Date.now()}`;
    const newProfile: Profile = {
      id: newId,
      full_name: fullName,
      phone: null,
      avatar_url: null,
      bio: null,
      preferred_language: preferredLanguage,
      city: 'Chennai',
      general_location: 'Chennai',
      is_admin: false,
      is_worker_available: true,
      verification_status: 'unverified',
      rating_as_worker: 5.0,
      total_reviews_as_worker: 0,
      completed_tasks_as_worker: 0,
      rating_as_requester: 5.0,
      total_reviews_as_requester: 0,
      completed_tasks_as_requester: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    mockStore.profiles.set(newId, newProfile);
    mockStore.currentUserId = newId;

    return {
      user: { id: newId, email },
      profile: newProfile,
    };
  },

  /**
   * Sign in with email and password
   */
  async login(
    email: string,
    password: string
  ): Promise<{ session: AuthSession | null; error?: string }> {
    if (isLiveSupabaseConfigured) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) return { session: null, error: error.message };

      const profile = await this.getProfile(data.user.id);
      if (!profile) return { session: null, error: 'User profile not found' };

      return {
        session: {
          user: { id: data.user.id, email: data.user.email! },
          profile,
        },
      };
    }

    // Local sandbox matching
    for (const [id, profile] of mockStore.profiles.entries()) {
      // Allow signing in as demo accounts or any email
      if (email.toLowerCase().includes('karthik') || email === 'requester@part.in') {
        mockStore.currentUserId = 'a1111111-1111-4111-8111-111111111111';
        return {
          session: {
            user: { id: mockStore.currentUserId, email: 'karthik@part.in' },
            profile: mockStore.profiles.get(mockStore.currentUserId)!,
          },
        };
      }
      if (email.toLowerCase().includes('ananya') || email === 'worker@part.in') {
        mockStore.currentUserId = 'b2222222-2222-4222-8222-222222222222';
        return {
          session: {
            user: { id: mockStore.currentUserId, email: 'ananya@part.in' },
            profile: mockStore.profiles.get(mockStore.currentUserId)!,
          },
        };
      }
      if (email.toLowerCase().includes('admin')) {
        mockStore.currentUserId = 'c3333333-3333-4333-8333-333333333333';
        return {
          session: {
            user: { id: mockStore.currentUserId, email: 'admin@part.in' },
            profile: mockStore.profiles.get(mockStore.currentUserId)!,
          },
        };
      }
    }

    // Default to Karthik for demo sandbox if unmatched
    mockStore.currentUserId = 'a1111111-1111-4111-8111-111111111111';
    return {
      session: {
        user: { id: mockStore.currentUserId, email },
        profile: mockStore.profiles.get(mockStore.currentUserId)!,
      },
    };
  },

  /**
   * Sign out current user
   */
  async logout(): Promise<void> {
    if (isLiveSupabaseConfigured) {
      await supabase.auth.signOut();
    }
  },

  /**
   * Request password reset email
   */
  async resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
    if (isLiveSupabaseConfigured) {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) return { success: false, error: error.message };
      return { success: true };
    }
    return { success: true };
  },

  /**
   * Fetch user profile
   */
  async getProfile(userId: string): Promise<Profile | null> {
    if (isLiveSupabaseConfigured) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !data) return null;
      return data as Profile;
    }

    return mockStore.profiles.get(userId) || null;
  },

  /**
   * Complete onboarding
   */
  async completeOnboarding(
    userId: string,
    data: OnboardingProfileInput
  ): Promise<{ profile: Profile; error?: string }> {
    if (isLiveSupabaseConfigured) {
      const { data: updated, error } = await supabase
        .from('profiles')
        .update({
          full_name: data.full_name,
          bio: data.bio,
          city: data.city,
          general_location: data.general_location,
          preferred_language: data.preferred_language,
          is_worker_available: data.is_worker_available,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) return { profile: null as any, error: error.message };
      return { profile: updated as Profile };
    }

    const existing = mockStore.profiles.get(userId);
    if (!existing) return { profile: null as any, error: 'User not found' };

    const updated: Profile = {
      ...existing,
      full_name: data.full_name,
      bio: data.bio || existing.bio,
      city: data.city,
      general_location: data.general_location,
      preferred_language: data.preferred_language,
      is_worker_available: data.is_worker_available,
      updated_at: new Date().toISOString(),
    };
    mockStore.profiles.set(userId, updated);
    return { profile: updated };
  },

  /**
   * Switch active demo persona (Karthik Requester, Ananya Worker, Arun Admin)
   */
  switchDemoUser(role: 'requester' | 'worker' | 'admin'): Profile {
    if (role === 'requester') {
      mockStore.currentUserId = 'a1111111-1111-4111-8111-111111111111';
    } else if (role === 'worker') {
      mockStore.currentUserId = 'b2222222-2222-4222-8222-222222222222';
    } else {
      mockStore.currentUserId = 'c3333333-3333-4333-8333-333333333333';
    }
    return mockStore.profiles.get(mockStore.currentUserId)!;
  },

  getCurrentUserId(): string {
    return mockStore.currentUserId;
  },
};
