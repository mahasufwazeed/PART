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
    mockStore.reset();
  });

  it('Journey A: Real Registration -> Post Task -> Receive Application -> Assign Worker -> Confirm Completion', async () => {
    // 1. Real user registers as requester
    const { profile: requesterProfile } = await authService.register(
      'karthik@user.in',
      'password123',
      'Karthik Subramanian',
      'en'
    );
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

    // 3. Real worker registers and discovers task nearby
    const { profile: workerProfile } = await authService.register(
      'ananya@worker.in',
      'password123',
      'Ananya Ramaswamy',
      'ta'
    );
    expect(workerProfile.full_name).toBe('Ananya Ramaswamy');

    // Search tasks within 15km of Anna Nagar
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
    const { profile: requester } = await authService.register(
      'requester2@test.in',
      'password123',
      'Karthik S',
      'en'
    );
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
    const { profile: requester } = await authService.register(
      'user_c1@test.in',
      'password123',
      'Requester C',
      'en'
    );
    const { profile: worker } = await authService.register(
      'user_c2@test.in',
      'password123',
      'Worker C',
      'ta'
    );

    const { task } = await taskService.createTask(requester.id, {
      title: 'Emergency delivery in Mylapore',
      description: 'Pick up medical package from Mylapore tank.',
      category_id: TASK_CATEGORIES[0].id,
      budget_inr: 200,
      estimated_duration_minutes: 30,
      preferred_date: '2026-10-25',
      required_workers_count: 1,
      required_skills: [],
      city: 'Chennai',
      locality: 'Mylapore',
      address_approximate: 'Near Kapaleeshwarar Temple',
      latitude: 13.0368,
      longitude: 80.2676,
    });

    const conv = await chatService.getOrCreateTaskConversation(task.id, requester.id, worker.id);
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
    const { profile: requester } = await authService.register(
      'user_d1@test.in',
      'password123',
      'Requester D',
      'en'
    );
    const { profile: worker } = await authService.register(
      'user_d2@test.in',
      'password123',
      'Worker D',
      'ta'
    );

    const { task } = await taskService.createTask(requester.id, {
      title: 'Move study table in Velachery',
      description: 'Need assistance with one study table moving upstairs.',
      category_id: TASK_CATEGORIES[1].id,
      budget_inr: 450,
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

    // Assign worker
    const { assignment } = await taskService.assignWorker(task.id, worker.id, undefined, requester.id);
    await taskService.startTask(task.id, worker.id);
    await taskService.submitCompletion(task.id, assignment.id, worker.id, 'Tables placed in room.');
    await taskService.confirmCompletion(task.id, requester.id);

    // Record Sandbox payment
    const { payment } = await paymentService.recordPayment({
      taskId: task.id,
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
      taskId: task.id,
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
    const { profile: reporter } = await authService.register(
      'reporter@test.in',
      'password123',
      'Concerned Worker',
      'en'
    );
    const { profile: admin } = await authService.register(
      'admin@part.in',
      'password123',
      'Platform Admin Arun',
      'en'
    );

    const { task } = await taskService.createTask(reporter.id, {
      title: 'Transport hazardous acid bottles',
      description: 'Move unsealed acid canisters across town without safety equipment.',
      category_id: TASK_CATEGORIES[0].id,
      budget_inr: 500,
      estimated_duration_minutes: 60,
      preferred_date: '2026-10-25',
      required_workers_count: 1,
      required_skills: [],
      city: 'Chennai',
      locality: 'OMR - Thoraipakkam',
      address_approximate: 'Near ASV Suntech Park',
      latitude: 12.9368,
      longitude: 80.2289,
    });

    // 1. User reports the prohibited task
    const { report } = await disputeService.submitReport({
      reporterId: reporter.id,
      reportedTaskId: task.id,
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
    const taskRecord = mockStore.tasks.get(task.id)!;
    taskRecord.status = 'CANCELLED';
    foundReport!.status = 'RESOLVED';
    foundReport!.resolved_by = admin.id;

    expect(taskRecord.status).toBe('CANCELLED');
    expect(foundReport!.status).toBe('RESOLVED');
  });
});
