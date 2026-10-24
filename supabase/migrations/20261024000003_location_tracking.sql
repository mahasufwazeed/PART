-- ============================================================================
-- PART Hyperlocal Task Marketplace
-- Migration: 20261024000003_location_tracking.sql
-- Description: PostGIS Saved Addresses, Live Worker Location Tracking & RLS Policies
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS postgis;

-- ----------------------------------------------------------------------------
-- 1. SAVED ADDRESSES TABLE (Home, Work, Other)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.saved_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  label TEXT NOT NULL CHECK (label IN ('Home', 'Work', 'Other')),
  title TEXT NOT NULL,
  address_line TEXT NOT NULL,
  locality TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  location GEOMETRY(Point, 4326) GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)) STORED,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indices for fast geospatial lookups & user queries
CREATE INDEX IF NOT EXISTS idx_saved_addresses_user_id ON public.saved_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_addresses_location ON public.saved_addresses USING GIST(location);

-- Enable RLS
ALTER TABLE public.saved_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view and manage their own saved addresses"
  ON public.saved_addresses
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 2. LIVE WORKER TRACKING TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.task_worker_locations (
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  worker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  location GEOMETRY(Point, 4326) GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)) STORED,
  heading DOUBLE PRECISION,
  speed DOUBLE PRECISION,
  accuracy DOUBLE PRECISION,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (task_id, worker_id)
);

CREATE INDEX IF NOT EXISTS idx_task_worker_locations_location ON public.task_worker_locations USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_task_worker_locations_updated_at ON public.task_worker_locations(updated_at DESC);

-- Enable RLS on Worker Locations
ALTER TABLE public.task_worker_locations ENABLE ROW LEVEL SECURITY;

-- Only authorized participants (task requester or assigned worker) can view coordinates,
-- and ONLY while task is in active state (ASSIGNED or IN_PROGRESS).
CREATE POLICY "Authorized task participants can view live worker location"
  ON public.task_worker_locations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.id = task_worker_locations.task_id
        AND (t.requester_id = auth.uid() OR t.assigned_worker_id = auth.uid())
        AND t.status IN ('ASSIGNED', 'IN_PROGRESS')
    )
  );

-- Only assigned worker can insert/update live coordinates, and only during active task
CREATE POLICY "Assigned worker can update live location for active task"
  ON public.task_worker_locations
  FOR ALL
  TO authenticated
  USING (
    auth.uid() = worker_id AND
    EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.id = task_worker_locations.task_id
        AND t.assigned_worker_id = auth.uid()
        AND t.status IN ('ASSIGNED', 'IN_PROGRESS')
    )
  )
  WITH CHECK (
    auth.uid() = worker_id AND
    EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.id = task_worker_locations.task_id
        AND t.assigned_worker_id = auth.uid()
        AND t.status IN ('ASSIGNED', 'IN_PROGRESS')
    )
  );

-- ----------------------------------------------------------------------------
-- 3. POSTGIS NEARBY TASKS DISCOVERY FUNCTION (1, 3, 5, 10 km)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_nearby_tasks_within_radius(
  p_lat DOUBLE PRECISION,
  p_lng DOUBLE PRECISION,
  p_radius_km DOUBLE PRECISION DEFAULT 5.0
)
RETURNS TABLE (
  id UUID,
  requester_id UUID,
  category_id UUID,
  title TEXT,
  description TEXT,
  budget_inr NUMERIC,
  estimated_duration_minutes INTEGER,
  preferred_date DATE,
  preferred_time_window TEXT,
  required_workers_count INTEGER,
  assigned_workers_count INTEGER,
  required_skills TEXT[],
  special_instructions TEXT,
  status task_status,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  distance_km DOUBLE PRECISION,
  locality TEXT,
  address_approximate TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    t.id,
    t.requester_id,
    t.category_id,
    t.title,
    t.description,
    t.budget_inr,
    t.estimated_duration_minutes,
    t.preferred_date,
    t.preferred_time_window,
    t.required_workers_count,
    t.assigned_workers_count,
    t.required_skills,
    t.special_instructions,
    t.status,
    t.created_at,
    t.updated_at,
    ROUND((ST_Distance(
      tl.location::geography,
      ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography
    ) / 1000.0)::numeric, 2)::DOUBLE PRECISION AS distance_km,
    tl.locality,
    tl.address_approximate,
    tl.latitude,
    tl.longitude
  FROM public.tasks t
  JOIN public.task_locations tl ON tl.task_id = t.id
  WHERE t.status = 'OPEN'
    AND ST_DWithin(
      tl.location::geography,
      ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
      p_radius_km * 1000.0
    )
  ORDER BY distance_km ASC;
$$;

-- ----------------------------------------------------------------------------
-- 4. REALTIME PUBLICATION REPLICATION
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.task_worker_locations;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
