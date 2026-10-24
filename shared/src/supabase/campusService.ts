/**
 * PART – People At Right Time
 * Campus Community Service
 * Handles College Selection, Campus Tasks, Member Verification & Filtering
 */

import { supabase, isLiveSupabaseConfigured } from './client';
import { mockStore } from './mockStore';
import {
  College,
  UserCollegeMembership,
  CollegeMembershipStatus,
  CampusTaskVisibility,
  Task,
  Profile,
} from '../types';
import { CHENNAI_COLLEGES, CollegeDef } from '../constants/colleges';

export interface CreateCampusTaskInput {
  title: string;
  description: string;
  category_id: string;
  budget_inr: number;
  deadline?: string;
  college_id: string;
  college_name: string;
  campus_location?: string;
  visibility: CampusTaskVisibility;
  requires_verified_student?: boolean;
  file_attachment_url?: string;
  estimated_duration_minutes?: number;
}

export const campusService = {
  /**
   * Get all colleges with optional search query
   */
  async getColleges(searchQuery?: string): Promise<College[]> {
    if (isLiveSupabaseConfigured) {
      try {
        let query = supabase.from('colleges').select('*').order('name', { ascending: true });
        if (searchQuery?.trim()) {
          query = query.or(
            `name.ilike.%${searchQuery.trim()}%,short_name.ilike.%${searchQuery.trim()}%,city.ilike.%${searchQuery.trim()}%`
          );
        }
        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          return data as College[];
        }
      } catch (err) {
        console.warn('Supabase getColleges error, using mockStore:', err);
      }
    }

    // Fallback: mockStore
    if (mockStore.colleges.size === 0) {
      mockStore.reset();
    }

    let all = Array.from(mockStore.colleges.values());
    if (searchQuery?.trim()) {
      const q = searchQuery.toLowerCase().trim();
      all = all.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.short_name.toLowerCase().includes(q) ||
          c.city.toLowerCase().includes(q)
      );
    }
    return all;
  },

  /**
   * Suggest or add a college if not in the default directory
   */
  async suggestCollege(data: {
    name: string;
    city: string;
    locality?: string;
    domains?: string[];
  }): Promise<College> {
    const slug = data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const newCollege: College = {
      id: slug || `college-${Date.now()}`,
      name: data.name.trim(),
      short_name: data.name.trim().split('(')[0].trim(),
      city: data.city.trim() || 'Chennai',
      locality: data.locality?.trim() || 'Chennai',
      domains: data.domains || [],
      popular_spots: ['Main Canteen', 'Central Library', 'Hostel Mess'],
      accent_color: '#146B3A',
      badge_bg: '#DCFCE7',
      emoji: '🎓',
      is_verified: true,
      created_at: new Date().toISOString(),
    };

    if (isLiveSupabaseConfigured) {
      try {
        const { data: inserted, error } = await supabase
          .from('colleges')
          .insert(newCollege)
          .select()
          .single();
        if (!error && inserted) return inserted as College;
      } catch (err) {
        console.warn('Supabase suggestCollege error:', err);
      }
    }

    mockStore.colleges.set(newCollege.id, newCollege);
    return newCollege;
  },

  /**
   * Set user's active college membership in profile & membership table
   */
  async setUserCollege(
    userId: string,
    collegeId: string,
    collegeName: string,
    studentEmail?: string
  ): Promise<{ profile: Profile | null; error: string | null }> {
    // 1. Determine status: verified if domain matches, else self_selected
    let status: CollegeMembershipStatus = 'self_selected';
    const college = mockStore.colleges.get(collegeId) || CHENNAI_COLLEGES.find((c) => c.id === collegeId);

    if (studentEmail && college?.domains && college.domains.length > 0) {
      const emailDomain = studentEmail.split('@')[1]?.toLowerCase();
      if (emailDomain && college.domains.some((d) => emailDomain.endsWith(d.toLowerCase()))) {
        status = 'verified';
      }
    }

    if (isLiveSupabaseConfigured) {
      try {
        const { data: updatedProfile, error: profileErr } = await supabase
          .from('profiles')
          .update({
            college_id: collegeId,
            college_name: collegeName,
            college_status: status,
            student_email: studentEmail || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId)
          .select()
          .single();

        if (!profileErr && updatedProfile) {
          // Upsert membership
          await supabase.from('user_college_memberships').upsert({
            user_id: userId,
            college_id: collegeId,
            college_name: collegeName,
            status,
            student_id_or_email: studentEmail || null,
            is_active: true,
            updated_at: new Date().toISOString(),
          });

          // Sync local mockStore
          mockStore.profiles.set(userId, updatedProfile as Profile);
          return { profile: updatedProfile as Profile, error: null };
        }
      } catch (err: any) {
        console.warn('Supabase setUserCollege error:', err);
      }
    }

    // Local fallback
    const p = mockStore.profiles.get(userId);
    if (p) {
      p.college_id = collegeId;
      p.college_name = collegeName;
      p.college_status = status;
      if (studentEmail) p.student_email = studentEmail;
      p.updated_at = new Date().toISOString();
      mockStore.profiles.set(userId, p);

      const mem: UserCollegeMembership = {
        id: `mem-${userId}-${collegeId}`,
        user_id: userId,
        college_id: collegeId,
        college_name: collegeName,
        status,
        student_id_or_email: studentEmail || null,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      mockStore.collegeMemberships.set(mem.id, mem);

      return { profile: { ...p }, error: null };
    }

    return { profile: null, error: 'User profile not found' };
  },

  /**
   * Verify student with official college email (e.g. name@velsuniv.ac.in)
   */
  async verifyCollegeEmail(
    userId: string,
    studentEmail: string,
    collegeId: string
  ): Promise<{ success: boolean; error?: string }> {
    const college = mockStore.colleges.get(collegeId) || CHENNAI_COLLEGES.find((c) => c.id === collegeId);
    if (!college) {
      return { success: false, error: 'College not recognized' };
    }

    const emailDomain = studentEmail.split('@')[1]?.toLowerCase().trim();
    if (!emailDomain) {
      return { success: false, error: 'Please enter a valid email address.' };
    }

    const isMatch = college.domains.some((d) => emailDomain === d || emailDomain.endsWith(`.${d}`));
    if (!isMatch) {
      return {
        success: false,
        error: `Email domain (@${emailDomain}) does not match ${college.short_name} (${college.domains.join(', ')}).`,
      };
    }

    await this.setUserCollege(userId, college.id, college.short_name, studentEmail);
    return { success: true };
  },

  /**
   * Fetch campus tasks for a college or nearby students
   */
  async getCampusTasks(filters?: {
    collegeId?: string;
    categoryId?: string;
    sort?: 'latest' | 'highest_reward' | 'nearest';
    searchQuery?: string;
    visibility?: 'COLLEGE_ONLY' | 'EVERYONE_NEARBY';
    userStatus?: CollegeMembershipStatus;
  }): Promise<Task[]> {
    // Ensure sample tasks are seeded if empty
    this.ensureSampleCampusTasks();

    if (isLiveSupabaseConfigured) {
      try {
        let query = supabase.from('tasks').select('*, requester:profiles(*), location:task_locations(*), category:task_categories(*)').eq('is_campus_task', true);

        if (filters?.collegeId) {
          query = query.eq('college_id', filters.collegeId);
        }

        if (filters?.categoryId && filters.categoryId !== 'all') {
          query = query.eq('category_id', filters.categoryId);
        }

        if (filters?.searchQuery?.trim()) {
          query = query.ilike('title', `%${filters.searchQuery.trim()}%`);
        }

        if (filters?.sort === 'highest_reward') {
          query = query.order('budget_inr', { ascending: false });
        } else {
          query = query.order('created_at', { ascending: false });
        }

        const { data, error } = await query;
        if (!error && data) {
          return data as Task[];
        }
      } catch (err) {
        console.warn('Supabase getCampusTasks error, fallback to mockStore:', err);
      }
    }

    // Local mockStore query
    let tasks = Array.from(mockStore.tasks.values()).filter((t) => t.is_campus_task);

    // Filter by college
    if (filters?.collegeId) {
      tasks = tasks.filter(
        (t) =>
          t.college_id === filters.collegeId ||
          (t.visibility === 'EVERYONE_NEARBY' && (!t.requires_verified_student || filters.userStatus === 'verified'))
      );
    }

    // Filter by category
    if (filters?.categoryId && filters.categoryId !== 'all') {
      tasks = tasks.filter((t) => t.category_id === filters.categoryId);
    }

    // Filter by search query
    if (filters?.searchQuery?.trim()) {
      const q = filters.searchQuery.toLowerCase().trim();
      tasks = tasks.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.campus_location?.toLowerCase().includes(q)
      );
    }

    // Verified membership restriction
    if (filters?.userStatus !== 'verified') {
      tasks = tasks.filter((t) => !t.requires_verified_student);
    }

    // Sorting
    if (filters?.sort === 'highest_reward') {
      tasks.sort((a, b) => b.budget_inr - a.budget_inr);
    } else {
      tasks.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    return tasks.map((t) => ({
      ...t,
      requester: mockStore.profiles.get(t.requester_id) || t.requester,
    }));
  },

  /**
   * Create a campus community task
   */
  async createCampusTask(
    data: CreateCampusTaskInput,
    requesterId: string
  ): Promise<{ task: Task | null; error: string | null }> {
    // Academic honesty check
    const forbiddenKeywords = [
      'exam proxy',
      'write my exam',
      'take my test',
      'assignment cheating',
      'copy exam',
      'impersonation',
    ];
    const textToCheck = `${data.title} ${data.description}`.toLowerCase();
    for (const kw of forbiddenKeywords) {
      if (textToCheck.includes(kw)) {
        return {
          task: null,
          error: 'Task violates academic integrity guidelines. Dishonest coursework or exam completion is prohibited on PART.',
        };
      }
    }

    const taskId = `task-campus-${Date.now()}`;
    const newTask: Task = {
      id: taskId,
      requester_id: requesterId,
      category_id: data.category_id || 'college-student-tasks',
      title: data.title.trim(),
      description: data.description.trim(),
      budget_inr: data.budget_inr,
      estimated_duration_minutes: data.estimated_duration_minutes || 45,
      preferred_date: data.deadline || new Date().toISOString().split('T')[0],
      deadline: data.deadline || null,
      required_workers_count: 1,
      assigned_workers_count: 0,
      required_skills: [],
      status: 'OPEN',
      is_campus_task: true,
      college_id: data.college_id,
      college_name: data.college_name,
      campus_location: data.campus_location || 'Campus Center',
      visibility: data.visibility || 'COLLEGE_ONLY',
      requires_verified_student: data.requires_verified_student || false,
      file_attachment_url: data.file_attachment_url || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isLiveSupabaseConfigured) {
      try {
        const { data: created, error } = await supabase
          .from('tasks')
          .insert(newTask)
          .select()
          .single();
        if (!error && created) {
          mockStore.tasks.set(created.id, created as Task);
          return { task: created as Task, error: null };
        }
      } catch (err: any) {
        console.warn('Supabase createCampusTask error:', err);
      }
    }

    mockStore.tasks.set(newTask.id, newTask);
    return { task: newTask, error: null };
  },

  /**
   * Pre-seed realistic campus tasks for VELS University & other colleges
   */
  ensureSampleCampusTasks() {
    const existingCampusTasks = Array.from(mockStore.tasks.values()).filter((t) => t.is_campus_task);
    if (existingCampusTasks.length > 0) return;

    // Create a mock campus requester profile if not existing
    const sampleRequesterId = 'user-vels-poster-1';
    if (!mockStore.profiles.has(sampleRequesterId)) {
      mockStore.profiles.set(sampleRequesterId, {
        id: sampleRequesterId,
        full_name: 'Ananya Ramesh',
        email: 'ananya.r@velsuniv.ac.in',
        phone: '+91 98401 23456',
        preferred_language: 'en',
        city: 'Chennai',
        general_location: 'VELS University, Pallavaram',
        college_id: 'vels-university',
        college_name: 'VELS University',
        college_status: 'verified',
        student_email: 'ananya.r@velsuniv.ac.in',
        is_admin: false,
        is_worker_available: true,
        verification_status: 'verified',
        rating_as_worker: 4.9,
        total_reviews_as_worker: 8,
        completed_tasks_as_worker: 8,
        rating_as_requester: 5.0,
        total_reviews_as_requester: 12,
        completed_tasks_as_requester: 12,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    const sampleTasks: Array<Partial<Task>> = [
      {
        id: 'campus-vels-1',
        requester_id: sampleRequesterId,
        category_id: 'ppt_design',
        title: 'Need help preparing a PPT',
        description: 'Need clean, well-formatted 10 slides for our Green Energy seminar. Content and outline already drafted in Word, just need clean typography & layout.',
        budget_inr: 150,
        estimated_duration_minutes: 60,
        preferred_date: new Date().toISOString().split('T')[0],
        deadline: 'Today, 5:00 PM',
        required_workers_count: 1,
        assigned_workers_count: 0,
        required_skills: ['PowerPoint', 'Canva'],
        status: 'OPEN',
        is_campus_task: true,
        college_id: 'vels-university',
        college_name: 'VELS University',
        campus_location: 'Central Library, 2nd Floor',
        visibility: 'COLLEGE_ONLY',
        requires_verified_student: false,
        created_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(), // 25 mins ago
        updated_at: new Date().toISOString(),
      },
      {
        id: 'campus-vels-2',
        requester_id: sampleRequesterId,
        category_id: 'notes_printing',
        title: 'Need notes printed',
        description: 'Need 30 pages of Unit 3 Machine Learning lecture notes printed double-sided and stapled from the Xerox shop outside campus gate.',
        budget_inr: 50,
        estimated_duration_minutes: 20,
        preferred_date: new Date().toISOString().split('T')[0],
        deadline: 'Today, 2:30 PM',
        required_workers_count: 1,
        assigned_workers_count: 0,
        required_skills: ['Delivery', 'Quick Pickup'],
        status: 'OPEN',
        is_campus_task: true,
        college_id: 'vels-university',
        college_name: 'VELS University',
        campus_location: 'Main Canteen Ground Floor',
        visibility: 'COLLEGE_ONLY',
        requires_verified_student: false,
        created_at: new Date(Date.now() - 40 * 60 * 1000).toISOString(), // 40 mins ago
        updated_at: new Date().toISOString(),
      },
      {
        id: 'campus-vels-3',
        requester_id: sampleRequesterId,
        category_id: 'tutoring_coding',
        title: 'Need help understanding Java',
        description: 'Struggling with Java Multithreading & Exception Handling concepts for internal exams tomorrow. Need 45 mins doubt clearing peer session.',
        budget_inr: 200,
        estimated_duration_minutes: 45,
        preferred_date: new Date().toISOString().split('T')[0],
        deadline: 'This Evening, 6:00 PM',
        required_workers_count: 1,
        assigned_workers_count: 0,
        required_skills: ['Java', 'Object Oriented Programming'],
        status: 'OPEN',
        is_campus_task: true,
        college_id: 'vels-university',
        college_name: 'VELS University',
        campus_location: 'Engineering Block Lab 3',
        visibility: 'COLLEGE_ONLY',
        requires_verified_student: false,
        created_at: new Date(Date.now() - 75 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'campus-vels-4',
        requester_id: sampleRequesterId,
        category_id: 'ppt_design',
        title: 'Need poster design',
        description: 'Design an energetic A3 poster for our departmental sports meet (Cricket & Football tournament). College logos will be provided.',
        budget_inr: 300,
        estimated_duration_minutes: 90,
        preferred_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        deadline: 'Tomorrow, 12:00 PM',
        required_workers_count: 1,
        assigned_workers_count: 0,
        required_skills: ['Photoshop', 'Canva', 'Poster Design'],
        status: 'OPEN',
        is_campus_task: true,
        college_id: 'vels-university',
        college_name: 'VELS University',
        campus_location: 'Student Activity Center',
        visibility: 'COLLEGE_ONLY',
        requires_verified_student: false,
        created_at: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'campus-vels-5',
        requester_id: sampleRequesterId,
        category_id: 'event_help',
        title: 'Need assistance with an event',
        description: 'Need 2 students to help set up the registration desk, distribute badges, and test microphone sound setup for our Tech Fest in the Auditorium.',
        budget_inr: 500,
        estimated_duration_minutes: 120,
        preferred_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        deadline: 'Tomorrow, 9:00 AM',
        required_workers_count: 2,
        assigned_workers_count: 0,
        required_skills: ['Coordination', 'Event Assistance'],
        status: 'OPEN',
        is_campus_task: true,
        college_id: 'vels-university',
        college_name: 'VELS University',
        campus_location: 'Main Auditorium Foyer',
        visibility: 'EVERYONE_NEARBY',
        requires_verified_student: false,
        created_at: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'campus-vels-6',
        requester_id: sampleRequesterId,
        category_id: 'materials_errands',
        title: 'Need help collecting materials',
        description: 'Pick up 5 sheets of mount board and acrylic colors from Pallavaram stationery store and deliver to Chemistry lab.',
        budget_inr: 100,
        estimated_duration_minutes: 30,
        preferred_date: new Date().toISOString().split('T')[0],
        deadline: 'Today, 3:30 PM',
        required_workers_count: 1,
        assigned_workers_count: 0,
        required_skills: ['Errands', 'Pickup'],
        status: 'OPEN',
        is_campus_task: true,
        college_id: 'vels-university',
        college_name: 'VELS University',
        campus_location: 'Pharmacy Block Gate',
        visibility: 'COLLEGE_ONLY',
        requires_verified_student: false,
        created_at: new Date(Date.now() - 210 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      },
      // Anna University Sample
      {
        id: 'campus-anna-1',
        requester_id: sampleRequesterId,
        category_id: 'tutoring_coding',
        title: 'Need help understanding Python Pandas',
        description: 'Need guidance structuring dataframe filtering and groupby operations for mini data analysis project.',
        budget_inr: 250,
        estimated_duration_minutes: 45,
        preferred_date: new Date().toISOString().split('T')[0],
        deadline: 'Today, 6:00 PM',
        required_workers_count: 1,
        assigned_workers_count: 0,
        required_skills: ['Python', 'Pandas'],
        status: 'OPEN',
        is_campus_task: true,
        college_id: 'anna-university',
        college_name: 'Anna University',
        campus_location: 'CEG Red Building Quadrangle',
        visibility: 'COLLEGE_ONLY',
        requires_verified_student: false,
        created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      },
      // SRM University Sample
      {
        id: 'campus-srm-1',
        requester_id: sampleRequesterId,
        category_id: 'ppt_design',
        title: 'Pitch Deck Slide Polishing',
        description: 'Polish 8 slides for college startup incubator pitch. Looking for clean dark mode design in Canva or Figma.',
        budget_inr: 350,
        estimated_duration_minutes: 60,
        preferred_date: new Date().toISOString().split('T')[0],
        deadline: 'Tonight, 8:00 PM',
        required_workers_count: 1,
        assigned_workers_count: 0,
        required_skills: ['Figma', 'Pitch Deck'],
        status: 'OPEN',
        is_campus_task: true,
        college_id: 'srm-university',
        college_name: 'SRM University',
        campus_location: 'Tech Park 5th Floor',
        visibility: 'COLLEGE_ONLY',
        requires_verified_student: false,
        created_at: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    sampleTasks.forEach((t) => {
      mockStore.tasks.set(t.id!, t as Task);
    });
  },
};
