-- ============================================================================
-- PART – People At Right Time
-- Migration: 20261024000005_campus_community.sql
-- Description: Campus Community for College Students (Colleges, Memberships,
--              Campus Tasks & Privacy Visibility)
-- ============================================================================

-- 1. Create colleges table
CREATE TABLE IF NOT EXISTS public.colleges (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    short_name TEXT NOT NULL,
    city TEXT NOT NULL DEFAULT 'Chennai',
    locality TEXT,
    domains TEXT[] DEFAULT '{}',
    popular_spots TEXT[] DEFAULT '{}',
    accent_color TEXT DEFAULT '#146B3A',
    badge_bg TEXT DEFAULT '#DCFCE7',
    emoji TEXT DEFAULT '🎓',
    is_verified BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_colleges_short_name ON public.colleges(short_name);
CREATE INDEX IF NOT EXISTS idx_colleges_city ON public.colleges(city);

-- 2. Create user_college_memberships table
CREATE TABLE IF NOT EXISTS public.user_college_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    college_id TEXT NOT NULL REFERENCES public.colleges(id) ON DELETE CASCADE,
    college_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'self_selected' CHECK (status IN ('self_selected', 'verified')),
    student_id_or_email TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, college_id)
);

CREATE INDEX IF NOT EXISTS idx_user_college_memberships_user_id ON public.user_college_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_user_college_memberships_college_id ON public.user_college_memberships(college_id);

-- 3. Extend profiles table with college affiliation
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'college_id'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN college_id TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'college_name'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN college_name TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'college_status'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN college_status TEXT DEFAULT 'self_selected' CHECK (college_status IN ('self_selected', 'verified'));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'student_email'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN student_email TEXT;
    END IF;
END $$;

-- 4. Extend tasks table with campus community fields
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'tasks' AND column_name = 'is_campus_task'
    ) THEN
        ALTER TABLE public.tasks ADD COLUMN is_campus_task BOOLEAN DEFAULT FALSE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'tasks' AND column_name = 'college_id'
    ) THEN
        ALTER TABLE public.tasks ADD COLUMN college_id TEXT REFERENCES public.colleges(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'tasks' AND column_name = 'college_name'
    ) THEN
        ALTER TABLE public.tasks ADD COLUMN college_name TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'tasks' AND column_name = 'campus_location'
    ) THEN
        ALTER TABLE public.tasks ADD COLUMN campus_location TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'tasks' AND column_name = 'visibility'
    ) THEN
        ALTER TABLE public.tasks ADD COLUMN visibility TEXT DEFAULT 'COLLEGE_ONLY' CHECK (visibility IN ('COLLEGE_ONLY', 'EVERYONE_NEARBY'));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'tasks' AND column_name = 'requires_verified_student'
    ) THEN
        ALTER TABLE public.tasks ADD COLUMN requires_verified_student BOOLEAN DEFAULT FALSE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'tasks' AND column_name = 'file_attachment_url'
    ) THEN
        ALTER TABLE public.tasks ADD COLUMN file_attachment_url TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'tasks' AND column_name = 'deadline'
    ) THEN
        ALTER TABLE public.tasks ADD COLUMN deadline TEXT;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_tasks_is_campus_task ON public.tasks(is_campus_task);
CREATE INDEX IF NOT EXISTS idx_tasks_college_id ON public.tasks(college_id);

-- 5. Row Level Security Policies
ALTER TABLE public.colleges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_college_memberships ENABLE ROW LEVEL SECURITY;

-- Colleges: anyone authenticated can read
DROP POLICY IF EXISTS "Colleges are publicly readable" ON public.colleges;
CREATE POLICY "Colleges are publicly readable"
    ON public.colleges FOR SELECT
    USING (true);

-- Authenticated students can suggest new colleges
DROP POLICY IF EXISTS "Authenticated users can suggest colleges" ON public.colleges;
CREATE POLICY "Authenticated users can suggest colleges"
    ON public.colleges FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Memberships: users can view and manage their own
DROP POLICY IF EXISTS "Users can read their own memberships" ON public.user_college_memberships;
CREATE POLICY "Users can read their own memberships"
    ON public.user_college_memberships FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can upsert their own memberships" ON public.user_college_memberships;
CREATE POLICY "Users can upsert their own memberships"
    ON public.user_college_memberships FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 6. Seed Chennai Universities
INSERT INTO public.colleges (id, name, short_name, city, locality, domains, popular_spots, accent_color, badge_bg, emoji, is_verified)
VALUES
    (
        'vels-university',
        'VELS Institute of Science, Technology & Advanced Studies (VISTAS)',
        'VELS University',
        'Chennai',
        'Pallavaram',
        ARRAY['velsuniv.ac.in', 'vels.ac.in'],
        ARRAY['Main Canteen', 'Central Library', 'Engineering Block', 'Pharmacy Block', 'Hostel Block 1', 'Auditorium'],
        '#15803D',
        '#DCFCE7',
        '🎓',
        true
    ),
    (
        'anna-university',
        'Anna University (CEG, ACTech, SAP Campus)',
        'Anna University',
        'Chennai',
        'Guindy',
        ARRAY['annauniv.edu', 'ceg.annauniv.edu'],
        ARRAY['CEG Red Building', 'Central Library', 'Main Canteen', 'Knowledge Park', 'Snack Shack', 'Alagappa Tech Block'],
        '#B45309',
        '#FEF3C7',
        '🏛️',
        true
    ),
    (
        'srm-university',
        'SRM Institute of Science and Technology',
        'SRM University',
        'Chennai',
        'Kattankulathur',
        ARRAY['srmist.edu.in', 'srmuniv.ac.in'],
        ARRAY['Tech Park', 'University Building (UB)', 'Java Canteen', 'Central Library', 'Clock Tower', 'Hostel Gate'],
        '#0369A1',
        '#E0F2FE',
        '🚀',
        true
    ),
    (
        'sathyabama-university',
        'Sathyabama Institute of Science and Technology',
        'Sathyabama University',
        'Chennai',
        'Jeppiaar Nagar, OMR',
        ARRAY['sathyabama.ac.in'],
        ARRAY['Central Library', 'Student Mess Hall', 'Dental College Block', 'Aero Lab', 'Main Gate Point'],
        '#7C3AED',
        '#EDE9FE',
        '📘',
        true
    ),
    (
        'hindustan-university',
        'Hindustan Institute of Technology and Science (HITS)',
        'Hindustan University',
        'Chennai',
        'Padur, OMR',
        ARRAY['hindustanuniv.ac.in'],
        ARRAY['Aviation Hangar', 'Founders Block Canteen', 'Main Library', 'Mechanical Bay'],
        '#BE123C',
        '#FFE4E6',
        '✈️',
        true
    ),
    (
        'loyola-college',
        'Loyola College (Autonomous)',
        'Loyola College',
        'Chennai',
        'Nungambakkam',
        ARRAY['loyolacollege.edu'],
        ARRAY['Main Quadrangle', 'Jubilee Building', 'College Canteen', 'Bertram Hall'],
        '#C2410C',
        '#FFEDD5',
        '📚',
        true
    ),
    (
        'mcc-college',
        'Madras Christian College (MCC)',
        'Madras Christian College',
        'Chennai',
        'Tambaram',
        ARRAY['mcc.edu.in'],
        ARRAY['Anderson Hall', 'The Gutters Pavilion', 'College Cafeteria', 'Heber Hall'],
        '#0F766E',
        '#CCFBF1',
        '🌿',
        true
    )
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    short_name = EXCLUDED.short_name,
    domains = EXCLUDED.domains,
    popular_spots = EXCLUDED.popular_spots;
