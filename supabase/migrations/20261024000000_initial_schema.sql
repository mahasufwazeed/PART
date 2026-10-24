-- ============================================================================
-- PART – People At Right Time
-- Migration: 20261024000000_initial_schema.sql
-- Normalized PostgreSQL Schema for Hyperlocal Task Marketplace (Chennai Launch)
-- ============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Try enabling postgis if supported by environment
DO $$
BEGIN
    CREATE EXTENSION IF NOT EXISTS "postgis";
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'PostGIS extension not available in this cluster; falling back to Haversine functions.';
END
$$;

-- 2. Custom Types & Enums
DO $$ BEGIN
    CREATE TYPE task_status_enum AS ENUM (
        'DRAFT', 'OPEN', 'ASSIGNED', 'IN_PROGRESS',
        'COMPLETION_SUBMITTED', 'COMPLETED', 'CANCELLED', 'DISPUTED'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE application_status_enum AS ENUM (
        'applied', 'shortlisted', 'accepted', 'rejected', 'withdrawn'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE assignment_status_enum AS ENUM (
        'assigned', 'in_progress', 'completion_submitted', 'completed', 'cancelled', 'disputed'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE payment_status_enum AS ENUM (
        'PENDING', 'INITIATED', 'SUCCESS', 'FAILED', 'REFUNDED'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE payment_method_enum AS ENUM (
        'CASH_ON_COMPLETION', 'SANDBOX_ONLINE', 'RAZORPAY'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE dispute_status_enum AS ENUM (
        'OPEN', 'UNDER_REVIEW', 'RESOLVED_REFUND', 'RESOLVED_PAY_WORKER', 'DISMISSED'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE verification_status_enum AS ENUM (
        'unverified', 'pending', 'verified', 'rejected'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 3. Utility Function: Timestamp updater
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- Table 1: profiles
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone TEXT,
    avatar_url TEXT,
    bio TEXT,
    preferred_language VARCHAR(5) DEFAULT 'en' CHECK (preferred_language IN ('en', 'ta')),
    city TEXT NOT NULL DEFAULT 'Chennai',
    general_location TEXT,
    is_admin BOOLEAN DEFAULT FALSE NOT NULL,
    is_worker_available BOOLEAN DEFAULT TRUE NOT NULL,
    verification_status verification_status_enum DEFAULT 'unverified' NOT NULL,
    rating_as_worker NUMERIC(3,2) DEFAULT 5.00 NOT NULL CHECK (rating_as_worker >= 1.00 AND rating_as_worker <= 5.00),
    total_reviews_as_worker INTEGER DEFAULT 0 NOT NULL CHECK (total_reviews_as_worker >= 0),
    completed_tasks_as_worker INTEGER DEFAULT 0 NOT NULL CHECK (completed_tasks_as_worker >= 0),
    rating_as_requester NUMERIC(3,2) DEFAULT 5.00 NOT NULL CHECK (rating_as_requester >= 1.00 AND rating_as_requester <= 5.00),
    total_reviews_as_requester INTEGER DEFAULT 0 NOT NULL CHECK (total_reviews_as_requester >= 0),
    completed_tasks_as_requester INTEGER DEFAULT 0 NOT NULL CHECK (completed_tasks_as_requester >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TRIGGER set_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------------------
-- Table 2: user_skills
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    skill_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT unique_user_skill UNIQUE (user_id, skill_name)
);

CREATE INDEX IF NOT EXISTS idx_user_skills_user ON public.user_skills(user_id);
CREATE INDEX IF NOT EXISTS idx_user_skills_skill ON public.user_skills(skill_name);

-- ----------------------------------------------------------------------------
-- Table 3: task_categories
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.task_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL UNIQUE,
    name_en TEXT NOT NULL,
    name_ta TEXT NOT NULL,
    description_en TEXT NOT NULL,
    description_ta TEXT NOT NULL,
    icon TEXT NOT NULL,
    safety_guidelines JSONB DEFAULT '[]'::jsonb NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    display_order INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ----------------------------------------------------------------------------
-- Table 4: tasks
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.task_categories(id) ON DELETE RESTRICT,
    title TEXT NOT NULL CHECK (char_length(title) >= 5 AND char_length(title) <= 100),
    description TEXT NOT NULL CHECK (char_length(description) >= 15 AND char_length(description) <= 2000),
    budget_inr NUMERIC(10,2) NOT NULL CHECK (budget_inr >= 50 AND budget_inr <= 50000),
    estimated_duration_minutes INTEGER NOT NULL CHECK (estimated_duration_minutes >= 10 AND estimated_duration_minutes <= 1440),
    preferred_date DATE NOT NULL,
    preferred_time_window TEXT,
    required_workers_count INTEGER DEFAULT 1 NOT NULL CHECK (required_workers_count >= 1 AND required_workers_count <= 10),
    assigned_workers_count INTEGER DEFAULT 0 NOT NULL CHECK (assigned_workers_count >= 0 AND assigned_workers_count <= required_workers_count),
    required_skills JSONB DEFAULT '[]'::jsonb NOT NULL,
    special_instructions TEXT,
    status task_status_enum DEFAULT 'OPEN' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tasks_requester ON public.tasks(requester_id);
CREATE INDEX IF NOT EXISTS idx_tasks_category ON public.tasks(category_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON public.tasks(created_at DESC);

CREATE TRIGGER set_tasks_updated_at
BEFORE UPDATE ON public.tasks
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------------------
-- Table 5: task_locations
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.task_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL UNIQUE REFERENCES public.tasks(id) ON DELETE CASCADE,
    city TEXT NOT NULL DEFAULT 'Chennai',
    locality TEXT NOT NULL,
    address_approximate TEXT NOT NULL,
    address_exact TEXT,
    latitude DOUBLE PRECISION NOT NULL CHECK (latitude >= -90 AND latitude <= 90),
    longitude DOUBLE PRECISION NOT NULL CHECK (longitude >= -180 AND longitude <= 180),
    postal_code VARCHAR(12),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_task_locations_coords ON public.task_locations(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_task_locations_locality ON public.task_locations(locality);

-- ----------------------------------------------------------------------------
-- Table 6: task_applications
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.task_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    worker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    pitch_message TEXT CHECK (char_length(pitch_message) <= 500),
    status application_status_enum DEFAULT 'applied' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT unique_task_worker_application UNIQUE (task_id, worker_id)
);

CREATE INDEX IF NOT EXISTS idx_task_applications_task ON public.task_applications(task_id);
CREATE INDEX IF NOT EXISTS idx_task_applications_worker ON public.task_applications(worker_id);
CREATE INDEX IF NOT EXISTS idx_task_applications_status ON public.task_applications(status);

CREATE TRIGGER set_task_applications_updated_at
BEFORE UPDATE ON public.task_applications
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------------------
-- Table 7: task_assignments
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.task_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    worker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    application_id UUID REFERENCES public.task_applications(id) ON DELETE SET NULL,
    status assignment_status_enum DEFAULT 'assigned' NOT NULL,
    agreed_rate_inr NUMERIC(10,2) NOT NULL CHECK (agreed_rate_inr >= 0),
    assigned_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT unique_task_worker_assignment UNIQUE (task_id, worker_id)
);

CREATE INDEX IF NOT EXISTS idx_task_assignments_task ON public.task_assignments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_assignments_worker ON public.task_assignments(worker_id);

CREATE TRIGGER set_task_assignments_updated_at
BEFORE UPDATE ON public.task_assignments
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------------------
-- Table 8: task_status_history
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.task_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    previous_status task_status_enum,
    new_status task_status_enum NOT NULL,
    changed_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_task_status_history_task ON public.task_status_history(task_id);

-- ----------------------------------------------------------------------------
-- Table 9: conversations
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_conversations_task ON public.conversations(task_id);

CREATE TRIGGER set_conversations_updated_at
BEFORE UPDATE ON public.conversations
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------------------
-- Table 10: conversation_participants
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.conversation_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    last_read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT unique_conversation_user UNIQUE (conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_conv_participants_user ON public.conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_conv_participants_conv ON public.conversation_participants(conversation_id);

-- ----------------------------------------------------------------------------
-- Table 11: messages
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL CHECK (char_length(content) >= 1 AND char_length(content) <= 3000),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id, created_at ASC);

-- ----------------------------------------------------------------------------
-- Table 12: message_attachments
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.message_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size_bytes INTEGER NOT NULL CHECK (file_size_bytes > 0 AND file_size_bytes <= 10485760), -- max 10MB
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ----------------------------------------------------------------------------
-- Table 13: task_completion_evidence
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.task_completion_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    assignment_id UUID NOT NULL REFERENCES public.task_assignments(id) ON DELETE CASCADE,
    submitted_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    notes TEXT NOT NULL,
    photo_urls JSONB DEFAULT '[]'::jsonb NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_completion_evidence_task ON public.task_completion_evidence(task_id);

-- ----------------------------------------------------------------------------
-- Table 14: payments
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    assignment_id UUID REFERENCES public.task_assignments(id) ON DELETE SET NULL,
    payer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    payee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    total_amount_inr NUMERIC(10,2) NOT NULL CHECK (total_amount_inr > 0),
    platform_fee_inr NUMERIC(10,2) NOT NULL CHECK (platform_fee_inr >= 0),
    worker_amount_inr NUMERIC(10,2) NOT NULL CHECK (worker_amount_inr >= 0),
    platform_fee_percent NUMERIC(5,2) DEFAULT 10.00 NOT NULL,
    status payment_status_enum DEFAULT 'PENDING' NOT NULL,
    payment_method payment_method_enum NOT NULL,
    provider_reference TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    settled_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_payments_task ON public.payments(task_id);
CREATE INDEX IF NOT EXISTS idx_payments_payer ON public.payments(payer_id);
CREATE INDEX IF NOT EXISTS idx_payments_payee ON public.payments(payee_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);

-- ----------------------------------------------------------------------------
-- Table 15: payment_events
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payment_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    payload JSONB DEFAULT '{}'::jsonb NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ----------------------------------------------------------------------------
-- Table 16: reviews
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reviewee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role_reviewed TEXT NOT NULL CHECK (role_reviewed IN ('worker', 'requester')),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    feedback TEXT NOT NULL CHECK (char_length(feedback) >= 5 AND char_length(feedback) <= 1000),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT unique_task_reviewer_reviewee UNIQUE (task_id, reviewer_id, reviewee_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_reviewee ON public.reviews(reviewee_id);
CREATE INDEX IF NOT EXISTS idx_reviews_task ON public.reviews(task_id);

-- ----------------------------------------------------------------------------
-- Table 17: notifications
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    event_type TEXT NOT NULL,
    reference_type TEXT,
    reference_id TEXT,
    is_read BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, is_read, created_at DESC);

-- ----------------------------------------------------------------------------
-- Table 18: reports
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reported_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reported_task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
    reason TEXT NOT NULL,
    details TEXT,
    status TEXT DEFAULT 'PENDING' NOT NULL CHECK (status IN ('PENDING', 'RESOLVED', 'DISMISSED')),
    resolved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);

-- ----------------------------------------------------------------------------
-- Table 19: disputes
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.disputes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    raised_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    details TEXT NOT NULL,
    status dispute_status_enum DEFAULT 'OPEN' NOT NULL,
    resolution_notes TEXT,
    resolved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_disputes_task ON public.disputes(task_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON public.disputes(status);

CREATE TRIGGER set_disputes_updated_at
BEFORE UPDATE ON public.disputes
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------------------
-- Table 20: user_blocks
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blocker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    blocked_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT unique_user_block UNIQUE (blocker_id, blocked_id),
    CONSTRAINT no_self_block CHECK (blocker_id <> blocked_id)
);

-- ----------------------------------------------------------------------------
-- Table 21: verification_records
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.verification_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL,
    document_url TEXT NOT NULL,
    status verification_status_enum DEFAULT 'pending' NOT NULL,
    reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TRIGGER set_verification_updated_at
BEFORE UPDATE ON public.verification_records
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------------------
-- Table 22: admin_audit_logs
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    target_entity TEXT NOT NULL,
    target_id TEXT NOT NULL,
    details JSONB DEFAULT '{}'::jsonb NOT NULL,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_admin ON public.admin_audit_logs(admin_id, created_at DESC);

-- ----------------------------------------------------------------------------
-- Table 23: platform_settings
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.platform_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform_fee_percent NUMERIC(5,2) DEFAULT 10.00 NOT NULL,
    currency VARCHAR(10) DEFAULT 'INR' NOT NULL,
    support_phone TEXT DEFAULT '+91 44 2827 0000' NOT NULL,
    support_email TEXT DEFAULT 'support@part-app.in' NOT NULL,
    min_task_budget_inr NUMERIC(10,2) DEFAULT 50.00 NOT NULL,
    max_task_budget_inr NUMERIC(10,2) DEFAULT 50000.00 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TRIGGER set_platform_settings_updated_at
BEFORE UPDATE ON public.platform_settings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
