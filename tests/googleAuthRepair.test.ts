import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  authService,
  mockStore,
  getAppCanonicalOrigin,
  getGoogleCallbackUrl,
  mapAuthErrorMessage,
  Profile,
} from '../shared/src';

describe('PART – Google Authentication Localhost Redirect & Session Repair Tests', () => {
  beforeEach(() => {
    mockStore.reset();
  });

  describe('1. Dynamic Origin & Callback URL Resolution (Prevent Localhost in Production)', () => {
    const originalEnv = { ...process.env };

    afterEach(() => {
      process.env = { ...originalEnv };
      if (typeof window !== 'undefined') {
        delete (window as any).location;
      }
    });

    it('Test 1: Resolves local development origin dynamically', () => {
      // Simulate browser at http://localhost:5173
      const mockLocation = { origin: 'http://localhost:5173' };
      (globalThis as any).window = { location: mockLocation };

      const origin = getAppCanonicalOrigin();
      const callbackUrl = getGoogleCallbackUrl();

      expect(origin).toBe('http://localhost:5173');
      expect(callbackUrl).toBe('http://localhost:5173/auth/callback');
    });

    it('Test 2 & Test 10: Deployed production environment never resolves to localhost', () => {
      // Simulate Render production hosting environment
      delete (globalThis as any).window;
      process.env.RENDER_EXTERNAL_URL = 'https://part-marketplace.onrender.com';

      const origin = getAppCanonicalOrigin();
      const callbackUrl = getGoogleCallbackUrl();

      expect(origin).toBe('https://part-marketplace.onrender.com');
      expect(callbackUrl).toBe('https://part-marketplace.onrender.com/auth/callback');
      expect(callbackUrl).not.toContain('localhost');
      expect(callbackUrl).not.toContain('127.0.0.1');
    });

    it('Resolves VITE_APP_URL when configured for custom domain', () => {
      delete (globalThis as any).window;
      delete process.env.RENDER_EXTERNAL_URL;
      process.env.VITE_APP_URL = 'https://app.partchennai.in';

      const callbackUrl = getGoogleCallbackUrl();
      expect(callbackUrl).toBe('https://app.partchennai.in/auth/callback');
    });

    it('Preserves explicitly specified custom redirect targets', () => {
      const custom = 'https://part-marketplace.onrender.com/custom/oauth';
      expect(getGoogleCallbackUrl(custom)).toBe(custom);
    });
  });

  describe('2. Account Preservation vs New User Creation (Preserve Existing Accounts)', () => {
    it('Test 3: Existing Google user login preserves ratings, reviews, and completed tasks', async () => {
      // Create existing user who previously registered with email
      const existingUser: Profile = {
        id: 'usr-existing-100',
        full_name: 'Ananya Raman',
        email: 'ananya.raman@annauniv.edu',
        phone: '9876543210',
        avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330',
        bio: 'Senior Anna University student helper.',
        default_role: 'worker',
        preferred_language: 'ta',
        city: 'Chennai',
        general_location: 'Guindy, Chennai',
        is_admin: false,
        verification_status: 'verified',
        is_worker_available: true,
        rating_as_worker: 4.95,
        total_reviews_as_worker: 28,
        completed_tasks_as_worker: 34,
        rating_as_requester: 5.0,
        total_reviews_as_requester: 4,
        completed_tasks_as_requester: 5,
        college_id: 'anna-university',
        created_at: '2025-01-15T10:00:00.000Z',
        updated_at: '2025-01-15T10:00:00.000Z',
      };
      mockStore.profiles.set(existingUser.id, existingUser);

      // Sign in with Google with matching email
      const res = await authService.signInWithGoogle({
        email: 'ananya.raman@annauniv.edu',
      });

      expect(res.error).toBeUndefined();
      expect(res.session).toBeDefined();
      expect(res.session?.profile.id).toBe('usr-existing-100');
      expect(res.session?.profile.full_name).toBe('Ananya Raman');
      expect(res.session?.profile.rating_as_worker).toBe(4.95);
      expect(res.session?.profile.total_reviews_as_worker).toBe(28);
      expect(res.session?.profile.completed_tasks_as_worker).toBe(34);
      expect(res.session?.profile.college_id).toBe('anna-university');

      // Ensure no duplicate profiles were created in the store
      expect(mockStore.profiles.size).toBe(1);
    });

    it('Test 4: New Google user signup creates fresh verified profile without collisions', async () => {
      const res = await authService.signInWithGoogle({
        email: 'brandnewstudent@iitm.ac.in',
        fullName: 'Karthik Raja',
      });

      expect(res.error).toBeUndefined();
      expect(res.session).toBeDefined();
      expect(res.session?.profile.email).toBe('brandnewstudent@iitm.ac.in');
      expect(res.session?.profile.full_name).toBe('Karthik Raja');
      expect(res.session?.profile.verification_status).toBe('verified');
      expect(res.session?.profile.id).toMatch(/^google-usr-/);
      expect(mockStore.currentUserId).toBe(res.session?.profile.id);
    });

    it('Case-insensitively finds profiles via getProfileByEmail', async () => {
      const user: Profile = {
        id: 'usr-case-test',
        full_name: 'Priya Sundar',
        email: 'priya.sundar@srmist.edu.in',
        avatar_url: null,
        bio: null,
        phone: null,
        default_role: 'poster',
        preferred_language: 'en',
        city: 'Chennai',
        general_location: 'Kattankulathur, Chennai',
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
      mockStore.profiles.set(user.id, user);

      const found = await authService.getProfileByEmail('PRIYA.SUNDAR@srmist.edu.in');
      expect(found).not.toBeNull();
      expect(found?.id).toBe('usr-case-test');

      const notFound = await authService.getProfileByEmail('nonexistent@domain.com');
      expect(notFound).toBeNull();
    });
  });

  describe('3. Session State, Refresh & Re-Authentication Flow', () => {
    it('Test 5: Browser refresh / state reload retains current authenticated user', async () => {
      const res = await authService.signInWithGoogle({
        email: 'refresh.test@part.in',
      });

      expect(res.session).toBeDefined();

      // Simulate refresh by reading current user from store
      const currentUser = authService.getCurrentUser();
      expect(currentUser).not.toBeNull();
      expect(currentUser?.email).toBe('refresh.test@part.in');
    });

    it('Test 6: Logout clears session and subsequent login restores correctly', async () => {
      await authService.signInWithGoogle({ email: 'cycle.test@part.in' });
      expect(authService.getCurrentUser()).not.toBeNull();

      // Logout
      await authService.logout();
      expect(authService.getCurrentUser()).toBeNull();
      expect(mockStore.currentUserId).toBeNull();

      // Login again
      const relogin = await authService.signInWithGoogle({ email: 'cycle.test@part.in' });
      expect(relogin.session?.profile.email).toBe('cycle.test@part.in');
      expect(authService.getCurrentUser()?.email).toBe('cycle.test@part.in');
    });
  });

  describe('4. Comprehensive Error Handling & Error Message Mapping', () => {
    it('Test 7: Maps user cancellation into polite, clear notification', () => {
      expect(mapAuthErrorMessage('access_denied')).toBe('Google sign-in was cancelled.');
      expect(mapAuthErrorMessage('The user cancelled the sign in flow.')).toBe(
        'Google sign-in was cancelled.'
      );
      expect(mapAuthErrorMessage('popup-closed-by-user')).toBe('Google sign-in was cancelled.');
    });

    it('Test 8: Maps popup blocker errors into helpful browser instruction', () => {
      const popupError = mapAuthErrorMessage('Popup window was blocked by browser.');
      expect(popupError).toContain('popup was blocked by your browser');
    });

    it('Test 9: Maps redirect_uri_mismatch and unauthorized client into actionable console advice', () => {
      const uriMismatch = mapAuthErrorMessage('redirect_uri_mismatch');
      expect(uriMismatch).toContain('OAuth redirect URL mismatch');
      expect(uriMismatch).toContain('Google Cloud Console');
      expect(uriMismatch).toContain('Supabase Dashboard');

      const unauthClient = mapAuthErrorMessage('unauthorized_client: not allowed');
      expect(unauthClient).toContain('Supabase Dashboard (Auth > URL Configuration)');
    });

    it('Maps network and connection refused errors gracefully without raw code leaks', () => {
      const connRefused = mapAuthErrorMessage('ERR_CONNECTION_REFUSED');
      expect(connRefused).toBe(
        'Unable to connect to authentication server. Please check your network connection.'
      );
    });
  });
});
