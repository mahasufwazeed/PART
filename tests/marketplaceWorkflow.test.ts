import { describe, it, expect, beforeEach } from 'vitest';
import {
  authService,
  taskService,
  chatService,
  paymentService,
  reviewService,
  disputeService,
  mockStore,
  TASK_CATEGORIES,
} from '../shared/src';

describe('End-to-End Hyperlocal Marketplace Workflow (Chennai Launch)', () => {
  beforeEach(() => {
    // Reset mock store before each test
    mockStore.profiles.clear();
    mockStore.tasks.clear();
    mockStore.locations.clear();
    mockStore.applications.clear();
    mockStore.assignments.clear();
    mockStore.payments.clear();
    mockStore.reviews.clear();
    mockStore.disputes.clear();
    mockStore.reports.clear();
    mockStore.conversations.clear();
    mockStore.messages.clear();
    // @ts-ignore
    mockStore.seedDefaults();
  });

  it('Journey A: Registration -> Post Task -> Receive Application -> Assign Worker -> Confirm Completion', async () => {
    // 1. Requester logs in
    const requesterProfile = authService.switchDemoUser('requester');
    expect(requesterProfile.full_name).toBe('Karthik Subramanian');

    // 2. Requester posts a parcel pickup task in Anna Nagar
    const { task, error: postErr } = await taskService.createTask(requesterProfile.id, {
      title: 'Emergency Parcel Pickup from Roundtana',
      description: 'Pickup urgent documents from xerox center at Anna Nagar and deliver to 2nd Avenue.',
      category_id: TASK_CATEGORIES[0].id,
      budget_inr: 250,
      estimated_duration_minutes: 30,
      preferred_date: '2026-10-25',
      required_workers_count: 1,
      required_skills: ['Two-wheeler'],
      city: 'Chennai',
      locality: 'Anna Nagar',
      address_approximate: 'Near Roundtana, Anna Nagar',
      address_exact: 'Flat 4B, 2nd Avenue, Anna Nagar East',
      latitude: 13.085,
      longitude: 80.2101,
      postal_code: '600040',
    });

    expect(postErr).toBeUndefined();
    expect(task.id).toBeDefined();
    expect(task.status).toBe('OPEN');

    // 3. Worker switches profile and discovers task nearby
    const workerProfile = authService.switchDemoUser('worker');
    expect(workerProfile.full_name).toBe('Ananya Ramaswamy');

    // Search tasks within 15km of Anna Nagar (Worker in nearby locality)
    const nearby = await taskService.getNearbyTasks({
      latitude: 13.085,
      longitude: 80.2101,
      radiusKm: 15,
    });

    const foundTask = nearby.find((t) => t.id === task.id);
    expect(foundTask).toBeDefined();
    expect(foundTask?.location?.address_exact).toBeNull(); // Public view privacy check

    // 4. Worker applies for task
    const { application, error: appErr } = await taskService.applyForTask(
      task.id,
      workerProfile.id,
      'I am 5 mins away on my scooter and can deliver this right away!'
    );

    expect(appErr).toBeUndefined();
    expect(application.status).toBe('applied');

    // Prevent duplicate application
    const duplicate = await taskService.applyForTask(task.id, workerProfile.id);
    expect(duplicate.error).toMatch(/already applied/);

    // 5. Requester selects and assigns worker
    const { assignment, error: asgnErr } = await taskService.assignWorker(
      task.id,
      workerProfile.id,
      application.id,
      requesterProfile.id
    );

    expect(asgnErr).toBeUndefined();
    expect(assignment.status).toBe('assigned');

    // Verify task state transitioned to ASSIGNED
    const updatedTask = mockStore.tasks.get(task.id)!;
    expect(updatedTask.status).toBe('ASSIGNED');
    expect(updatedTask.assigned_workers_count).toBe(1);

    // 6. Worker starts task execution (IN_PROGRESS)
    const startResult = await taskService.startTask(task.id, workerProfile.id);
    expect(startResult.success).toBe(true);
    expect(updatedTask.status).toBe('IN_PROGRESS');

    // 7. Worker submits completion evidence
    const submitResult = await taskService.submitCompletion(
      task.id,
      assignment.id,
      workerProfile.id,
      'Delivered parcel safely to security desk. Signed by Raman.'
    );
    expect(submitResult.success).toBe(true);
    expect(updatedTask.status).toBe('COMPLETION_SUBMITTED');

    // 8. Requester confirms completion
    const confirmResult = await taskService.confirmCompletion(task.id, requesterProfile.id);
    expect(confirmResult.success).toBe(true);
    expect(updatedTask.status).toBe('COMPLETED');

    // 9. Requester pays worker cash on completion
    const { payment, error: payErr } = await paymentService.recordPayment({
      taskId: task.id,
      payerId: requesterProfile.id,
      payeeId: workerProfile.id,
      totalAmountInr: 250,
      paymentMethod: 'CASH_ON_COMPLETION',
    });

    expect(payErr).toBeUndefined();
    expect(payment.total_amount_inr).toBe(250);
    expect(payment.platform_fee_inr).toBe(25); // 10%
    expect(payment.worker_amount_inr).toBe(225); // Net worker amount
    expect(payment.status).toBe('SUCCESS');

    // 10. Reviews enabled after COMPLETED
    const { review, error: revErr } = await reviewService.submitReview({
      taskId: task.id,
      reviewerId: requesterProfile.id,
      revieweeId: workerProfile.id,
      roleReviewed: 'worker',
      rating: 5,
      feedback: 'Incredible speed and very courteous service!',
    });

    expect(revErr).toBeUndefined();
    expect(review.rating).toBe(5);

    // Check worker updated stats
    const updatedWorker = mockStore.profiles.get(workerProfile.id)!;
    expect(updatedWorker.total_reviews_as_worker).toBeGreaterThan(0);

    // 11. Check worker earnings dashboard
    const earnings = await paymentService.getWorkerEarnings(workerProfile.id);
    expect(earnings.totalEarnedInr).toBe(225);
    expect(earnings.completedTasksCount).toBe(1);
  });

  it('Journey B: Prevents applying to own task and enforces capacity', async () => {
    const requester = authService.switchDemoUser('requester');
    const { task } = await taskService.createTask(requester.id, {
      title: 'Move study table in Velachery',
      description: 'Need assistance with one study table moving upstairs.',
      category_id: TASK_CATEGORIES[1].id,
      budget_inr: 300,
      estimated_duration_minutes: 45,
      preferred_date: '2026-10-25',
      required_workers_count: 1,
      required_skills: [],
      city: 'Chennai',
      locality: 'Velachery',
      address_approximate: 'Phoenix Mall',
      latitude: 12.9815,
      longitude: 80.218,
    });

    // Attempting to apply to own task must fail
    const selfApp = await taskService.applyForTask(task.id, requester.id);
    expect(selfApp.error).toMatch(/cannot apply to your own task/);
  });

  it('Journey C: Open Conversation -> Send Message -> Receive Message', async () => {
    const requester = authService.switchDemoUser('requester');
    const worker = authService.switchDemoUser('worker');
    const taskId = 'fa000000-0000-4000-8000-000000000001';

    const conv = await chatService.getOrCreateTaskConversation(taskId, requester.id, worker.id);
    expect(conv.id).toBeDefined();

    // Requester sends a message
    const msg1 = await chatService.sendMessage(
      conv.id,
      requester.id,
      'Please take 2nd Avenue entrance, security gate is open.'
    );
    expect(msg1.content).toContain('2nd Avenue');

    // Worker replies
    const msg2 = await chatService.sendMessage(
      conv.id,
      worker.id,
      'Got it, reaching in 5 minutes!'
    );
    expect(msg2.content).toContain('reaching in 5');

    // Fetch conversation history
    const history = await chatService.getMessages(conv.id);
    expect(history.length).toBeGreaterThanOrEqual(2);
    expect(history.some((m) => m.sender_id === requester.id)).toBe(true);
    expect(history.some((m) => m.sender_id === worker.id)).toBe(true);
  });

  it('Journey D: Complete Task -> Record Payment -> Submit Review', async () => {
    const requester = authService.switchDemoUser('requester');
    const worker = authService.switchDemoUser('worker');
    const taskId = 'fa000000-0000-4000-8000-000000000002'; // Velachery task

    // Assign worker
    await taskService.assignWorker(taskId, worker.id, undefined, requester.id);
    await taskService.startTask(taskId, worker.id);
    await taskService.submitCompletion(taskId, 'asgn-1', worker.id, 'Tables placed in room.');
    await taskService.confirmCompletion(taskId, requester.id);

    // Record Sandbox payment
    const { payment } = await paymentService.recordPayment({
      taskId,
      payerId: requester.id,
      payeeId: worker.id,
      totalAmountInr: 450,
      paymentMethod: 'SANDBOX_ONLINE',
    });

    expect(payment.status).toBe('SUCCESS');
    expect(payment.platform_fee_inr).toBe(45); // 10%
    expect(payment.worker_amount_inr).toBe(405);

    // Submit reciprocal review
    const { review } = await reviewService.submitReview({
      taskId,
      reviewerId: worker.id,
      revieweeId: requester.id,
      roleReviewed: 'requester',
      rating: 5,
      feedback: 'Very clear instructions and swift payment confirmation!',
    });

    expect(review.rating).toBe(5);
    const updatedRequester = mockStore.profiles.get(requester.id)!;
    expect(updatedRequester.rating_as_requester).toBe(5.0);
  });

  it('Journey E: Report Task -> Admin Reviews Report -> Admin Takes Action', async () => {
    const reporter = authService.switchDemoUser('worker');
    const admin = authService.switchDemoUser('admin');
    const taskId = 'fa000000-0000-4000-8000-000000000003';

    // 1. User reports a task for policy violation
    const { report } = await disputeService.submitReport({
      reporterId: reporter.id,
      reportedTaskId: taskId,
      reason: 'Safety policy violation: hazardous materials',
      details: 'Requester asked to transport industrial battery acid without protective gear.',
    });

    expect(report.id).toBeDefined();
    expect(report.status).toBe('PENDING');

    // 2. Admin retrieves all reports
    const allReports = await disputeService.getAllReports();
    expect(allReports.length).toBeGreaterThan(0);
    const foundReport = allReports.find((r) => r.id === report.id);
    expect(foundReport).toBeDefined();

    // 3. Admin takes down the prohibited task
    const task = mockStore.tasks.get(taskId)!;
    task.status = 'CANCELLED';
    foundReport!.status = 'RESOLVED';
    foundReport!.resolved_by = admin.id;

    expect(task.status).toBe('CANCELLED');
    expect(foundReport!.status).toBe('RESOLVED');
  });
});
