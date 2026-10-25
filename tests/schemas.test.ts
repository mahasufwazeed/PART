import { describe, it, expect } from 'vitest';
import {
  createTaskSchema,
  loginSchema,
  registerSchema,
  createReviewSchema,
  initiatePaymentSchema,
} from '../shared/src/schemas';

describe('Zod Validation Schemas', () => {
  it('validates a complete valid Chennai task posting', () => {
    const validTask = {
      title: 'Pick up medical parcel from pharmacy',
      description: 'Prescription medicines already billed, pick up from Roundtana and drop at 4th Avenue.',
      category_id: '11111111-1111-4111-8111-111111111111',
      budget_inr: 200,
      estimated_duration_minutes: 30,
      preferred_date: '2026-10-25',
      preferred_time_window: 'Morning 10 AM',
      required_workers_count: 1,
      required_skills: ['Two-wheeler'],
      locality: 'Anna Nagar',
      address_approximate: 'Near Roundtana',
      address_exact: 'Door 10, 4th Avenue',
      latitude: 13.085,
      longitude: 80.2101,
      postal_code: '600040',
    };

    const result = createTaskSchema.safeParse(validTask);
    expect(result.success).toBe(true);
  });

  it('rejects tasks with budget below minimum ₹50 or invalid duration', () => {
    const invalidTask = {
      title: 'Short task',
      description: 'Too short',
      category_id: '11111111-1111-4111-8111-111111111111',
      budget_inr: 20, // under ₹50
      estimated_duration_minutes: 5, // under 10m
      preferred_date: '2026-10-25',
      locality: 'Velachery',
      address_approximate: 'Bus stand',
      latitude: 12.98,
      longitude: 80.21,
    };

    const result = createTaskSchema.safeParse(invalidTask);
    expect(result.success).toBe(false);
    if (!result.success) {
      const issues = result.error.issues || (result.error as any).errors || [];
      const errorPaths = issues.map((e: any) => e.path.join('.'));
      expect(errorPaths).toContain('budget_inr');
      expect(errorPaths).toContain('estimated_duration_minutes');
      expect(errorPaths).toContain('description');
    }
  });

  it('validates user auth schemas', () => {
    expect(loginSchema.safeParse({ email: 'user@part.in', password: 'password123' }).success).toBe(true);
    expect(loginSchema.safeParse({ email: 'invalid-email', password: '123' }).success).toBe(false);

    expect(
      registerSchema.safeParse({
        email: 'chennai_worker@part.in',
        password: 'securepass123',
        full_name: 'Ananya R',
        preferred_language: 'ta',
      }).success
    ).toBe(true);
  });

  it('validates rating constraints (1-5 stars only)', () => {
    expect(
      createReviewSchema.safeParse({
        task_id: '11111111-1111-4111-8111-111111111111',
        reviewee_id: '22222222-2222-4222-8222-222222222222',
        role_reviewed: 'worker',
        rating: 5,
        feedback: 'Fantastic service, delivered promptly on time!',
      }).success
    ).toBe(true);

    expect(
      createReviewSchema.safeParse({
        task_id: '11111111-1111-4111-8111-111111111111',
        reviewee_id: '22222222-2222-4222-8222-222222222222',
        role_reviewed: 'worker',
        rating: 6, // invalid
        feedback: 'Too high rating',
      }).success
    ).toBe(false);
  });

  it('validates payment method enumeration', () => {
    expect(
      initiatePaymentSchema.safeParse({
        task_id: '11111111-1111-4111-8111-111111111111',
        payment_method: 'CASH_ON_COMPLETION',
      }).success
    ).toBe(true);

    expect(
      initiatePaymentSchema.safeParse({
        task_id: '11111111-1111-4111-8111-111111111111',
        payment_method: 'BITCOIN', // unsupported
      }).success
    ).toBe(false);
  });
});
