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
   * Register a real user account
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

    // Check if email already registered in local store
    for (const [_, existing] of mockStore.profiles.entries()) {
      if ((existing as any).email === email.toLowerCase().trim()) {
        return { user: null, profile: null as any, error: 'Email already registered. Please log in.' };
      }
    }

    const newId = `usr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newProfile: Profile = {
      id: newId,
      full_name: fullName.trim(),
      phone: null,
      avatar_url: null,
      bio: null,
      preferred_language: preferredLanguage,
      city: 'Chennai',
      general_location: 'Chennai',
      is_admin: email.toLowerCase().includes('admin'),
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

    // Store profile with email for lookup
    (newProfile as any).email = email.toLowerCase().trim();
    (newProfile as any).password = password;

    mockStore.profiles.set(newId, newProfile);
    mockStore.currentUserId = newId;

    return {
      user: { id: newId, email },
      profile: newProfile,
    };
  },

  /**
   * Sign in with registered email and password
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

    const cleanEmail = email.toLowerCase().trim();
    let foundProfile: Profile | null = null;

    for (const [_, profile] of mockStore.profiles.entries()) {
      if ((profile as any).email === cleanEmail) {
        if ((profile as any).password === password) {
          foundProfile = profile;
          break;
        } else {
          return { session: null, error: 'Incorrect password. Please try again.' };
        }
      }
    }

    if (!foundProfile) {
      return {
        session: null,
        error: 'No account found with this email. Please register to create your account.',
      };
    }

    mockStore.currentUserId = foundProfile.id;
    return {
      session: {
        user: { id: foundProfile.id, email: cleanEmail },
        profile: foundProfile,
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
    mockStore.currentUserId = null;
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

  getCurrentUserId(): string | null {
    return mockStore.currentUserId;
  },
};
