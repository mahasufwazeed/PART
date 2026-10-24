import { describe, it, expect, beforeEach } from 'vitest';
import {
  firebaseAuthService,
  isFirebaseConfigured,
  getMissingFirebaseKeys,
  mockStore,
  Profile,
} from '../shared/src';

describe('PART — Firebase Auth & University Onboarding Integration Tests', () => {
  beforeEach(() => {
    mockStore.reset();
  });

  describe('1. Firebase Environment & Configuration Detection', () => {
    it('accurately identifies missing Firebase configuration keys when env vars are unset', () => {
      const isConfigured = isFirebaseConfigured();
      // In current testing environment without .env injected, isConfigured should be false
      expect(typeof isConfigured).toBe('boolean');

      const missingKeys = getMissingFirebaseKeys();
      expect(Array.isArray(missingKeys)).toBe(true);
      if (!isConfigured) {
        expect(missingKeys).toContain('VITE_FIREBASE_API_KEY');
        expect(missingKeys).toContain('VITE_FIREBASE_PROJECT_ID');
        expect(missingKeys).toContain('VITE_FIREBASE_APP_ID');
      }
    });

    it('gracefully reports clear requirement guidance if live Firebase operations are attempted without credentials', async () => {
      if (!firebaseAuthService.isConfigured()) {
        const googleRes = await firebaseAuthService.signInWithGoogle();
        expect(googleRes.error).toBeDefined();
        expect(googleRes.error).toContain('Firebase');

        const loginRes = await firebaseAuthService.loginWithEmail('test@part.app', 'pass1234');
        expect(loginRes.error).toBeDefined();
        expect(loginRes.error).toContain('Firebase');

        const signupRes = await firebaseAuthService.registerWithEmail(
          'new@part.app',
          'pass1234',
          'New Student'
        );
        expect(signupRes.error).toBeDefined();
        expect(signupRes.error).toContain('Firebase');
      }
    });
  });

  describe('2. University Student Onboarding Flow & Security', () => {
    it('successfully processes student onboarding and stores university details', async () => {
      // Seed a registered profile
      const testUser: Profile = {
        id: 'usr-student-test',
        full_name: 'Ananya Raman',
        email: 'ananya@velsuniv.ac.in',
        preferred_language: 'en',
        city: 'Chennai',
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
      mockStore.profiles.set(testUser.id, testUser);

      const onboardingRes = await firebaseAuthService.updateStudentOnboarding(testUser.id, {
        userType: 'student',
        collegeId: 'vels-university',
        collegeName: 'VELS Institute of Science, Technology & Advanced Studies',
        department: 'B.Tech Computer Science',
        yearOfStudy: '3rd Year',
        skills: ['Notes & Assignments', 'Tech Support'],
        bio: 'Student helper at VELS campus.',
      });

      expect(onboardingRes.error).toBeUndefined();
      expect(onboardingRes.profile).toBeDefined();
      expect(onboardingRes.profile?.college_id).toBe('vels-university');
      expect(onboardingRes.profile?.department).toBe('B.Tech Computer Science');
      expect(onboardingRes.profile?.skills).toContain('Notes & Assignments');
      expect(onboardingRes.profile?.verification_status).toBe('pending');
    });

    it('enforces that a student verification status remains PENDING and cannot be self-approved', async () => {
      const studentUser: Profile = {
        id: 'usr-student-tamizh',
        full_name: 'Tamizh Inian',
        email: 'tamizh@annauniv.edu',
        preferred_language: 'ta',
        city: 'Chennai',
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
      mockStore.profiles.set(studentUser.id, studentUser);

      const res = await firebaseAuthService.updateStudentOnboarding(studentUser.id, {
        userType: 'student',
        collegeId: 'anna-university',
        collegeName: 'Anna University (CEG Guindy)',
        department: 'Information Technology',
        yearOfStudy: '2nd Year',
      });

      // Verification MUST be pending, protecting against unauthorized student self-verification
      expect(res.profile?.verification_status).toBe('pending');
      expect(res.profile?.verification_status).not.toBe('verified');
    });

    it('clears session on logout', async () => {
      mockStore.currentUserId = 'some-user-id';
      await firebaseAuthService.logout();
      expect(mockStore.currentUserId).toBeNull();
    });
  });
});
