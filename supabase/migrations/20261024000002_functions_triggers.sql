-- ============================================================================
-- PART – People At Right Time
-- Migration: 20261024000002_functions_triggers.sql
-- Server Stored Procedures, Triggers, Geospatial Discovery & Concurrency Control
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Automatic Profile Creation on Signup
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (
        id,
        full_name,
        preferred_language,
        city,
        general_location,
        is_admin,
        is_worker_available,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'preferred_language', 'en'),
        COALESCE(NEW.raw_user_meta_data->>'city', 'Chennai'),
        NEW.raw_user_meta_data->>'general_location',
        COALESCE((NEW.raw_user_meta_data->>'is_admin')::boolean, FALSE),
        TRUE,
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger hook on auth.users (runs if auth schema exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
        DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
        CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 2. Geospatial Discovery: get_nearby_tasks
-- High-performance spatial query with Haversine formula calculation in kilometers
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_nearby_tasks(
    p_user_lat DOUBLE PRECISION,
    p_user_lng DOUBLE PRECISION,
    p_radius_km DOUBLE PRECISION DEFAULT 20.0,
    p_category_id UUID DEFAULT NULL,
    p_min_budget NUMERIC DEFAULT 0,
    p_max_budget NUMERIC DEFAULT 100000,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    task_id UUID,
    title TEXT,
    description TEXT,
    budget_inr NUMERIC,
    estimated_duration_minutes INTEGER,
    preferred_date DATE,
    preferred_time_window TEXT,
    required_workers_count INTEGER,
    assigned_workers_count INTEGER,
    status task_status_enum,
    category_id UUID,
    category_name_en TEXT,
    category_name_ta TEXT,
    category_icon TEXT,
    locality TEXT,
    address_approximate TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    distance_km DOUBLE PRECISION,
    created_at TIMESTAMPTZ,
    requester_id UUID,
    requester_name TEXT,
    requester_rating NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    WITH task_distances AS (
        SELECT
            t.id AS t_task_id,
            t.title AS t_title,
            t.description AS t_description,
            t.budget_inr AS t_budget_inr,
            t.estimated_duration_minutes AS t_estimated_duration_minutes,
            t.preferred_date AS t_preferred_date,
            t.preferred_time_window AS t_preferred_time_window,
            t.required_workers_count AS t_required_workers_count,
            t.assigned_workers_count AS t_assigned_workers_count,
            t.status AS t_status,
            t.category_id AS t_category_id,
            cat.name_en AS t_category_name_en,
            cat.name_ta AS t_category_name_ta,
            cat.icon AS t_category_icon,
            loc.locality AS t_locality,
            loc.address_approximate AS t_address_approximate,
            loc.latitude AS t_latitude,
            loc.longitude AS t_longitude,
            ROUND(
                (6371 * acos(
                    LEAST(1.0, GREATEST(-1.0,
                        cos(radians(p_user_lat)) * cos(radians(loc.latitude)) *
                        cos(radians(loc.longitude) - radians(p_user_lng)) +
                        sin(radians(p_user_lat)) * sin(radians(loc.latitude))
                    ))
                ))::numeric, 1
            )::double precision AS t_distance_km,
            t.created_at AS t_created_at,
            p.id AS t_requester_id,
            p.full_name AS t_requester_name,
            p.rating_as_requester AS t_requester_rating
        FROM public.tasks t
        JOIN public.task_locations loc ON loc.task_id = t.id
        JOIN public.task_categories cat ON cat.id = t.category_id
        JOIN public.profiles p ON p.id = t.requester_id
        WHERE t.status = 'OPEN'
          AND (p_category_id IS NULL OR t.category_id = p_category_id)
          AND (t.budget_inr >= p_min_budget AND t.budget_inr <= p_max_budget)
    )
    SELECT
        td.t_task_id,
        td.t_title,
        td.t_description,
        td.t_budget_inr,
        td.t_estimated_duration_minutes,
        td.t_preferred_date,
        td.t_preferred_time_window,
        td.t_required_workers_count,
        td.t_assigned_workers_count,
        td.t_status,
        td.t_category_id,
        td.t_category_name_en,
        td.t_category_name_ta,
        td.t_category_icon,
        td.t_locality,
        td.t_address_approximate,
        td.t_latitude,
        td.t_longitude,
        td.t_distance_km,
        td.t_created_at,
        td.t_requester_id,
        td.t_requester_name,
        td.t_requester_rating
    FROM task_distances td
    WHERE td.t_distance_km <= p_radius_km
    ORDER BY td.t_distance_km ASC, td.t_created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- 3. Concurrency-Safe Worker Assignment with Row Locks
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.assign_worker_to_task(
    p_task_id UUID,
    p_worker_id UUID,
    p_application_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_task RECORD;
    v_new_assignment_id UUID;
    v_conversation_id UUID;
    v_new_status task_status_enum;
BEGIN
    -- Acquire exclusive row lock on task to prevent race conditions
    SELECT * INTO v_task
    FROM public.tasks
    WHERE id = p_task_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Task not found: %', p_task_id;
    END IF;

    -- Verify requester permission
    IF v_task.requester_id <> auth.uid() AND NOT public.is_admin_user() THEN
        RAISE EXCEPTION 'Only task requester or admin can assign workers';
    END IF;

    -- Prevent self-assignment
    IF v_task.requester_id = p_worker_id THEN
        RAISE EXCEPTION 'Requesters cannot assign tasks to themselves';
    END IF;

    -- Check capacity
    IF v_task.assigned_workers_count >= v_task.required_workers_count THEN
        RAISE EXCEPTION 'Task has reached maximum worker capacity (% workers)', v_task.required_workers_count;
    END IF;

    -- Check if worker is already assigned
    IF EXISTS (
        SELECT 1 FROM public.task_assignments
        WHERE task_id = p_task_id AND worker_id = p_worker_id
    ) THEN
        RAISE EXCEPTION 'Worker is already assigned to this task';
    END IF;

    -- Insert assignment record
    INSERT INTO public.task_assignments (
        task_id,
        worker_id,
        application_id,
        status,
        agreed_rate_inr,
        assigned_at
    ) VALUES (
        p_task_id,
        p_worker_id,
        p_application_id,
        'assigned',
        v_task.budget_inr,
        NOW()
    ) RETURNING id INTO v_new_assignment_id;

    -- Update application status if provided
    IF p_application_id IS NOT NULL THEN
        UPDATE public.task_applications
        SET status = 'accepted', updated_at = NOW()
        WHERE id = p_application_id;
    END IF;

    -- Calculate updated task status
    v_new_status := 'ASSIGNED';

    UPDATE public.tasks
    SET
        assigned_workers_count = assigned_workers_count + 1,
        status = v_new_status,
        updated_at = NOW()
    WHERE id = p_task_id;

    -- Create or find conversation for this task
    SELECT id INTO v_conversation_id
    FROM public.conversations
    WHERE task_id = p_task_id
    LIMIT 1;

    IF v_conversation_id IS NULL THEN
        INSERT INTO public.conversations (task_id)
        VALUES (p_task_id)
        RETURNING id INTO v_conversation_id;

        -- Add requester to conversation
        INSERT INTO public.conversation_participants (conversation_id, user_id)
        VALUES (v_conversation_id, v_task.requester_id);
    END IF;

    -- Ensure assigned worker is in conversation participants
    INSERT INTO public.conversation_participants (conversation_id, user_id)
    VALUES (v_conversation_id, p_worker_id)
    ON CONFLICT (conversation_id, user_id) DO NOTHING;

    -- Create in-app notification for worker
    INSERT INTO public.notifications (
        user_id,
        title,
        body,
        event_type,
        reference_type,
        reference_id
    ) VALUES (
        p_worker_id,
        'You have been selected for a task!',
        format('You were assigned to "%s". Tap to review details and begin.', v_task.title),
        'task_assigned',
        'task',
        p_task_id::text
    );

    RETURN jsonb_build_object(
        'success', true,
        'assignment_id', v_new_assignment_id,
        'task_id', p_task_id,
        'conversation_id', v_conversation_id,
        'status', v_new_status
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- 4. Status History Tracking Trigger
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.log_task_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO public.task_status_history (
            task_id,
            previous_status,
            new_status,
            changed_by,
            notes
        ) VALUES (
            NEW.id,
            OLD.status,
            NEW.status,
            COALESCE(auth.uid(), NEW.requester_id),
            format('Status changed from %s to %s', OLD.status, NEW.status)
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_log_task_status_change ON public.tasks;
CREATE TRIGGER trg_log_task_status_change
AFTER UPDATE ON public.tasks
FOR EACH ROW EXECUTE FUNCTION public.log_task_status_change();

-- ----------------------------------------------------------------------------
-- 5. Dynamic Profile Rating Recalculation
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_profile_rating_on_review()
RETURNS TRIGGER AS $$
DECLARE
    v_avg NUMERIC(3,2);
    v_count INTEGER;
BEGIN
    IF NEW.role_reviewed = 'worker' THEN
        SELECT ROUND(AVG(rating)::numeric, 2), COUNT(*)
        INTO v_avg, v_count
        FROM public.reviews
        WHERE reviewee_id = NEW.reviewee_id AND role_reviewed = 'worker';

        UPDATE public.profiles
        SET
            rating_as_worker = COALESCE(v_avg, 5.00),
            total_reviews_as_worker = v_count,
            completed_tasks_as_worker = completed_tasks_as_worker + 1
        WHERE id = NEW.reviewee_id;
    ELSE
        SELECT ROUND(AVG(rating)::numeric, 2), COUNT(*)
        INTO v_avg, v_count
        FROM public.reviews
        WHERE reviewee_id = NEW.reviewee_id AND role_reviewed = 'requester';

        UPDATE public.profiles
        SET
            rating_as_requester = COALESCE(v_avg, 5.00),
            total_reviews_as_requester = v_count,
            completed_tasks_as_requester = completed_tasks_as_requester + 1
        WHERE id = NEW.reviewee_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_update_rating_on_review ON public.reviews;
CREATE TRIGGER trg_update_rating_on_review
AFTER INSERT ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.update_profile_rating_on_review();
