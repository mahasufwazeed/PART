import { supabase, isLiveSupabaseConfigured } from './client';
import { mockStore } from './mockStore';
import {
  Task,
  TaskLocation,
  TaskApplication,
  TaskAssignment,
  TaskStatus,
  TaskCompletionEvidence,
} from '../types';
import { CreateTaskInput } from '../schemas';
import { TASK_CATEGORIES } from '../constants/categories';
import { calculateHaversineDistanceKm } from '../utils/geo';
import {
  canTransitionTask,
  assertValidTaskTransition,
  canAcceptApplications,
} from '../utils/stateMachine';
import { disputeService } from './disputeService';
import { notificationService } from './notificationService';

export const taskService = {
  /**
   * Create a new task with geospatial location
   */
  async createTask(
    requesterId: string,
    input: CreateTaskInput
  ): Promise<{ task: Task; error?: string }> {
    if (isLiveSupabaseConfigured) {
      const { data: taskData, error: taskError } = await supabase
        .from('tasks')
        .insert({
          requester_id: requesterId,
          category_id: input.category_id,
          title: input.title,
          description: input.description,
          budget_inr: input.budget_inr,
          estimated_duration_minutes: input.estimated_duration_minutes,
          preferred_date: input.preferred_date,
          preferred_time_window: input.preferred_time_window,
          required_workers_count: input.required_workers_count,
          assigned_workers_count: 0,
          required_skills: input.required_skills,
          special_instructions: input.special_instructions,
          status: 'OPEN',
        })
        .select()
        .single();

      if (taskError) {
        if (!taskError.message.includes('Could not find the table') && taskError.code !== 'PGRST204') {
          return { task: null as any, error: taskError.message };
        }
        // Fall back to local store if tables are not yet migrated on remote Supabase
      } else {
        const { error: locError } = await supabase.from('task_locations').insert({
          task_id: taskData.id,
          city: input.city,
          locality: input.locality,
          address_approximate: input.address_approximate,
          address_exact: input.address_exact,
          latitude: input.latitude,
          longitude: input.longitude,
          postal_code: input.postal_code,
        });

        if (locError && !locError.message.includes('Could not find the table')) {
          return { task: null as any, error: locError.message };
        }

        return { task: taskData as Task };
      }
    }

    // Local Sandbox Store execution
    const taskId = `task-${Date.now()}`;
    const newTask: Task = {
      id: taskId,
      requester_id: requesterId,
      category_id: input.category_id,
      title: input.title,
      description: input.description,
      budget_inr: input.budget_inr,
      estimated_duration_minutes: input.estimated_duration_minutes,
      preferred_date: input.preferred_date,
      preferred_time_window: input.preferred_time_window,
      required_workers_count: input.required_workers_count,
      assigned_workers_count: 0,
      required_skills: input.required_skills,
      special_instructions: input.special_instructions,
      status: 'OPEN',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const newLoc: TaskLocation = {
      id: `loc-${Date.now()}`,
      task_id: taskId,
      city: input.city,
      locality: input.locality,
      address_approximate: input.address_approximate,
      address_exact: input.address_exact,
      latitude: input.latitude,
      longitude: input.longitude,
      postal_code: input.postal_code,
      created_at: new Date().toISOString(),
    };

    mockStore.tasks.set(taskId, newTask);
    mockStore.locations.set(taskId, newLoc);

    return { task: newTask };
  },

  /**
   * Search nearby tasks using geospatial coordinates and distance filters
   */
  async getNearbyTasks(params: {
    latitude: number;
    longitude: number;
    radiusKm?: number;
    categoryId?: string;
    minBudget?: number;
    maxBudget?: number;
    searchQuery?: string;
  }): Promise<Task[]> {
    const {
      latitude,
      longitude,
      radiusKm = 20,
      categoryId,
      minBudget = 0,
      maxBudget = 100000,
      searchQuery = '',
    } = params;

    if (isLiveSupabaseConfigured) {
      const { data, error } = await supabase.rpc('get_nearby_tasks', {
        p_user_lat: latitude,
        p_user_lng: longitude,
        p_radius_km: radiusKm,
        p_category_id: categoryId || null,
        p_min_budget: minBudget,
        p_max_budget: maxBudget,
      });

      if (!error && data) {
        return data.map((row: any) => ({
          id: row.task_id,
          requester_id: row.requester_id,
          category_id: row.category_id,
          title: row.title,
          description: row.description,
          budget_inr: row.budget_inr,
          estimated_duration_minutes: row.estimated_duration_minutes,
          preferred_date: row.preferred_date,
          preferred_time_window: row.preferred_time_window,
          required_workers_count: row.required_workers_count,
          assigned_workers_count: row.assigned_workers_count,
          required_skills: [],
          status: row.status,
          created_at: row.created_at,
          updated_at: row.created_at,
          distance_km: row.distance_km,
          category: {
            id: row.category_id,
            name_en: row.category_name_en,
            name_ta: row.category_name_ta,
            icon: row.category_icon,
          } as any,
          location: {
            locality: row.locality,
            address_approximate: row.address_approximate,
            latitude: row.latitude,
            longitude: row.longitude,
          } as any,
          requester: {
            id: row.requester_id,
            full_name: row.requester_name,
            rating_as_requester: row.requester_rating,
          } as any,
        }));
      }
    }

    // Local Sandbox geospatial filtering
    const results: Task[] = [];
    for (const [id, task] of mockStore.tasks.entries()) {
      if (task.status !== 'OPEN') continue;
      if (categoryId && task.category_id !== categoryId) continue;
      if (task.budget_inr < minBudget || task.budget_inr > maxBudget) continue;
      if (
        searchQuery &&
        !task.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !task.description.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        continue;
      }

      const loc = mockStore.locations.get(id);
      if (!loc) continue;

      const distance = calculateHaversineDistanceKm(
        latitude,
        longitude,
        loc.latitude,
        loc.longitude
      );

      if (distance <= radiusKm) {
        const cat = TASK_CATEGORIES.find((c) => c.id === task.category_id);
        const requester = mockStore.profiles.get(task.requester_id);

        results.push({
          ...task,
          distance_km: distance,
          category: cat as any,
          location: {
            ...loc,
            // Mask exact address publicly
            address_exact: null,
          },
          requester,
        });
      }
    }

    return results.sort((a, b) => (a.distance_km || 0) - (b.distance_km || 0));
  },

  /**
   * Get single task details with safe address privacy
   */
  async getTaskById(
    taskId: string,
    currentUserId?: string
  ): Promise<{
    task: Task | null;
    applications: TaskApplication[];
    assignments: TaskAssignment[];
    isRequester: boolean;
    isAssignedWorker: boolean;
  }> {
    const task = mockStore.tasks.get(taskId);
    if (!task) {
      return {
        task: null,
        applications: [],
        assignments: [],
        isRequester: false,
        isAssignedWorker: false,
      };
    }

    const loc = mockStore.locations.get(taskId);
    const cat = TASK_CATEGORIES.find((c) => c.id === task.category_id);
    const requester = mockStore.profiles.get(task.requester_id);

    // Check permissions for exact address disclosure
    const isRequester = currentUserId === task.requester_id;
    const assignments = Array.from(mockStore.assignments.values()).filter(
      (a) => a.task_id === taskId
    );
    const isAssignedWorker = assignments.some(
      (a) => a.worker_id === currentUserId
    );

    const safeLocation: TaskLocation = loc
      ? {
          ...loc,
          // Exact address is ONLY disclosed to requester or the assigned worker!
          address_exact: isRequester || isAssignedWorker ? loc.address_exact : null,
        }
      : (null as any);

    const applications = Array.from(mockStore.applications.values())
      .filter((app) => app.task_id === taskId)
      .map((app) => ({
        ...app,
        worker: mockStore.profiles.get(app.worker_id),
      }));

    const enrichedAssignments = assignments.map((a) => ({
      ...a,
      worker: mockStore.profiles.get(a.worker_id),
    }));

    return {
      task: {
        ...task,
        category: cat as any,
        location: safeLocation,
        requester,
      },
      applications: isRequester ? applications : applications.filter(a => a.worker_id === currentUserId),
      assignments: enrichedAssignments,
      isRequester,
      isAssignedWorker,
    };
  },

  /**
   * Apply for a task as a worker
   */
  async applyForTask(
    taskId: string,
    workerId: string,
    pitchMessage?: string
  ): Promise<{ application: TaskApplication; error?: string }> {
    const task = mockStore.tasks.get(taskId);
    if (!task) return { application: null as any, error: 'Task not found' };

    if (task.requester_id === workerId) {
      return {
        application: null as any,
        error: 'You cannot apply to your own task',
      };
    }

    if (!canAcceptApplications(task.status, task.assigned_workers_count, task.required_workers_count)) {
      return {
        application: null as any,
        error: 'This task is no longer accepting applications',
      };
    }

    // Check duplicate application
    const existing = Array.from(mockStore.applications.values()).find(
      (a) => a.task_id === taskId && a.worker_id === workerId
    );
    if (existing) {
      return {
        application: null as any,
        error: 'You have already applied for this task',
      };
    }

    // Check if communication is blocked
    const isBlocked = await disputeService.isUserBlocked(workerId, task.requester_id);
    if (isBlocked) {
      return {
        application: null as any,
        error: 'Unable to apply: communication between these users is restricted.',
      };
    }

    const newApp: TaskApplication = {
      id: `app-${Date.now()}`,
      task_id: taskId,
      worker_id: workerId,
      pitch_message: pitchMessage || null,
      status: 'applied',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    mockStore.applications.set(newApp.id, newApp);

    // Dispatch notification to task requester
    const worker = mockStore.profiles.get(workerId);
    await notificationService.createNotification({
      userId: task.requester_id,
      title: 'New Task Application',
      body: `${worker?.full_name || 'A nearby worker'} applied for "${task.title}".`,
      eventType: 'TASK_APPLICATION',
      referenceType: 'task',
      referenceId: taskId,
    });

    return { application: newApp };
  },

  /**
   * Requester selects and assigns worker to task
   */
  async assignWorker(
    taskId: string,
    workerId: string,
    applicationId?: string,
    requesterId?: string
  ): Promise<{ assignment: TaskAssignment; error?: string }> {
    const task = mockStore.tasks.get(taskId);
    if (!task) return { assignment: null as any, error: 'Task not found' };

    if (requesterId && task.requester_id !== requesterId) {
      return {
        assignment: null as any,
        error: 'Only the task requester can select a worker',
      };
    }

    if (task.assigned_workers_count >= task.required_workers_count) {
      return {
        assignment: null as any,
        error: 'Task has reached required worker capacity',
      };
    }

    const assignmentId = `asgn-${Date.now()}`;
    const newAssignment: TaskAssignment = {
      id: assignmentId,
      task_id: taskId,
      worker_id: workerId,
      application_id: applicationId || null,
      status: 'assigned',
      agreed_rate_inr: task.budget_inr,
      assigned_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    mockStore.assignments.set(assignmentId, newAssignment);

    // Update application status
    if (applicationId) {
      const app = mockStore.applications.get(applicationId);
      if (app) {
        app.status = 'accepted';
      }
    }

    // Transition task state to ASSIGNED
    assertValidTaskTransition(task.status, 'ASSIGNED');
    task.status = 'ASSIGNED';
    task.assigned_workers_count += 1;
    task.updated_at = new Date().toISOString();

    // Create or find conversation
    let conv = Array.from(mockStore.conversations.values()).find(
      (c) => c.task_id === taskId
    );
    if (!conv) {
      conv = {
        id: `conv-${Date.now()}`,
        task_id: taskId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      mockStore.conversations.set(conv.id, conv);
    }

    // Dispatch notification to selected worker
    await notificationService.createNotification({
      userId: workerId,
      title: 'Application Accepted! 🎉',
      body: `You were selected for "${task.title}". Tap to view task details and open chat.`,
      eventType: 'TASK_ASSIGNED',
      referenceType: 'task',
      referenceId: taskId,
    });

    return { assignment: newAssignment };
  },

  /**
   * Start task execution (ASSIGNED -> IN_PROGRESS)
   */
  async startTask(
    taskId: string,
    workerId: string
  ): Promise<{ success: boolean; error?: string }> {
    const task = mockStore.tasks.get(taskId);
    if (!task) return { success: false, error: 'Task not found' };

    assertValidTaskTransition(task.status, 'IN_PROGRESS');
    task.status = 'IN_PROGRESS';
    task.updated_at = new Date().toISOString();

    const assignment = Array.from(mockStore.assignments.values()).find(
      (a) => a.task_id === taskId && a.worker_id === workerId
    );
    if (assignment) {
      assignment.status = 'in_progress';
      assignment.started_at = new Date().toISOString();
    }

    return { success: true };
  },

  /**
   * Submit completion evidence (IN_PROGRESS -> COMPLETION_SUBMITTED)
   */
  async submitCompletion(
    taskId: string,
    assignmentId: string,
    workerId: string,
    notes: string,
    photoUrls: string[] = []
  ): Promise<{ success: boolean; error?: string }> {
    const task = mockStore.tasks.get(taskId);
    if (!task) return { success: false, error: 'Task not found' };

    assertValidTaskTransition(task.status, 'COMPLETION_SUBMITTED');
    task.status = 'COMPLETION_SUBMITTED';
    task.updated_at = new Date().toISOString();

    const assignment = mockStore.assignments.get(assignmentId);
    if (assignment) {
      assignment.status = 'completion_submitted';
      assignment.completed_at = new Date().toISOString();
    }

    // Dispatch notification to requester
    await notificationService.createNotification({
      userId: task.requester_id,
      title: 'Completion Submitted',
      body: `Worker has submitted completion evidence for "${task.title}". Please review and confirm.`,
      eventType: 'COMPLETION_SUBMITTED',
      referenceType: 'task',
      referenceId: taskId,
    });

    return { success: true };
  },

  /**
   * Requester confirms task completion (COMPLETION_SUBMITTED -> COMPLETED)
   */
  async confirmCompletion(
    taskId: string,
    requesterId: string
  ): Promise<{ success: boolean; error?: string }> {
    const task = mockStore.tasks.get(taskId);
    if (!task) return { success: false, error: 'Task not found' };

    if (task.requester_id !== requesterId) {
      return { success: false, error: 'Only the requester can confirm completion' };
    }

    assertValidTaskTransition(task.status, 'COMPLETED');
    task.status = 'COMPLETED';
    task.updated_at = new Date().toISOString();

    // Mark assignments completed
    for (const [id, asgn] of mockStore.assignments.entries()) {
      if (asgn.task_id === taskId) {
        asgn.status = 'completed';

        // Dispatch notification to worker
        await notificationService.createNotification({
          userId: asgn.worker_id,
          title: 'Task Completed & Confirmed! 💰',
          body: `Requester confirmed completion of "${task.title}". Payment is ready.`,
          eventType: 'TASK_COMPLETED',
          referenceType: 'task',
          referenceId: taskId,
        });
      }
    }

    return { success: true };
  },

  /**
   * Cancel task
   */
  async cancelTask(
    taskId: string,
    userId: string,
    reason?: string
  ): Promise<{ success: boolean; error?: string }> {
    const task = mockStore.tasks.get(taskId);
    if (!task) return { success: false, error: 'Task not found' };

    assertValidTaskTransition(task.status, 'CANCELLED');
    task.status = 'CANCELLED';
    task.updated_at = new Date().toISOString();

    return { success: true };
  },

  /**
   * Get tasks posted by requester
   */
  async getMyPostedTasks(requesterId: string): Promise<Task[]> {
    const list: Task[] = [];
    for (const [id, task] of mockStore.tasks.entries()) {
      if (task.requester_id === requesterId) {
        const cat = TASK_CATEGORIES.find((c) => c.id === task.category_id);
        const loc = mockStore.locations.get(id);
        list.push({ ...task, category: cat as any, location: loc });
      }
    }
    return list.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  },

  /**
   * Get tasks assigned to worker
   */
  async getMyAssignedTasks(workerId: string): Promise<Task[]> {
    const assignedTaskIds = new Set(
      Array.from(mockStore.assignments.values())
        .filter((a) => a.worker_id === workerId)
        .map((a) => a.task_id)
    );

    const list: Task[] = [];
    for (const taskId of assignedTaskIds) {
      const task = mockStore.tasks.get(taskId);
      if (task) {
        const cat = TASK_CATEGORIES.find((c) => c.id === task.category_id);
        const loc = mockStore.locations.get(taskId);
        list.push({ ...task, category: cat as any, location: loc });
      }
    }
    return list;
  },

  /**
   * Get all tasks for admin
   */
  async getAllTasks(): Promise<Task[]> {
    const list: Task[] = [];
    for (const [id, task] of mockStore.tasks.entries()) {
      const cat = TASK_CATEGORIES.find((c) => c.id === task.category_id);
      const loc = mockStore.locations.get(id);
      const requester = mockStore.profiles.get(task.requester_id);
      list.push({ ...task, category: cat as any, location: loc, requester });
    }
    return list.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  },
};
