import {
  supabase,
  isLiveSupabaseConfigured,
  getGoogleCallbackUrl,
  getAppCanonicalOrigin,
} from './client';
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

export interface GoogleSignInOptions {
  redirectTo?: string;
  usePopup?: boolean;
  email?: string;
  fullName?: string;
  skipBrowserRedirect?: boolean;
}

/**
 * Maps raw auth error codes or messages to clear, actionable user messages
 */
export const mapAuthErrorMessage = (rawMessage?: string): string => {
  if (!rawMessage) return 'An unexpected authentication error occurred.';
  const msg = rawMessage.toLowerCase();

  if (msg.includes('popup') && (msg.includes('block') || msg.includes('window.open'))) {
    return 'Sign-in popup was blocked by your browser. Please allow popups or use redirect login.';
  }
  if (
    msg.includes('cancel') ||
    msg.includes('access_denied') ||
    msg.includes('closed') ||
    msg.includes('popup-closed')
  ) {
    return 'Google sign-in was cancelled.';
  }
  if (msg.includes('redirect_uri_mismatch') || msg.includes('redirect uri')) {
    return 'OAuth redirect URL mismatch. Please verify Authorized Redirect URIs in Google Cloud Console and Supabase Dashboard.';
  }
  if (
    msg.includes('unauthorized') ||
    msg.includes('not allowed') ||
    msg.includes('unauthorized_client')
  ) {
    return 'Authentication request not authorized. Please verify your domain in Supabase Dashboard (Auth > URL Configuration).';
  }
  if (msg.includes('invalid_client') || msg.includes('client id')) {
    return 'Google OAuth Client ID is invalid or missing in Supabase provider settings.';
  }
  if (
    msg.includes('connection_refused') ||
    msg.includes('failed to fetch') ||
    msg.includes('network')
  ) {
    return 'Unable to connect to authentication server. Please check your network connection.';
  }
  return rawMessage;
};

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
      if (cleanEmail === 'demo@part.app' || cleanEmail.includes('demo')) {
        const demoProfile: Profile = {
          id: 'usr-demo-rahul',
          full_name: 'Rahul Sharma',
          email: cleanEmail,
          phone: '+91 98765 43210',
          avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=160&q=80',
          bio: 'Neighborhood organizer & task poster in Chennai.',
          default_role: 'poster',
          preferred_language: 'en',
          city: 'Chennai',
          general_location: 'Velachery, Chennai',
          is_admin: false,
          verification_status: 'verified',
          is_worker_available: true,
          rating_as_worker: 4.95,
          total_reviews_as_worker: 26,
          completed_tasks_as_worker: 32,
          rating_as_requester: 5.0,
          total_reviews_as_requester: 14,
          completed_tasks_as_requester: 18,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        (demoProfile as any).password = password;
        mockStore.profiles.set(demoProfile.id, demoProfile);
        foundProfile = demoProfile;
      } else {
        return {
          session: null,
          error: 'No account found with this email. Please check your credentials or use 1-Click Demo Login.',
        };
      }
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
   * Google OAuth 2.0 Sign In with Popup & Redirect support
   */
  async signInWithGoogle(
    optionsOrRedirect?: string | GoogleSignInOptions
  ): Promise<{
    error?: string;
    session?: AuthSession;
    cancelled?: boolean;
    popupBlocked?: boolean;
    redirectInitiated?: boolean;
    url?: string;
  }> {
    const options: GoogleSignInOptions =
      typeof optionsOrRedirect === 'string'
        ? { redirectTo: optionsOrRedirect }
        : optionsOrRedirect || {};

    const callbackUrl = getGoogleCallbackUrl(options.redirectTo);

    if (isLiveSupabaseConfigured) {
      try {
        const preferPopup = options.usePopup !== false && typeof window !== 'undefined';

        if (preferPopup) {
          const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
              redirectTo: callbackUrl,
              skipBrowserRedirect: true,
              queryParams: {
                access_type: 'offline',
                prompt: 'consent',
              },
            },
          });

          if (error) {
            return { error: mapAuthErrorMessage(error.message) };
          }

          if (data?.url) {
            const width = 500;
            const height = 650;
            const left = window.screenX + (window.outerWidth - width) / 2;
            const top = window.screenY + (window.outerHeight - height) / 2;
            const popup = window.open(
              data.url,
              'PART_GOOGLE_OAUTH_POPUP',
              `width=${width},height=${height},left=${left},top=${top},status=no,resizable=yes,scrollbars=yes`
            );

            if (!popup || popup.closed || typeof popup.closed === 'undefined') {
              console.warn('Google sign-in popup blocked by browser. Falling back to full-page redirect.');
              window.location.assign(data.url);
              return { popupBlocked: true, redirectInitiated: true, url: data.url };
            }

            return new Promise((resolve) => {
              let pollTimer: any = null;

              const cleanup = () => {
                if (pollTimer) clearInterval(pollTimer);
                window.removeEventListener('message', messageHandler);
              };

              const messageHandler = async (event: MessageEvent) => {
                if (event.origin !== window.location.origin) return;

                if (event.data?.type === 'PART_AUTH_SUCCESS') {
                  cleanup();
                  try {
                    const { data: sessionData } = await supabase.auth.getSession();
                    const user = sessionData?.session?.user || event.data.user;
                    let profile = event.data.profile;
                    if (!profile && user?.id) {
                      profile = await authService.getProfile(user.id);
                    }
                    if (!profile && user?.email) {
                      profile = await authService.getProfileByEmail(user.email);
                    }
                    resolve({
                      session: {
                        user: { id: user?.id || profile?.id, email: user?.email || profile?.email },
                        profile: profile!,
                      },
                    });
                  } catch (err: any) {
                    resolve({ error: mapAuthErrorMessage(err.message) });
                  }
                } else if (event.data?.type === 'PART_AUTH_ERROR') {
                  cleanup();
                  resolve({ error: mapAuthErrorMessage(event.data.error) });
                }
              };

              window.addEventListener('message', messageHandler);

              pollTimer = setInterval(() => {
                if (popup.closed) {
                  cleanup();
                  resolve({
                    error: 'Google sign-in was cancelled.',
                    cancelled: true,
                  });
                }
              }, 500);
            });
          }
        }

        // Full page redirect mode
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: callbackUrl,
            skipBrowserRedirect: false,
            queryParams: {
              access_type: 'offline',
              prompt: 'consent',
            },
          },
        });

        if (error) {
          return { error: mapAuthErrorMessage(error.message) };
        }
        return { redirectInitiated: true };
      } catch (err: any) {
        return { error: mapAuthErrorMessage(err.message || 'Failed to initiate Google OAuth.') };
      }
    }

    // Demo/offline local simulation: preserve existing account if email matches
    const targetEmail = (options.email || 'user@gmail.com').toLowerCase().trim();
    let foundProfile = await this.getProfileByEmail(targetEmail);

    if (!foundProfile) {
      const mockGoogleId = `google-usr-${Date.now()}`;
      foundProfile = {
        id: mockGoogleId,
        full_name: options.fullName || 'Verified Google User',
        email: targetEmail,
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
      mockStore.profiles.set(mockGoogleId, foundProfile);
    }

    mockStore.currentUserId = foundProfile.id;
    return {
      session: {
        user: { id: foundProfile.id, email: targetEmail },
        profile: foundProfile,
      },
    };
  },

  /**
   * Request password reset email
   */
  async resetPassword(
    email: string,
    redirectTo?: string
  ): Promise<{ success: boolean; error?: string }> {
    const cleanEmail = email.toLowerCase().trim();
    const callbackUrl = redirectTo || `${getAppCanonicalOrigin()}/update-password`;

    if (isLiveSupabaseConfigured) {
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
          redirectTo: callbackUrl,
        });

        if (error) return { success: false, error: mapAuthErrorMessage(error.message) };
        return { success: true };
      } catch (err: any) {
        return { success: false, error: mapAuthErrorMessage(err.message || 'Could not send recovery email.') };
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

    const existing = mockStore.profiles.get(userId) || {
      id: userId,
      full_name: (sanitizedUpdates as any).full_name || 'PART User',
      email: (sanitizedUpdates as any).email || null,
      phone: (sanitizedUpdates as any).phone || null,
      avatar_url: (sanitizedUpdates as any).avatar_url || null,
      bio: null,
      default_role: 'poster' as const,
      preferred_language: 'en' as const,
      city: 'Chennai',
      general_location: 'Velachery, Chennai',
      is_admin: false,
      is_worker_available: true,
      verification_status: 'verified' as const,
      rating_as_worker: 5.0,
      total_reviews_as_worker: 0,
      completed_tasks_as_worker: 0,
      rating_as_requester: 5.0,
      total_reviews_as_requester: 0,
      completed_tasks_as_requester: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const merged: Profile = {
      ...existing,
      ...sanitizedUpdates,
    };
    mockStore.profiles.set(userId, merged);
    return { profile: merged };
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
   * Fetch user profile by email address (used to link Google sign-in to existing accounts)
   */
  async getProfileByEmail(email: string): Promise<Profile | null> {
    const cleanEmail = email.toLowerCase().trim();
    if (!cleanEmail) return null;

    if (isLiveSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .ilike('email', cleanEmail)
          .maybeSingle();

        if (!error && data) return data as Profile;
      } catch (err) {
        console.warn('Error fetching profile by email from Supabase:', err);
      }
    }

    for (const [_, profile] of mockStore.profiles.entries()) {
      if (profile.email && profile.email.toLowerCase().trim() === cleanEmail) {
        return profile;
      }
    }
    return null;
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
   * Update Student University Onboarding details
   */
  async updateStudentOnboarding(
    userId: string,
    data: {
      userType: 'student' | 'individual' | 'organization';
      collegeId?: string;
      collegeName?: string;
      department?: string;
      yearOfStudy?: string;
      skills?: string[];
      bio?: string;
      profilePicture?: string;
    }
  ): Promise<{ profile?: Profile; error?: string }> {
    const existing = mockStore.profiles.get(userId);
    if (!existing) {
      return { error: 'User profile not found.' };
    }

    const updatedProfile: Profile = {
      ...existing,
      college_id: data.collegeId || existing.college_id,
      department: data.department || (existing as any).department,
      skills: data.skills || existing.skills || [],
      bio: data.bio || existing.bio,
      avatar_url: data.profilePicture || existing.avatar_url,
      verification_status: 'pending', // Verification status stays pending until reviewed
      updated_at: new Date().toISOString(),
    };

    if (isLiveSupabaseConfigured) {
      try {
        await supabase
          .from('profiles')
          .update({
            user_type: data.userType,
            college_id: data.collegeId || null,
            college_name: data.collegeName || null,
            department: data.department || null,
            year_of_study: data.yearOfStudy || null,
            skills: data.skills || [],
            bio: data.bio || null,
            verification_status: 'pending',
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);
      } catch (err: any) {
        console.warn('Supabase profile update warning:', err);
      }
    }

    mockStore.profiles.set(userId, updatedProfile);
    return { profile: updatedProfile };
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
