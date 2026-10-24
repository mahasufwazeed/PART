import { describe, it, expect, beforeEach } from 'vitest';
import {
  campusService,
  mockStore,
  CHENNAI_COLLEGES,
  CAMPUS_TASK_CATEGORIES,
  Profile,
  chatService,
} from '@part/shared';

describe('Campus Community Feature Tests', () => {
  const mockStudent1: Profile = {
    id: 'student-vels-1',
    full_name: 'Kavitha Sundaram',
    email: 'kavitha@gmail.com',
    phone: '+91 98401 11222',
    preferred_language: 'en',
    city: 'Chennai',
    general_location: 'VELS University, Pallavaram',
    college_id: 'vels-university',
    college_name: 'VELS University',
    college_status: 'self_selected',
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

  const mockStudent2: Profile = {
    id: 'student-vels-2',
    full_name: 'Rohan Sharma',
    email: 'rohan.s@velsuniv.ac.in',
    phone: '+91 98401 33444',
    preferred_language: 'en',
    city: 'Chennai',
    general_location: 'Pallavaram, Chennai',
    college_id: 'vels-university',
    college_name: 'VELS University',
    college_status: 'verified',
    student_email: 'rohan.s@velsuniv.ac.in',
    is_admin: false,
    is_worker_available: true,
    verification_status: 'verified',
    rating_as_worker: 4.8,
    total_reviews_as_worker: 4,
    completed_tasks_as_worker: 4,
    rating_as_requester: 5.0,
    total_reviews_as_requester: 2,
    completed_tasks_as_requester: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  beforeEach(() => {
    mockStore.reset();
    mockStore.profiles.set(mockStudent1.id, { ...mockStudent1 });
    mockStore.profiles.set(mockStudent2.id, { ...mockStudent2 });
    campusService.ensureSampleCampusTasks();
  });

  describe('1. College Selection & Directory', () => {
    it('returns default Chennai universities (VELS, Anna University, SRM, Sathyabama)', async () => {
      const colleges = await campusService.getColleges();
      expect(colleges.length).toBeGreaterThanOrEqual(4);

      const vels = colleges.find((c) => c.id === 'vels-university');
      expect(vels).toBeDefined();
      expect(vels?.short_name).toBe('VELS University');
      expect(vels?.domains).toContain('velsuniv.ac.in');

      const anna = colleges.find((c) => c.id === 'anna-university');
      expect(anna).toBeDefined();

      const srm = colleges.find((c) => c.id === 'srm-university');
      expect(srm).toBeDefined();

      const sathyabama = colleges.find((c) => c.id === 'sathyabama-university');
      expect(sathyabama).toBeDefined();
    });

    it('filters colleges using searchable query', async () => {
      const searchResult = await campusService.getColleges('srm');
      expect(searchResult.length).toBeGreaterThan(0);
      expect(searchResult[0].short_name).toContain('SRM');
    });

    it('allows students to suggest and immediately add unlisted colleges without admin approval', async () => {
      const custom = await campusService.suggestCollege({
        name: 'St. Joseph College of Engineering',
        city: 'Chennai',
        locality: 'OMR',
      });

      expect(custom.id).toBeDefined();
      expect(custom.name).toBe('St. Joseph College of Engineering');

      const updatedList = await campusService.getColleges('Joseph');
      expect(updatedList.some((c) => c.id === custom.id)).toBe(true);
    });

    it('stores selected college in user profile and memberships map', async () => {
      const { profile, error } = await campusService.setUserCollege(
        mockStudent1.id,
        'anna-university',
        'Anna University'
      );

      expect(error).toBeNull();
      expect(profile?.college_id).toBe('anna-university');
      expect(profile?.college_name).toBe('Anna University');
      expect(profile?.college_status).toBe('self_selected');

      const storedProfile = mockStore.profiles.get(mockStudent1.id);
      expect(storedProfile?.college_id).toBe('anna-university');
    });
  });

  describe('2. Campus Tasks Discovery & Filtering', () => {
    it('shows tasks associated with VELS University when selected', async () => {
      const tasks = await campusService.getCampusTasks({
        collegeId: 'vels-university',
      });

      expect(tasks.length).toBeGreaterThanOrEqual(4);
      tasks.forEach((t) => {
        expect(t.is_campus_task).toBe(true);
        expect(t.college_id === 'vels-university' || t.visibility === 'EVERYONE_NEARBY').toBe(true);
      });

      // Verify specific user example tasks are present
      const titles = tasks.map((t) => t.title.toLowerCase());
      expect(titles.some((t) => t.includes('ppt'))).toBe(true);
      expect(titles.some((t) => t.includes('notes printed'))).toBe(true);
      expect(titles.some((t) => t.includes('java'))).toBe(true);
      expect(titles.some((t) => t.includes('poster design'))).toBe(true);
      expect(titles.some((t) => t.includes('assistance with an event'))).toBe(true);
      expect(titles.some((t) => t.includes('materials'))).toBe(true);
    });

    it('filters campus tasks by category (e.g. notes_printing or ppt_design)', async () => {
      const printingTasks = await campusService.getCampusTasks({
        collegeId: 'vels-university',
        categoryId: 'notes_printing',
      });

      expect(printingTasks.length).toBeGreaterThan(0);
      printingTasks.forEach((t) => {
        expect(t.category_id).toBe('notes_printing');
      });
    });

    it('sorts campus tasks by highest reward', async () => {
      const tasks = await campusService.getCampusTasks({
        collegeId: 'vels-university',
        sort: 'highest_reward',
      });

      expect(tasks.length).toBeGreaterThanOrEqual(2);
      for (let i = 0; i < tasks.length - 1; i++) {
        expect(tasks[i].budget_inr).toBeGreaterThanOrEqual(tasks[i + 1].budget_inr);
      }
    });
  });

  describe('3. Post Campus Task & Academic Integrity', () => {
    it('creates a campus task with pre-selected college and visibility', async () => {
      const { task, error } = await campusService.createCampusTask(
        {
          title: 'Need help collecting lab chart paper',
          description: 'Need 3 chart papers delivered to Chemistry Lab Block B by 3 PM.',
          category_id: 'materials_errands',
          budget_inr: 80,
          college_id: 'vels-university',
          college_name: 'VELS University',
          campus_location: 'Chemistry Lab Block B',
          visibility: 'COLLEGE_ONLY',
        },
        mockStudent1.id
      );

      expect(error).toBeNull();
      expect(task).toBeDefined();
      expect(task?.is_campus_task).toBe(true);
      expect(task?.college_id).toBe('vels-university');
      expect(task?.visibility).toBe('COLLEGE_ONLY');
      expect(task?.budget_inr).toBe(80);
    });

    it('enforces academic integrity and rejects dishonest exam/coursework completion', async () => {
      const { task, error } = await campusService.createCampusTask(
        {
          title: 'Exam proxy needed for tomorrow test',
          description: 'Need someone to write my exam test for me.',
          category_id: 'tutoring_coding',
          budget_inr: 1000,
          college_id: 'vels-university',
          college_name: 'VELS University',
          visibility: 'COLLEGE_ONLY',
        },
        mockStudent1.id
      );

      expect(task).toBeNull();
      expect(error).toContain('academic integrity');
    });
  });

  describe('4. Campus Chat & Authorized Participation', () => {
    it('creates conversation between student requester and accepted helper', async () => {
      const { task } = await campusService.createCampusTask(
        {
          title: 'Need notes printed from stationery shop',
          description: 'Need 20 pages printed double-sided and brought to main canteen.',
          category_id: 'notes_printing',
          budget_inr: 50,
          college_id: 'vels-university',
          college_name: 'VELS University',
          campus_location: 'Main Canteen',
          visibility: 'COLLEGE_ONLY',
        },
        mockStudent1.id
      );

      expect(task).toBeDefined();

      const conv = await chatService.getOrCreateTaskConversation(
        task!.id,
        mockStudent1.id,
        mockStudent2.id
      );

      expect(conv.id).toBeDefined();
      expect(conv.task_id).toBe(task!.id);

      // Send text message
      const msg = await chatService.sendMessage(
        conv.id,
        mockStudent1.id,
        'Hi Rohan, I left the notes file in the chat!'
      );
      expect(msg.content).toContain('notes file');

      // Send image message
      const imgMsg = await chatService.sendMessage(
        conv.id,
        mockStudent2.id,
        '[IMAGE:data:image/png;base64,sample]\nI printed the pages!'
      );
      expect(imgMsg.content).toContain('[IMAGE:');
    });
  });

  describe('5. College Switching & Student Verification', () => {
    it('verifies student membership when official domain matches (velsuniv.ac.in)', async () => {
      const res = await campusService.verifyCollegeEmail(
        mockStudent1.id,
        'kavitha.s@velsuniv.ac.in',
        'vels-university'
      );

      expect(res.success).toBe(true);

      const profile = mockStore.profiles.get(mockStudent1.id);
      expect(profile?.college_status).toBe('verified');
      expect(profile?.student_email).toBe('kavitha.s@velsuniv.ac.in');
    });

    it('rejects verification if email domain does not match college', async () => {
      const res = await campusService.verifyCollegeEmail(
        mockStudent1.id,
        'kavitha@gmail.com',
        'vels-university'
      );

      expect(res.success).toBe(false);
      expect(res.error).toContain('does not match');
    });

    it('allows switching college to Anna University', async () => {
      await campusService.setUserCollege(
        mockStudent1.id,
        'anna-university',
        'Anna University'
      );

      const updated = mockStore.profiles.get(mockStudent1.id);
      expect(updated?.college_id).toBe('anna-university');
      expect(updated?.college_name).toBe('Anna University');
    });
  });
});
