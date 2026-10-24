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
   * Register a new user account with Supabase Authentication
   */
  async register(
    email: string,
    password: string,
    fullName: string,
    phone?: string | null,
    preferredLanguage: AppLanguage = 'en'
  ): Promise<{
    user: any;
    profile: Profile | null;
    needsEmailVerification: boolean;
    error?: string;
  }> {
    const cleanEmail = email.toLowerCase().trim();

    if (isLiveSupabaseConfigured) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: {
              full_name: fullName.trim(),
              phone: phone ? phone.trim() : null,
              preferred_language: preferredLanguage,
              city: 'Chennai',
              default_role: 'poster',
            },
          },
        });

        if (error) {
          return {
            user: null,
            profile: null,
            needsEmailVerification: false,
            error: error.message,
          };
        }

        if (data?.user) {
          // If session is null, email confirmation is required by Supabase settings
          const needsVerification = !data.session;

          let profile = await this.getProfile(data.user.id);
          if (!profile && data.user.id) {
            // Profile may still be creating via trigger, or create directly
            profile = {
              id: data.user.id,
              full_name: fullName.trim(),
              email: cleanEmail,
              phone: phone || null,
              avatar_url: null,
              bio: null,
              default_role: 'poster',
              preferred_language: preferredLanguage,
              city: 'Chennai',
              general_location: 'Velachery, Chennai',
              is_admin: false,
              verification_status: 'unverified',
              is_worker_available: true,
              rating_as_worker: 5.0,
              total_reviews_as_worker: 0,
              completed_tasks_as_worker: 0,
              rating_as_requester: 5.0,
              total_reviews_as_requester: 0,
              completed_tasks_as_requester: 0,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };

            await supabase
              .from('profiles')
              .upsert(profile)
              .select()
              .maybeSingle();
          }

          if (profile) {
            mockStore.profiles.set(profile.id, profile);
            mockStore.currentUserId = profile.id;
          }

          return {
            user: data.user,
            profile: profile || null,
            needsEmailVerification: needsVerification,
          };
        }
      } catch (err: any) {
        console.warn('Supabase auth.signUp exception, falling back to local store:', err);
      }
    }

    // Check if email already registered in local store
    for (const [_, existing] of mockStore.profiles.entries()) {
      if ((existing as any).email === cleanEmail) {
        return {
          user: null,
          profile: null,
          needsEmailVerification: false,
          error: 'An account with this email already exists. Please log in.',
        };
      }
    }

    const newId = `usr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newProfile: Profile = {
      id: newId,
      full_name: fullName.trim(),
      email: cleanEmail,
      phone: phone || null,
      avatar_url: null,
      bio: null,
      default_role: 'poster',
      preferred_language: preferredLanguage,
      city: 'Chennai',
      general_location: 'Velachery, Chennai',
      is_admin: cleanEmail.includes('admin'),
      verification_status: 'unverified',
      is_worker_available: true,
      rating_as_worker: 5.0,
      total_reviews_as_worker: 0,
      completed_tasks_as_worker: 0,
      rating_as_requester: 5.0,
      total_reviews_as_requester: 0,
      completed_tasks_as_requester: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    (newProfile as any).password = password;
    mockStore.profiles.set(newId, newProfile);
    mockStore.currentUserId = newId;

    return {
      user: { id: newId, email: cleanEmail },
      profile: newProfile,
      needsEmailVerification: false,
    };
  },

  /**
   * Sign in with email and password
   */
  async login(
    email: string,
    password: string,
    rememberMe = true
  ): Promise<{ session: AuthSession | null; error?: string }> {
    const cleanEmail = email.toLowerCase().trim();

    if (isLiveSupabaseConfigured) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (error) {
          return { session: null, error: error.message };
        }

        if (data?.user) {
          let profile = await this.getProfile(data.user.id);
          if (!profile) {
            // Auto-create profile if missing
            profile = {
              id: data.user.id,
              full_name:
                data.user.user_metadata?.full_name ||
                cleanEmail.split('@')[0],
              email: cleanEmail,
              phone: data.user.user_metadata?.phone || null,
              avatar_url: data.user.user_metadata?.avatar_url || null,
              bio: null,
              default_role: 'poster',
              preferred_language: 'en',
              city: 'Chennai',
              general_location: 'Velachery, Chennai',
              is_admin: false,
              verification_status: 'unverified',
              is_worker_available: true,
              rating_as_worker: 5.0,
              total_reviews_as_worker: 0,
              completed_tasks_as_worker: 0,
              rating_as_requester: 5.0,
              total_reviews_as_requester: 0,
              completed_tasks_as_requester: 0,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };

            await supabase
              .from('profiles')
              .upsert(profile)
              .select()
              .maybeSingle();
          }

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
      } catch (err: any) {
        console.warn('Supabase signInWithPassword exception, fallback to local store:', err);
      }
    }

    // Local fallback matching
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
        error: 'No account found with this email. Please check your credentials or sign up.',
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
   * Google OAuth 2.0 Sign In
   */
  async signInWithGoogle(
    redirectTo?: string
  ): Promise<{ error?: string }> {
    const callbackUrl =
      redirectTo ||
      (typeof window !== 'undefined'
        ? `${window.location.origin}/auth/callback`
        : 'http://localhost:3000/auth/callback');

    if (isLiveSupabaseConfigured) {
      try {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: callbackUrl,
            queryParams: {
              access_type: 'offline',
              prompt: 'consent',
            },
          },
        });

        if (error) {
          return { error: error.message };
        }
        return {};
      } catch (err: any) {
        return { error: err.message || 'Failed to initiate Google OAuth.' };
      }
    }

    // Demo/offline local simulation
    const mockGoogleId = `google-usr-${Date.now()}`;
    const mockGoogleProfile: Profile = {
      id: mockGoogleId,
      full_name: 'Verified Google User',
      email: 'user@gmail.com',
      avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=160&q=80',
      bio: 'Neighborhood helper signed in via Google.',
      default_role: 'poster',
      preferred_language: 'en',
      city: 'Chennai',
      general_location: 'Velachery, Chennai',
      is_admin: false,
      verification_status: 'verified',
      is_worker_available: true,
      rating_as_worker: 5.0,
      total_reviews_as_worker: 0,
      completed_tasks_as_worker: 0,
      rating_as_requester: 5.0,
      total_reviews_as_requester: 0,
      completed_tasks_as_requester: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    mockStore.profiles.set(mockGoogleId, mockGoogleProfile);
    mockStore.currentUserId = mockGoogleId;
    return {};
  },

  /**
   * Request password reset email
   */
  async resetPassword(
    email: string,
    redirectTo?: string
  ): Promise<{ success: boolean; error?: string }> {
    const cleanEmail = email.toLowerCase().trim();
    const callbackUrl =
      redirectTo ||
      (typeof window !== 'undefined'
        ? `${window.location.origin}/update-password`
        : 'http://localhost:3000/update-password');

    if (isLiveSupabaseConfigured) {
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
          redirectTo: callbackUrl,
        });

        if (error) return { success: false, error: error.message };
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message || 'Could not send recovery email.' };
      }
    }

    return { success: true };
  },

  /**
   * Update password (recovery flow or authenticated user)
   */
  async updatePassword(
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> {
    if (isLiveSupabaseConfigured) {
      try {
        const { error } = await supabase.auth.updateUser({
          password: newPassword,
        });

        if (error) return { success: false, error: error.message };
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message || 'Password update failed.' };
      }
    }

    // Local fallback
    if (mockStore.currentUserId) {
      const p = mockStore.profiles.get(mockStore.currentUserId);
      if (p) {
        (p as any).password = newPassword;
      }
    }
    return { success: true };
  },

  /**
   * Upload profile avatar to Supabase Storage bucket 'avatars'
   */
  async uploadAvatar(
    userId: string,
    file: File | Blob,
    fileName = 'avatar.png'
  ): Promise<{ avatarUrl: string | null; error?: string }> {
    if (isLiveSupabaseConfigured) {
      try {
        const filePath = `${userId}/${Date.now()}_${fileName}`;
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, file, {
            upsert: true,
            contentType: file.type || 'image/png',
          });

        if (uploadError) {
          console.warn('Storage upload error:', uploadError.message);
          return { avatarUrl: null, error: uploadError.message };
        }

        const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
        const avatarUrl = data.publicUrl;

        // Update profile record with new avatar URL
        await this.updateProfile(userId, { avatar_url: avatarUrl });
        return { avatarUrl, error: undefined };
      } catch (err: any) {
        return { avatarUrl: null, error: err.message || 'Avatar upload failed.' };
      }
    }

    // Local simulation: Create object URL or fallback placeholder
    const simulatedUrl =
      typeof URL !== 'undefined'
        ? URL.createObjectURL(file)
        : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=160&q=80';

    await this.updateProfile(userId, { avatar_url: simulatedUrl });
    return { avatarUrl: simulatedUrl };
  },

  /**
   * Update user profile information
   */
  async updateProfile(
    userId: string,
    updates: Partial<Profile>
  ): Promise<{ profile: Profile | null; error?: string }> {
    // Prevent client-side self-elevation of is_admin
    const sanitizedUpdates = { ...updates };
    delete (sanitizedUpdates as any).is_admin;
    sanitizedUpdates.updated_at = new Date().toISOString();

    if (isLiveSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .update(sanitizedUpdates)
          .eq('id', userId)
          .select()
          .maybeSingle();

        if (!error && data) {
          mockStore.profiles.set(userId, data as Profile);
          return { profile: data as Profile };
        }
      } catch (err: any) {
        console.warn('updateProfile error:', err);
      }
    }

    const existing = mockStore.profiles.get(userId);
    if (existing) {
      const merged: Profile = {
        ...existing,
        ...sanitizedUpdates,
      };
      mockStore.profiles.set(userId, merged);
      return { profile: merged };
    }

    return { profile: null, error: 'User profile not found.' };
  },

  /**
   * Fetch user profile by ID
   */
  async getProfile(userId: string): Promise<Profile | null> {
    if (isLiveSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

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
          .maybeSingle();

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
   * Get currently active profile
   */
  getCurrentUser(): Profile | null {
    if (mockStore.currentUserId) {
      return mockStore.profiles.get(mockStore.currentUserId) || null;
    }
    return null;
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
};
