import { describe, it, expect, beforeEach } from 'vitest';
import {
  authService,
  mockStore,
  signupSchema,
  loginSchema,
  forgotPasswordSchema,
  updatePasswordSchema,
  Profile,
} from '../shared/src';

describe('PART – Complete Authentication System Tests', () => {
  beforeEach(() => {
    mockStore.reset();
  });

  describe('1. Zod Validation Rules for Auth Forms', () => {
    it('validates signup form with complete valid data', () => {
      const valid = signupSchema.safeParse({
        full_name: 'Dinesh Karthik',
        email: 'dinesh@part.in',
        phone: '9840123456',
        password: 'Password@123',
        confirmPassword: 'Password@123',
        termsAccepted: true,
        preferred_language: 'en',
      });
      expect(valid.success).toBe(true);
    });

    it('rejects signup if password and confirmPassword mismatch', () => {
      const mismatch = signupSchema.safeParse({
        full_name: 'Dinesh Karthik',
        email: 'dinesh@part.in',
        phone: '9840123456',
        password: 'Password@123',
        confirmPassword: 'DifferentPassword@123',
        termsAccepted: true,
      });
      expect(mismatch.success).toBe(false);
      if (!mismatch.success) {
        expect(mismatch.error.errors[0].message).toBe('Passwords do not match');
      }
    });

    it('rejects signup if terms and privacy policy are not accepted', () => {
      const noTerms = signupSchema.safeParse({
        full_name: 'Dinesh Karthik',
        email: 'dinesh@part.in',
        password: 'Password@123',
        confirmPassword: 'Password@123',
        termsAccepted: false,
      });
      expect(noTerms.success).toBe(false);
    });

    it('validates login form with email and minimum password length', () => {
      expect(loginSchema.safeParse({ email: 'user@part.in', password: 'password123' }).success).toBe(true);
      expect(loginSchema.safeParse({ email: 'invalid-email', password: 'short' }).success).toBe(false);
    });

    it('validates password recovery and update schemas', () => {
      expect(forgotPasswordSchema.safeParse({ email: 'recovery@part.in' }).success).toBe(true);
      expect(forgotPasswordSchema.safeParse({ email: 'invalid-email' }).success).toBe(false);

      expect(
        updatePasswordSchema.safeParse({
          password: 'newSecretPassword123',
          confirmPassword: 'newSecretPassword123',
        }).success
      ).toBe(true);

      expect(
        updatePasswordSchema.safeParse({
          password: 'newSecretPassword123',
          confirmPassword: 'mismatchPassword',
        }).success
      ).toBe(false);
    });
  });

  describe('2. Email Signup & Account Creation', () => {
    it('successfully registers a new user and generates a verified profile', async () => {
      const res = await authService.register(
        'ravi.kumar@chennai.in',
        'StrongPass123',
        'Ravi Kumar',
        '9884123456',
        'ta'
      );

      expect(res.error).toBeUndefined();
      expect(res.user).toBeDefined();
      expect(res.profile).toBeDefined();
      expect(res.profile?.full_name).toBe('Ravi Kumar');
      expect(res.profile?.email).toBe('ravi.kumar@chennai.in');
      expect(res.profile?.default_role).toBe('poster');
      expect(res.profile?.preferred_language).toBe('ta');
    });

    it('prevents duplicate account registration for the same email', async () => {
      await authService.register(
        'unique.user@chennai.in',
        'Secret123',
        'First User'
      );

      const duplicateRes = await authService.register(
        'unique.user@chennai.in',
        'AnotherPassword123',
        'Second User'
      );

      expect(duplicateRes.user).toBeNull();
      expect(duplicateRes.error).toContain('already exists');
    });
  });

  describe('3. Email Login & Password Verification', () => {
    beforeEach(async () => {
      await authService.register(
        'member@part.in',
        'CorrectPassword123',
        'Marketplace Member'
      );
    });

    it('authenticates successfully with correct email and password', async () => {
      const res = await authService.login('member@part.in', 'CorrectPassword123');
      expect(res.error).toBeUndefined();
      expect(res.session).toBeDefined();
      expect(res.session?.user.email).toBe('member@part.in');
      expect(res.session?.profile.full_name).toBe('Marketplace Member');
    });

    it('rejects authentication with incorrect password', async () => {
      const res = await authService.login('member@part.in', 'WrongPassword999');
      expect(res.session).toBeNull();
      expect(res.error).toBe('Incorrect password. Please try again.');
    });

    it('rejects authentication for non-existent account', async () => {
      const res = await authService.login('unknown@part.in', 'SomePassword123');
      expect(res.session).toBeNull();
      expect(res.error).toContain('No account found with this email');
    });
  });

  describe('4. Google OAuth 2.0 Integration', () => {
    it('initiates Google OAuth authentication flow with redirect URL', async () => {
      const res = await authService.signInWithGoogle('http://localhost:3000/auth/callback');
      expect(res.error).toBeUndefined();
      expect(mockStore.currentUserId).not.toBeNull();

      const profile = authService.getCurrentUser();
      expect(profile).toBeDefined();
      expect(profile?.verification_status).toBe('verified');
    });
  });

  describe('5. Password Recovery Flow', () => {
    it('dispatches password reset email request', async () => {
      const res = await authService.resetPassword('member@part.in');
      expect(res.success).toBe(true);
      expect(res.error).toBeUndefined();
    });

    it('updates password and permits login with the new password', async () => {
      await authService.register('reset.user@part.in', 'OldPassword123', 'Reset User');
      mockStore.currentUserId = mockStore.profiles.values().next().value.id;

      const updateRes = await authService.updatePassword('NewBrandSecret456');
      expect(updateRes.success).toBe(true);

      const loginRes = await authService.login('reset.user@part.in', 'NewBrandSecret456');
      expect(loginRes.session).toBeDefined();
      expect(loginRes.error).toBeUndefined();
    });
  });

  describe('6. Dual Activity Roles: Task Poster & Task Worker', () => {
    it('allows user to switch between Task Poster and Task Worker on the same account', async () => {
      const reg = await authService.register('multitask@part.in', 'Secret123', 'Vijay S');
      const userId = reg.profile!.id;

      // Default role is poster
      expect(reg.profile!.default_role).toBe('poster');

      // Switch to worker mode
      const workerRes = await authService.updateProfile(userId, { default_role: 'worker' });
      expect(workerRes.profile?.default_role).toBe('worker');

      // Switch back to poster mode
      const posterRes = await authService.updateProfile(userId, { default_role: 'poster' });
      expect(posterRes.profile?.default_role).toBe('poster');
    });
  });

  describe('7. Profile Avatar Upload to Supabase Storage', () => {
    it('uploads avatar image and updates profile avatar_url', async () => {
      const reg = await authService.register('photo.user@part.in', 'Secret123', 'Pooja M');
      const userId = reg.profile!.id;

      // Mock image blob
      const mockBlob = new Blob(['fake image content'], { type: 'image/png' });
      const uploadRes = await authService.uploadAvatar(userId, mockBlob, 'pooja-avatar.png');

      expect(uploadRes.error).toBeUndefined();
      expect(uploadRes.avatarUrl).toBeDefined();

      const updatedProfile = await authService.getProfile(userId);
      expect(updatedProfile?.avatar_url).toBe(uploadRes.avatarUrl);
    });
  });

  describe('8. Session Persistence & Logout Lifecycle', () => {
    it('properly tracks current user and clears session upon logout', async () => {
      const reg = await authService.register('session.user@part.in', 'Secret123', 'Session User');
      expect(authService.getCurrentUser()).not.toBeNull();

      await authService.logout();
      expect(authService.getCurrentUser()).toBeNull();
    });
  });

  describe('9. Complete Profile Details Editing & Personalization', () => {
    it('successfully updates all profile fields including phone, bio, UPI, skills and locality', async () => {
      const reg = await authService.register('mahasuf@part.in', 'Secret123', 'MAHASUF X2');
      const userId = reg.profile!.id;

      const updateRes = await authService.updateProfile(userId, {
        full_name: 'Mahasuf Wazeed',
        phone: '+91 98401 23456',
        bio: 'Fast delivery runner and handyman in Velachery',
        city: 'Chennai',
        general_location: 'Velachery, Chennai',
        preferred_language: 'ta',
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
        upi_id: 'mahasuf@okhdfcbank',
        skills: ['📦 Delivery & Errands', '⚡ Electrical & Wiring'],
        is_worker_available: true,
      });

      expect(updateRes.error).toBeUndefined();
      expect(updateRes.profile).toBeDefined();
      expect(updateRes.profile?.full_name).toBe('Mahasuf Wazeed');
      expect(updateRes.profile?.phone).toBe('+91 98401 23456');
      expect(updateRes.profile?.bio).toBe('Fast delivery runner and handyman in Velachery');
      expect(updateRes.profile?.general_location).toBe('Velachery, Chennai');
      expect(updateRes.profile?.preferred_language).toBe('ta');
      expect(updateRes.profile?.upi_id).toBe('mahasuf@okhdfcbank');
      expect(updateRes.profile?.skills).toContain('📦 Delivery & Errands');
      expect(updateRes.profile?.is_worker_available).toBe(true);

      // Verify persistence in store
      const fetched = await authService.getProfile(userId);
      expect(fetched?.full_name).toBe('Mahasuf Wazeed');
      expect(fetched?.upi_id).toBe('mahasuf@okhdfcbank');
    });
  });
});

