import { describe, it, expect, beforeEach } from 'vitest';
import {
  authService,
  mockStore,
  Profile,
} from '../shared/src';

describe('PART — University Student Onboarding Flow & Security Tests', () => {
  beforeEach(() => {
    mockStore.reset();
  });

  describe('1. Student Onboarding Processing', () => {
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

      const onboardingRes = await authService.updateStudentOnboarding(testUser.id, {
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

    it('enforces that student verification status remains PENDING and cannot be self-approved', async () => {
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

      const res = await authService.updateStudentOnboarding(studentUser.id, {
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
      await authService.logout();
      expect(mockStore.currentUserId).toBeNull();
    });
  });
});
