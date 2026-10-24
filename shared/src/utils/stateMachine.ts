import { TaskStatus, AssignmentStatus } from '../types';

/**
 * Valid transitions for Task entity
 */
export const TASK_STATUS_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  DRAFT: ['OPEN', 'CANCELLED'],
  OPEN: ['ASSIGNED', 'CANCELLED'],
  ASSIGNED: ['IN_PROGRESS', 'CANCELLED', 'DISPUTED'],
  IN_PROGRESS: ['COMPLETION_SUBMITTED', 'CANCELLED', 'DISPUTED'],
  COMPLETION_SUBMITTED: ['COMPLETED', 'IN_PROGRESS', 'DISPUTED'],
  COMPLETED: [], // Terminal state
  CANCELLED: [], // Terminal state
  DISPUTED: ['COMPLETED', 'CANCELLED', 'IN_PROGRESS'], // Resolved by admin
};

/**
 * Valid transitions for Worker Task Assignment entity
 */
export const ASSIGNMENT_STATUS_TRANSITIONS: Record<AssignmentStatus, AssignmentStatus[]> = {
  assigned: ['in_progress', 'cancelled', 'disputed'],
  in_progress: ['completion_submitted', 'cancelled', 'disputed'],
  completion_submitted: ['completed', 'in_progress', 'disputed'],
  completed: [],
  cancelled: [],
  disputed: ['completed', 'cancelled', 'in_progress'],
};

/**
 * Check if a task status transition is permitted
 */
export function canTransitionTask(from: TaskStatus, to: TaskStatus): boolean {
  if (from === to) return true;
  const allowed = TASK_STATUS_TRANSITIONS[from];
  return allowed ? allowed.includes(to) : false;
}

/**
 * Throw error if transition is invalid
 */
export function assertValidTaskTransition(from: TaskStatus, to: TaskStatus): void {
  if (!canTransitionTask(from, to)) {
    throw new Error(`Invalid task state transition from ${from} to ${to}`);
  }
}

/**
 * Check if a task allows cancellation
 */
export function isTaskCancellable(status: TaskStatus): boolean {
  return ['DRAFT', 'OPEN', 'ASSIGNED', 'IN_PROGRESS'].includes(status);
}

/**
 * Check if a task is eligible for reviews
 */
export function isReviewEligible(status: TaskStatus): boolean {
  return status === 'COMPLETED';
}

/**
 * Check if a task can accept new applications
 */
export function canAcceptApplications(status: TaskStatus, assignedCount: number, requiredCount: number): boolean {
  return status === 'OPEN' && assignedCount < requiredCount;
}

/**
 * Calculate multi-worker task status given completed worker assignments
 */
export function evaluateMultiWorkerTaskStatus(
  requiredWorkers: number,
  completedAssignments: number,
  activeAssignments: number
): TaskStatus {
  if (completedAssignments >= requiredWorkers) {
    return 'COMPLETED';
  }
  if (activeAssignments > 0) {
    return 'IN_PROGRESS';
  }
  return 'ASSIGNED';
}
