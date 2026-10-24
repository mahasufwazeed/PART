/**
 * PART – People At Right Time
 * Core Type Definitions
 */

export type UserRole = 'requester' | 'worker' | 'admin';
export type AppLanguage = 'en' | 'ta';

export type TaskStatus =
  | 'DRAFT'
  | 'OPEN'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'COMPLETION_SUBMITTED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'DISPUTED';

export type ApplicationStatus =
  | 'applied'
  | 'shortlisted'
  | 'accepted'
  | 'rejected'
  | 'withdrawn';

export type AssignmentStatus =
  | 'assigned'
  | 'in_progress'
  | 'completion_submitted'
  | 'completed'
  | 'cancelled'
  | 'disputed';

export type PaymentStatus =
  | 'PENDING'
  | 'INITIATED'
  | 'SUCCESS'
  | 'FAILED'
  | 'REFUNDED';

export type PaymentMethod =
  | 'CASH_ON_COMPLETION'
  | 'SANDBOX_ONLINE'
  | 'RAZORPAY';

export type DisputeStatus =
  | 'OPEN'
  | 'UNDER_REVIEW'
  | 'RESOLVED_REFUND'
  | 'RESOLVED_PAY_WORKER'
  | 'DISMISSED';

export type VerificationStatus =
  | 'unverified'
  | 'pending'
  | 'verified'
  | 'rejected';

export interface Profile {
  id: string; // references auth.users
  full_name: string;
  email?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  default_role?: 'poster' | 'worker';
  preferred_language: AppLanguage;
  city: string; // e.g. "Chennai"
  general_location?: string | null; // e.g. "Velachery, Chennai"
  is_admin: boolean;
  is_worker_available: boolean;
  verification_status: VerificationStatus;
  rating_as_worker: number;
  total_reviews_as_worker: number;
  completed_tasks_as_worker: number;
  rating_as_requester: number;
  total_reviews_as_requester: number;
  completed_tasks_as_requester: number;
  created_at: string;
  updated_at: string;
}

export interface UserSkill {
  id: string;
  user_id: string;
  skill_name: string;
  created_at: string;
}

export interface TaskCategory {
  id: string;
  slug: string;
  name_en: string;
  name_ta: string;
  description_en: string;
  description_ta: string;
  icon: string;
  safety_guidelines: string[];
  is_active: boolean;
  display_order: number;
  created_at: string;
}

export interface TaskLocation {
  id: string;
  task_id: string;
  city: string;
  locality: string; // e.g., "Anna Nagar"
  address_approximate: string; // Public view
  address_exact?: string | null; // Shared only with assigned worker
  latitude: number;
  longitude: number;
  postal_code?: string | null;
  created_at: string;
}

export interface Task {
  id: string;
  requester_id: string;
  category_id: string;
  title: string;
  description: string;
  budget_inr: number;
  estimated_duration_minutes: number;
  preferred_date: string;
  preferred_time_window?: string | null;
  required_workers_count: number;
  assigned_workers_count: number;
  required_skills: string[];
  special_instructions?: string | null;
  status: TaskStatus;
  created_at: string;
  updated_at: string;
  // joined relations
  category?: TaskCategory;
  location?: TaskLocation;
  requester?: Profile;
  distance_km?: number;
}

export interface TaskApplication {
  id: string;
  task_id: string;
  worker_id: string;
  pitch_message?: string | null;
  status: ApplicationStatus;
  created_at: string;
  updated_at: string;
  // joined relations
  worker?: Profile;
  task?: Task;
}

export interface TaskAssignment {
  id: string;
  task_id: string;
  worker_id: string;
  application_id?: string | null;
  status: AssignmentStatus;
  agreed_rate_inr: number;
  assigned_at: string;
  started_at?: string | null;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
  // joined relations
  worker?: Profile;
  task?: Task;
}

export interface TaskStatusHistory {
  id: string;
  task_id: string;
  previous_status: TaskStatus | null;
  new_status: TaskStatus;
  changed_by: string; // user id
  notes?: string | null;
  created_at: string;
}

export interface Conversation {
  id: string;
  task_id: string;
  created_at: string;
  updated_at: string;
}

export interface ConversationParticipant {
  id: string;
  conversation_id: string;
  user_id: string;
  last_read_at?: string | null;
  created_at: string;
  // joined relation
  user?: Profile;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender?: Profile;
  attachments?: MessageAttachment[];
}

export interface MessageAttachment {
  id: string;
  message_id: string;
  file_url: string;
  file_type: string;
  file_size_bytes: number;
  created_at: string;
}

export interface TaskCompletionEvidence {
  id: string;
  task_id: string;
  assignment_id: string;
  submitted_by: string;
  notes: string;
  photo_urls: string[];
  created_at: string;
}

export interface Payment {
  id: string;
  task_id: string;
  assignment_id?: string | null;
  payer_id: string; // Requester
  payee_id: string; // Worker
  total_amount_inr: number;
  platform_fee_inr: number;
  worker_amount_inr: number;
  platform_fee_percent: number;
  status: PaymentStatus;
  payment_method: PaymentMethod;
  provider_reference?: string | null;
  notes?: string | null;
  created_at: string;
  settled_at?: string | null;
}

export interface PaymentEvent {
  id: string;
  payment_id: string;
  event_type: string;
  payload: Record<string, unknown>;
  created_at: string;
}

export interface Review {
  id: string;
  task_id: string;
  reviewer_id: string;
  reviewee_id: string;
  role_reviewed: 'worker' | 'requester';
  rating: number; // 1 to 5
  feedback: string;
  created_at: string;
  reviewer?: Profile;
  reviewee?: Profile;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  event_type: string;
  reference_type?: string | null; // e.g., 'task', 'chat', 'payment'
  reference_id?: string | null;
  is_read: boolean;
  created_at: string;
}

export interface Report {
  id: string;
  reporter_id: string;
  reported_user_id?: string | null;
  reported_task_id?: string | null;
  reason: string;
  details?: string | null;
  status: 'PENDING' | 'RESOLVED' | 'DISMISSED';
  resolved_by?: string | null;
  resolved_at?: string | null;
  created_at: string;
}

export interface Dispute {
  id: string;
  task_id: string;
  raised_by: string;
  reason: string;
  details: string;
  status: DisputeStatus;
  resolution_notes?: string | null;
  resolved_by?: string | null;
  resolved_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserBlock {
  id: string;
  blocker_id: string;
  blocked_id: string;
  created_at: string;
}

export interface VerificationRecord {
  id: string;
  user_id: string;
  document_type: string;
  document_url: string;
  status: VerificationStatus;
  reviewed_by?: string | null;
  rejection_reason?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminAuditLog {
  id: string;
  admin_id: string;
  action: string;
  target_entity: string;
  target_id: string;
  details: Record<string, unknown>;
  ip_address?: string | null;
  created_at: string;
}

export interface PlatformSettings {
  id: string;
  platform_fee_percent: number;
  currency: string; // 'INR'
  support_phone: string;
  support_email: string;
  min_task_budget_inr: number;
  max_task_budget_inr: number;
  created_at: string;
  updated_at: string;
}

export * from './location';

