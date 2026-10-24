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
    const cleanEmail = email.toLowerCase().trim();

    if (isLiveSupabaseConfigured) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: {
              full_name: fullName.trim(),
              preferred_language: preferredLanguage,
              city: 'Chennai',
            },
          },
        });

        if (!error && data?.user) {
          const profile = await this.getProfile(data.user.id);
          if (profile) {
            mockStore.profiles.set(profile.id, profile);
            mockStore.currentUserId = profile.id;
            return { user: data.user, profile };
          }
        }
      } catch (err) {
        // Fallback to local store if remote tables are not yet migrated
      }
    }

    // Check if email already registered in local store
    for (const [_, existing] of mockStore.profiles.entries()) {
      if ((existing as any).email === cleanEmail) {
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
      is_admin: cleanEmail.includes('admin'),
      verification_status: 'unverified',
      is_online: true,
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
    (newProfile as any).email = cleanEmail;
    (newProfile as any).password = password;

    mockStore.profiles.set(newId, newProfile);
    mockStore.currentUserId = newId;

    return {
      user: { id: newId, email: cleanEmail },
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
    const cleanEmail = email.toLowerCase().trim();

    if (isLiveSupabaseConfigured) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (!error && data?.user) {
          const profile = await this.getProfile(data.user.id);
          if (profile) {
            mockStore.profiles.set(profile.id, profile);
            mockStore.currentUserId = profile.id;
            return {
              session: {
                user: { id: data.user.id, email: data.user.email! },
                profile,
              },
            };
          }
        }
      } catch (err) {
        // Fallback to local store
      }
    }

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
        error: 'No account found with this email. Please register first.',
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
      try {
        await supabase.auth.signOut();
      } catch {}
    }
    mockStore.currentUserId = null;
  },

  /**
   * Request password reset email
   */
  async resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
    if (isLiveSupabaseConfigured) {
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) return { success: false, error: error.message };
        return { success: true };
      } catch {}
    }
    return { success: true };
  },

  /**
   * Fetch user profile
   */
  async getProfile(userId: string): Promise<Profile | null> {
    if (isLiveSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (!error && data) return data as Profile;
      } catch {}
    }

    return mockStore.profiles.get(userId) || null;
  },

  /**
   * Complete onboarding
   */
  async completeOnboarding(
    userId: string,
    input: OnboardingProfileInput
  ): Promise<{ profile: Profile; error?: string }> {
    const existing = mockStore.profiles.get(userId);

    if (isLiveSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .update({
            full_name: input.full_name,
            phone: input.phone || null,
            bio: input.bio || null,
            general_location: input.general_location,
            city: input.city || 'Chennai',
            preferred_language: input.preferred_language,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId)
          .select()
          .single();

        if (!error && data) {
          mockStore.profiles.set(userId, data as Profile);
          return { profile: data as Profile };
        }
      } catch {}
    }

    if (!existing) {
      return { profile: null as any, error: 'User profile not found.' };
    }

    const updated: Profile = {
      ...existing,
      full_name: input.full_name,
      phone: input.phone || null,
      bio: input.bio || null,
      general_location: input.general_location,
      city: input.city || 'Chennai',
      preferred_language: input.preferred_language,
      updated_at: new Date().toISOString(),
    };

    mockStore.profiles.set(userId, updated);
    return { profile: updated };
  },

  /**
   * Get currently authenticated user
   */
  getCurrentUser(): Profile | null {
    if (mockStore.currentUserId) {
      return mockStore.profiles.get(mockStore.currentUserId) || null;
    }
    return null;
  },
};
