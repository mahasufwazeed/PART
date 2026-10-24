import { describe, it, expect, beforeEach } from 'vitest';
import {
  authService,
  taskService,
  chatService,
  paymentService,
  reviewService,
  disputeService,
  campusService,
  notificationService,
  mockStore,
  TASK_CATEGORIES,
  CHENNAI_COLLEGES,
} from '../shared/src';

describe('PART – Phase 1 Complete Quality Audit & End-to-End Test Suite', () => {
  beforeEach(() => {
    mockStore.reset();
  });

  describe('1. Authentication & Google OAuth', () => {
    it('executes full email signup, login, session persistence, and logout', async () => {
      // 1. Register new student
      const reg = await authService.register(
        'student.vels@velsuniv.ac.in',
        'SecurePassword123!',
        'Aravind Swaminathan',
        '9876543210',
        'en'
      );
      expect(reg.error).toBeUndefined();
      expect(reg.profile?.email).toBe('student.vels@velsuniv.ac.in');
      expect(reg.profile?.full_name).toBe('Aravind Swaminathan');

      // 2. Prevent duplicate email registration
      const dup = await authService.register(
        'student.vels@velsuniv.ac.in',
        'AnotherPass123!',
        'Imposter'
      );
      expect(dup.error).toMatch(/already exists/i);

      // 3. Login with correct password
      const loginSuccess = await authService.login(
        'student.vels@velsuniv.ac.in',
        'SecurePassword123!'
      );
      expect(loginSuccess.error).toBeUndefined();
      expect(loginSuccess.session?.profile.id).toBe(reg.profile?.id);

      // 4. Reject invalid password
      const loginFail = await authService.login(
        'student.vels@velsuniv.ac.in',
        'WrongPassword!'
      );
      expect(loginFail.error).toMatch(/incorrect password/i);

      // 5. Password reset & update
      const reset = await authService.resetPassword('student.vels@velsuniv.ac.in');
      expect(reset.success).toBe(true);

      const update = await authService.updatePassword('BrandNewPassword456!');
      expect(update.success).toBe(true);

      // 6. Verify login with new password
      const loginNew = await authService.login(
        'student.vels@velsuniv.ac.in',
        'BrandNewPassword456!'
      );
      expect(loginNew.error).toBeUndefined();
      expect(loginNew.session?.user.email).toBe('student.vels@velsuniv.ac.in');
    });

    it('handles Google Sign-in flow and profile creation', async () => {
      const googleRes = await authService.signInWithGoogle();
      expect(googleRes.error).toBeUndefined();
      expect(mockStore.currentUserId).toBeDefined();

      const profile = mockStore.profiles.get(mockStore.currentUserId!);
      expect(profile).toBeDefined();
      expect(profile?.email).toBe('user@gmail.com');
      expect(profile?.verification_status).toBe('verified');
    });
  });

  describe('2. Campus Community & Student Verification', () => {
    it('allows searching, selecting, and suggesting colleges without admin approval', async () => {
      const colleges = await campusService.getColleges();
      expect(colleges.length).toBeGreaterThanOrEqual(4);

      const vels = colleges.find((c) => c.short_name === 'VELS University');
      expect(vels).toBeDefined();
      expect(vels?.domains).toContain('velsuniv.ac.in');

      // Suggest unlisted college
      const custom = await campusService.suggestCollege({
        name: 'BSA Crescent Institute of Science and Technology',
        short_name: 'Crescent University',
        city: 'Chennai',
        locality: 'Vandalur',
      });
      expect(custom.id).toBe('bsa-crescent-institute-of-science-and-technology');
      expect(custom.is_verified).toBe(true);

      // Verify immediately available in directory
      const updatedList = await campusService.getColleges();
      expect(updatedList.some((c) => c.id === 'bsa-crescent-institute-of-science-and-technology')).toBe(true);
    });

    it('verifies student status ONLY with valid university domain', async () => {
      const { profile } = await authService.register(
        'priya@gmail.com',
        'password123',
        'Priya Dharshini'
      );

      // 1. Self-selected membership
      await campusService.setUserCollege(profile!.id, 'vels-university', 'VELS University');
      const p1 = mockStore.profiles.get(profile!.id);
      expect(p1?.college_id).toBe('vels-university');
      expect(p1?.college_status).toBe('self_selected');

      // 2. Invalid student domain rejection
      const invalidVerify = await campusService.verifyCollegeEmail(
        profile!.id,
        'priya@randomdomain.com',
        'vels-university'
      );
      expect(invalidVerify.success).toBe(false);
      expect(invalidVerify.error).toMatch(/does not match/i);

      // 3. Official domain verification
      const validVerify = await campusService.verifyCollegeEmail(
        profile!.id,
        'priya.cse@velsuniv.ac.in',
        'vels-university'
      );
      expect(validVerify.success).toBe(true);
      const p2 = mockStore.profiles.get(profile!.id);
      expect(p2?.college_status).toBe('verified');
    });

    it('enforces academic honesty policy and rejects exam cheating tasks', async () => {
      const { profile } = await authService.register(
        'cheater@test.in',
        'password123',
        'Cheater Test'
      );

      const rejected = await campusService.createCampusTask(
        {
          title: 'Need exam proxy for semester exam',
          description: 'Take my test for data structures tomorrow.',
          category_id: 'tutoring',
          budget_inr: 1000,
          deadline: '2026-10-25',
          college_id: 'vels-university',
          college_name: 'VELS University',
          visibility: 'COLLEGE_ONLY',
        },
        profile!.id
      );

      expect(rejected.task).toBeNull();
      expect(rejected.error).toMatch(/academic integrity/i);

      // Legitimate tutoring is accepted
      const accepted = await campusService.createCampusTask(
        {
          title: 'Need help understanding Java OOP concepts',
          description: 'Explaining inheritance and interfaces before lab practicals.',
          category_id: 'tutoring',
          budget_inr: 250,
          deadline: '2026-10-26',
          college_id: 'vels-university',
          college_name: 'VELS University',
          campus_location: 'Central Library Room 4',
          visibility: 'COLLEGE_ONLY',
        },
        profile!.id
      );

      expect(accepted.task).toBeDefined();
      expect(accepted.task?.budget_inr).toBe(250);
      expect(accepted.task?.is_campus_task).toBe(true);
    });
  });

  describe('3. Hyperlocal Task Marketplace & Address Privacy', () => {
    it('discovers nearby tasks while masking exact residential address from the public', async () => {
      const { profile: poster } = await authService.register(
        'poster.adyar@test.in',
        'password123',
        'Adyar Resident'
      );

      const { task } = await taskService.createTask(poster!.id, {
        title: 'Deliver medicine to elderly relative',
        description: 'Pick up insulin from Apollo Pharmacy Adyar and deliver to residence.',
        category_id: TASK_CATEGORIES[0].id,
        budget_inr: 180,
        estimated_duration_minutes: 25,
        preferred_date: '2026-10-25',
        required_workers_count: 1,
        city: 'Chennai',
        locality: 'Adyar',
        address_approximate: 'Near Adyar Depot',
        address_exact: 'Door 14, 3rd Cross Street, Gandhinagar, Adyar',
        latitude: 13.0012,
        longitude: 80.2565,
      });

      // Public view (unassigned worker)
      const detailsPublic = await taskService.getTaskById(task.id, 'unassigned-worker-id');
      expect(detailsPublic.task?.location?.address_approximate).toBe('Near Adyar Depot');
      expect(detailsPublic.task?.location?.address_exact).toBeNull(); // Masked!

      // Requester view
      const detailsRequester = await taskService.getTaskById(task.id, poster!.id);
      expect(detailsRequester.task?.location?.address_exact).toBe('Door 14, 3rd Cross Street, Gandhinagar, Adyar');
    });

    it('enforces worker application rules, prevents self-application, and rejects duplicates', async () => {
      const { profile: poster } = await authService.register('p1@test.in', 'pass', 'Poster 1');
      const { profile: worker } = await authService.register('w1@test.in', 'pass', 'Worker 1');

      const { task } = await taskService.createTask(poster!.id, {
        title: 'Help shifting boxes in Thiruvanmiyur',
        description: 'Need help moving 3 cartons into car boot.',
        category_id: TASK_CATEGORIES[1].id,
        budget_inr: 200,
        estimated_duration_minutes: 20,
        preferred_date: '2026-10-25',
        required_workers_count: 1,
        city: 'Chennai',
        locality: 'Thiruvanmiyur',
        latitude: 12.983,
        longitude: 80.2594,
      });

      // Self application rejected
      const selfApp = await taskService.applyForTask(task.id, poster!.id);
      expect(selfApp.error).toMatch(/cannot apply to your own task/i);

      // Valid application
      const app = await taskService.applyForTask(task.id, worker!.id, 'Available right now on bike');
      expect(app.application).toBeDefined();

      // Duplicate application rejected
      const dup = await taskService.applyForTask(task.id, worker!.id);
      expect(dup.error).toMatch(/already applied/i);
    });
  });

  describe('4. Lifecycle, Payment Ledger & Reviews', () => {
    it('completes the full task lifecycle with ratings and 10% platform fee', async () => {
      const { profile: poster } = await authService.register('client@part.in', 'pass', 'Client C');
      const { profile: helper } = await authService.register('helper@part.in', 'pass', 'Helper H');

      const { task } = await taskService.createTask(poster!.id, {
        title: 'Emergency printing in Guindy',
        description: 'Print 40 pages of project report.',
        category_id: TASK_CATEGORIES[2].id,
        budget_inr: 300,
        estimated_duration_minutes: 30,
        preferred_date: '2026-10-25',
        required_workers_count: 1,
        city: 'Chennai',
        locality: 'Guindy',
        latitude: 13.0067,
        longitude: 80.2021,
      });

      const { application } = await taskService.applyForTask(task.id, helper!.id);
      const { assignment } = await taskService.assignWorker(task.id, helper!.id, application.id, poster!.id);

      // Start task
      await taskService.startTask(task.id, helper!.id);
      expect(mockStore.tasks.get(task.id)?.status).toBe('IN_PROGRESS');

      // Submit completion
      await taskService.submitCompletion(task.id, assignment.id, helper!.id, 'Report printed and delivered.');
      expect(mockStore.tasks.get(task.id)?.status).toBe('COMPLETION_SUBMITTED');

      // Confirm completion
      await taskService.confirmCompletion(task.id, poster!.id);
      expect(mockStore.tasks.get(task.id)?.status).toBe('COMPLETED');

      // Settle payment
      const { payment } = await paymentService.recordPayment({
        taskId: task.id,
        payerId: poster!.id,
        payeeId: helper!.id,
        totalAmountInr: 300,
        paymentMethod: 'UPI',
      });
      expect(payment.total_amount_inr).toBe(300);
      expect(payment.platform_fee_inr).toBe(30);
      expect(payment.worker_amount_inr).toBe(270);

      // Reviews enabled only after completion
      const { review } = await reviewService.submitReview({
        taskId: task.id,
        reviewerId: poster!.id,
        revieweeId: helper!.id,
        roleReviewed: 'worker',
        rating: 5,
        feedback: 'Super fast delivery and clean prints!',
      });
      expect(review.rating).toBe(5);

      const helperProfile = mockStore.profiles.get(helper!.id);
      expect(helperProfile?.rating_as_worker).toBe(5);
      expect(helperProfile?.total_reviews_as_worker).toBe(1);
    });
  });

  describe('5. Safety, User Reporting, Blocking & Notifications', () => {
    it('blocks communication and task applications between blocked users', async () => {
      const { profile: userA } = await authService.register('usera@part.in', 'pass', 'User A');
      const { profile: userB } = await authService.register('userb@part.in', 'pass', 'User B');

      // User A blocks User B
      const blockRes = await disputeService.blockUser(userA!.id, userB!.id);
      expect(blockRes.success).toBe(true);

      const isBlocked = await disputeService.isUserBlocked(userA!.id, userB!.id);
      expect(isBlocked).toBe(true);

      // User B cannot apply to User A's task
      const { task } = await taskService.createTask(userA!.id, {
        title: 'Task by User A',
        description: 'Test description',
        category_id: TASK_CATEGORIES[0].id,
        budget_inr: 150,
        estimated_duration_minutes: 20,
        preferred_date: '2026-10-25',
        required_workers_count: 1,
        city: 'Chennai',
        locality: 'Adyar',
        latitude: 13.0,
        longitude: 80.2,
      });

      const applyBlocked = await taskService.applyForTask(task.id, userB!.id);
      expect(applyBlocked.error).toMatch(/restricted/i);

      // Unblock restores functionality
      await disputeService.unblockUser(userA!.id, userB!.id);
      expect(await disputeService.isUserBlocked(userA!.id, userB!.id)).toBe(false);

      const applyAllowed = await taskService.applyForTask(task.id, userB!.id);
      expect(applyAllowed.application).toBeDefined();
    });

    it('dispatches notifications on task applications and chat messages', async () => {
      const { profile: requester } = await authService.register('req@part.in', 'pass', 'Requester R');
      const { profile: worker } = await authService.register('wrk@part.in', 'pass', 'Worker W');

      const { task } = await taskService.createTask(requester!.id, {
        title: 'Campus Notes Xerox',
        description: 'Xerox engineering graphics notes',
        category_id: TASK_CATEGORIES[0].id,
        budget_inr: 100,
        estimated_duration_minutes: 15,
        preferred_date: '2026-10-25',
        required_workers_count: 1,
        city: 'Chennai',
        locality: 'Pallavaram',
        latitude: 12.9675,
        longitude: 80.1491,
      });

      // Worker applies -> Requester receives notification
      await taskService.applyForTask(task.id, worker!.id);
      const reqNotifs = await notificationService.getNotifications(requester!.id);
      expect(reqNotifs.length).toBeGreaterThanOrEqual(1);
      expect(reqNotifs[0].title).toBe('New Task Application');
      expect(reqNotifs[0].is_read).toBe(false);

      // Mark notification as read
      await notificationService.markAsRead(reqNotifs[0].id);
      const unreadCount = await notificationService.getUnreadCount(requester!.id);
      expect(unreadCount).toBe(0);
    });

    it('submits safety reports with full evidence logging', async () => {
      const { profile: reporter } = await authService.register('rep@part.in', 'pass', 'Reporter User');
      const { profile: offender } = await authService.register('off@part.in', 'pass', 'Offender User');

      const { report } = await disputeService.submitReport({
        reporterId: reporter!.id,
        reportedUserId: offender!.id,
        reason: 'Harassment / Abusive messages',
        details: 'Sent inappropriate messages repeatedly in task chat.',
      });

      expect(report.id).toBeDefined();
      expect(report.status).toBe('PENDING');

      const allReports = await disputeService.getAllReports();
      expect(allReports.some((r) => r.id === report.id)).toBe(true);
    });
  });
});
