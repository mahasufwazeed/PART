import { describe, it, expect } from 'vitest';
import {
  canTransitionTask,
  assertValidTaskTransition,
  isTaskCancellable,
  isReviewEligible,
  canAcceptApplications,
  evaluateMultiWorkerTaskStatus,
} from '../shared/src/utils/stateMachine';

describe('Task State Machine Engine', () => {
  it('allows valid state progression for single worker task', () => {
    expect(canTransitionTask('DRAFT', 'OPEN')).toBe(true);
    expect(canTransitionTask('OPEN', 'ASSIGNED')).toBe(true);
    expect(canTransitionTask('ASSIGNED', 'IN_PROGRESS')).toBe(true);
    expect(canTransitionTask('IN_PROGRESS', 'COMPLETION_SUBMITTED')).toBe(true);
    expect(canTransitionTask('COMPLETION_SUBMITTED', 'COMPLETED')).toBe(true);
  });

  it('rejects skipping states directly to completed', () => {
    expect(canTransitionTask('OPEN', 'COMPLETED')).toBe(false);
    expect(canTransitionTask('DRAFT', 'IN_PROGRESS')).toBe(false);
    expect(() => assertValidTaskTransition('OPEN', 'COMPLETED')).toThrow(
      /Invalid task state transition/
    );
  });

  it('handles cancellation and dispute paths safely', () => {
    expect(canTransitionTask('OPEN', 'CANCELLED')).toBe(true);
    expect(canTransitionTask('ASSIGNED', 'DISPUTED')).toBe(true);
    expect(canTransitionTask('IN_PROGRESS', 'DISPUTED')).toBe(true);
    expect(canTransitionTask('COMPLETION_SUBMITTED', 'DISPUTED')).toBe(true);
    expect(canTransitionTask('COMPLETED', 'CANCELLED')).toBe(false); // terminal state
  });

  it('verifies cancellation eligibility based on status', () => {
    expect(isTaskCancellable('DRAFT')).toBe(true);
    expect(isTaskCancellable('OPEN')).toBe(true);
    expect(isTaskCancellable('ASSIGNED')).toBe(true);
    expect(isTaskCancellable('COMPLETED')).toBe(false);
    expect(isTaskCancellable('CANCELLED')).toBe(false);
  });

  it('only permits reviews after task is COMPLETED', () => {
    expect(isReviewEligible('COMPLETED')).toBe(true);
    expect(isReviewEligible('IN_PROGRESS')).toBe(false);
    expect(isReviewEligible('COMPLETION_SUBMITTED')).toBe(false);
    expect(isReviewEligible('OPEN')).toBe(false);
  });

  it('prevents applications once assigned capacity is reached', () => {
    expect(canAcceptApplications('OPEN', 0, 1)).toBe(true);
    expect(canAcceptApplications('OPEN', 1, 1)).toBe(false); // full
    expect(canAcceptApplications('ASSIGNED', 0, 1)).toBe(false); // not open
  });

  it('evaluates multi-worker completion logic', () => {
    // 3 required workers
    expect(evaluateMultiWorkerTaskStatus(3, 0, 1)).toBe('IN_PROGRESS');
    expect(evaluateMultiWorkerTaskStatus(3, 2, 1)).toBe('IN_PROGRESS');
    expect(evaluateMultiWorkerTaskStatus(3, 3, 0)).toBe('COMPLETED');
  });
});
