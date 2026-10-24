import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional(),
});

export const registerSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  full_name: z.string().min(2, 'Full name must be at least 2 characters').max(60),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number')
    .optional()
    .or(z.literal('')),
  preferred_language: z.enum(['en', 'ta']).default('en'),
});

export const signupSchema = registerSchema
  .extend({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(8, 'Please confirm your password'),
    termsAccepted: z.literal(true, {
      errorMap: () => ({ message: 'You must accept the Terms and Privacy Policy' }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export const updatePasswordSchema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(8, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const onboardingProfileSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters').max(60),
  phone: z.string().optional().nullable(),
  bio: z.string().max(300, 'Bio must be under 300 characters').optional().nullable(),
  city: z.string().min(2, 'City is required').default('Chennai'),
  general_location: z.string().min(2, 'Locality is required (e.g. Velachery)').max(100),
  preferred_language: z.enum(['en', 'ta']).default('en'),
  skills: z.array(z.string()).default([]),
  interested_categories: z.array(z.string()).default([]),
  is_worker_available: z.boolean().default(true),
});

export const updateProfileSchema = z.object({
  full_name: z.string().min(2).max(60).optional(),
  phone: z.string().optional().nullable(),
  bio: z.string().max(500).optional().nullable(),
  city: z.string().min(2).optional(),
  general_location: z.string().max(100).optional().nullable(),
  preferred_language: z.enum(['en', 'ta']).optional(),
  is_worker_available: z.boolean().optional(),
  avatar_url: z.string().optional().nullable(),
  upi_id: z.string().optional().nullable(),
  skills: z.array(z.string()).optional(),
});

export const createTaskSchema = z.object({
  title: z
    .string()
    .min(5, 'Task title must be at least 5 characters')
    .max(100, 'Task title cannot exceed 100 characters'),
  description: z
    .string()
    .min(15, 'Please provide more details (at least 15 characters)')
    .max(2000, 'Description too long'),
  category_id: z.string().uuid('Please select a valid task category'),
  budget_inr: z
    .number()
    .min(50, 'Minimum budget in Chennai is ₹50')
    .max(50000, 'Maximum budget for a standard task is ₹50,000'),
  estimated_duration_minutes: z
    .number()
    .min(10, 'Minimum duration is 10 minutes')
    .max(1440, 'Maximum duration is 24 hours (1440 mins)'),
  preferred_date: z.string().min(1, 'Please select a preferred date'),
  preferred_time_window: z.string().max(50).optional().nullable(),
  required_workers_count: z.number().int().min(1).max(10).default(1),
  required_skills: z.array(z.string()).default([]),
  special_instructions: z.string().max(1000).optional().nullable(),
  // Location sub-fields
  city: z.string().default('Chennai'),
  locality: z.string().min(2, 'Locality is required (e.g. Anna Nagar)'),
  address_approximate: z.string().min(3, 'Approximate address/landmark is required'),
  address_exact: z.string().max(300).optional().nullable(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  postal_code: z.string().max(10).optional().nullable(),
});

export const createApplicationSchema = z.object({
  task_id: z.string().uuid(),
  pitch_message: z.string().max(500, 'Message cannot exceed 500 characters').optional().nullable(),
});

export const submitCompletionEvidenceSchema = z.object({
  task_id: z.string().uuid(),
  assignment_id: z.string().uuid(),
  notes: z.string().min(5, 'Please describe work completed').max(1000),
  photo_urls: z.array(z.string().url()).max(5, 'Maximum 5 photos allowed').default([]),
});

export const createReviewSchema = z.object({
  task_id: z.string().uuid(),
  reviewee_id: z.string().uuid(),
  role_reviewed: z.enum(['worker', 'requester']),
  rating: z.number().int().min(1, 'Rating must be 1 to 5').max(5, 'Rating must be 1 to 5'),
  feedback: z.string().min(5, 'Feedback must be at least 5 characters').max(1000),
});

export const createDisputeSchema = z.object({
  task_id: z.string().uuid(),
  reason: z.string().min(5, 'Reason must be at least 5 characters').max(150),
  details: z.string().min(15, 'Please provide comprehensive details of the dispute').max(1500),
});

export const createReportSchema = z.object({
  reported_user_id: z.string().uuid().optional().nullable(),
  reported_task_id: z.string().uuid().optional().nullable(),
  reason: z.string().min(3).max(150),
  details: z.string().max(1000).optional().nullable(),
});

export const initiatePaymentSchema = z.object({
  task_id: z.string().uuid(),
  payment_method: z.enum(['CASH_ON_COMPLETION', 'SANDBOX_ONLINE', 'RAZORPAY']),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type OnboardingProfileInput = z.infer<typeof onboardingProfileSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;
export type SubmitCompletionEvidenceInput = z.infer<typeof submitCompletionEvidenceSchema>;
export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type CreateDisputeInput = z.infer<typeof createDisputeSchema>;
export type CreateReportInput = z.infer<typeof createReportSchema>;
export type InitiatePaymentInput = z.infer<typeof initiatePaymentSchema>;
