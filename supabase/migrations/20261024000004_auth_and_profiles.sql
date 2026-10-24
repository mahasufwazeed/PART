-- ============================================================================
-- PART – People At Right Time
-- Migration: 20261024000004_auth_and_profiles.sql
-- Description: Complete User Authentication, Google OAuth, Profile Storage & RLS
-- ============================================================================

-- 1. Extend profiles table with email and default_role
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'email'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN email TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'default_role'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN default_role TEXT DEFAULT 'poster' CHECK (default_role IN ('poster', 'worker'));
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- 2. Enhanced handle_new_user trigger function supporting Email & Google OAuth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_full_name TEXT;
    v_avatar_url TEXT;
    v_phone TEXT;
    v_default_role TEXT;
    v_provider TEXT;
    v_verification verification_status_enum;
BEGIN
    -- Extract full name from raw metadata (Google OAuth provides 'name' or 'full_name')
    v_full_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        split_part(NEW.email, '@', 1)
    );

    -- Extract avatar URL (Google OAuth provides 'picture' or 'avatar_url')
    v_avatar_url := COALESCE(
        NEW.raw_user_meta_data->>'avatar_url',
        NEW.raw_user_meta_data->>'picture'
    );

    v_phone := NEW.raw_user_meta_data->>'phone';
    v_default_role := COALESCE(NEW.raw_user_meta_data->>'default_role', 'poster');
    v_provider := COALESCE(NEW.raw_app_meta_data->>'provider', 'email');

    -- Google OAuth authenticated accounts start as verified
    IF v_provider = 'google' THEN
        v_verification := 'verified';
    ELSE
        v_verification := 'unverified';
    END IF;

    INSERT INTO public.profiles (
        id,
        full_name,
        email,
        phone,
        avatar_url,
        default_role,
        preferred_language,
        city,
        general_location,
        is_admin,
        is_worker_available,
        verification_status,
        rating_as_worker,
        total_reviews_as_worker,
        completed_tasks_as_worker,
        rating_as_requester,
        total_reviews_as_requester,
        completed_tasks_as_requester,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        v_full_name,
        NEW.email,
        v_phone,
        v_avatar_url,
        v_default_role,
        COALESCE(NEW.raw_user_meta_data->>'preferred_language', 'en'),
        COALESCE(NEW.raw_user_meta_data->>'city', 'Chennai'),
        COALESCE(NEW.raw_user_meta_data->>'general_location', 'Velachery, Chennai'),
        COALESCE((NEW.raw_user_meta_data->>'is_admin')::boolean, FALSE),
        TRUE,
        v_verification,
        5.00,
        0,
        0,
        5.00,
        0,
        0,
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name),
        avatar_url = COALESCE(public.profiles.avatar_url, EXCLUDED.avatar_url),
        verification_status = CASE 
            WHEN v_provider = 'google' THEN 'verified'::verification_status_enum 
            ELSE public.profiles.verification_status 
        END,
        updated_at = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-attach trigger on auth.users if auth schema is present
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
        DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
        CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    END IF;
END $$;

-- 3. Storage Bucket Configuration for User Avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage RLS Policies
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Public can view avatars" ON storage.objects;
    CREATE POLICY "Public can view avatars"
        ON storage.objects FOR SELECT
        USING (bucket_id = 'avatars');
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
    CREATE POLICY "Authenticated users can upload avatars"
        ON storage.objects FOR INSERT
        TO authenticated
        WITH CHECK (
            bucket_id = 'avatars' AND
            (storage.foldername(name))[1] = auth.uid()::text
        );
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
    CREATE POLICY "Users can update their own avatars"
        ON storage.objects FOR UPDATE
        TO authenticated
        USING (
            bucket_id = 'avatars' AND
            (storage.foldername(name))[1] = auth.uid()::text
        );
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- 4. Secure RLS Policy for Profiles Update
DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can update own profile safely" ON public.profiles;
    CREATE POLICY "Users can update own profile safely"
        ON public.profiles FOR UPDATE
        TO authenticated
        USING (auth.uid() = id)
        WITH CHECK (auth.uid() = id);
EXCEPTION WHEN OTHERS THEN NULL; END $$;
