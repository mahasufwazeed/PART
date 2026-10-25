# PART – People At Right Time: Hyperlocal Map & Location System Repair Report

**Date:** October 25, 2026  
**System:** Hyperlocal Location, GPS, MapLibre GL, and Real-Time Task Discovery  
**Target City:** Chennai, Tamil Nadu, India  

---

## 1. Summary of Fixes Implemented

### Phase 2: Blank Map Resolution
* **Explicit Container Geometry**: In `MapLibreView.tsx`, added `minHeight: '440px'`, `position: 'relative'`, and `width: '100%'` to the map container to ensure proper WebGL canvas viewport creation across all mobile and desktop viewports.
* **Separated Raster Fallback Mirrors**: Removed conflicting OpenStreetMap tile mirrors from the Geoapify raster source definition in `MapLibreView.tsx`. When Geoapify vector fails, a pure OpenStreetMap raster source is cleanly attached.
* **Dynamic Layer & Source Re-attachment**: Attached an event listener for `style.load` and `styledata` so that whenever map styles are switched, all custom GeoJSON sources (`radius-circle-source`, `route-source`) and visual layers (`radius-fill`, `radius-stroke`, `route-line`) are dynamically and idempotently re-added.
* **Explicit Resource Cleanup**: Added marker tracking array (`markersRef`) with automatic `.remove()` on unmount and filter updates, eliminating WebGL memory leaks and orphan DOM nodes.

### Phase 3: Centralized ActiveLocation System
* **Unified Type Schema**: Created `Coordinates`, `LocationSource` (`'gps' | 'search' | 'profile' | 'saved_address' | 'map_pin'`), and `ActiveLocation` in `shared/src/types/location.ts`.
* **Single Source of Truth**: Extended `useAppStore.ts` with `activeLocation: ActiveLocation | null` and `setActiveLocation(location)`.
* **Full Component Synchronization**:
  * `LocationSelectorModal.tsx`: Selecting Velachery, Pallavaram, GPS, or a saved address updates `activeLocation`.
  * `PARTHeader.tsx`: Header locality label reads `activeLocation?.label || userLocation.locality`.
  * `ExploreScreen.tsx`: Queries nearby tasks using `activeLocation?.coordinates || userLocation`.
  * `HomeScreen.tsx`: Queries nearby tasks and centers the live map on `activeLocation?.coordinates`.
  * `MapLibreView.tsx` & `RealtimeMap.tsx`: Visual radius circles and markers center dynamically on active coordinates.

### Phase 4: GPS Geolocation Detection
* **High-Accuracy Geolocation**: Implemented `navigator.geolocation.getCurrentPosition` with `enableHighAccuracy: true`, `timeout: 10000`, and `maximumAge: 30000`.
* **Accuracy Tracking & Labeling**: Computed real accuracy in meters (`±${accuracy}m`) and included it in the active search label.
* **Resilient Error Recovery**: Handled `PERMISSION_DENIED`, `POSITION_UNAVAILABLE`, and `TIMEOUT` gracefully with explanatory user prompts and retry buttons without crashing or silently assuming George Town or central Chennai coordinates.

### Phase 5: Location Search & Autocomplete
* **Debounced Autocomplete**: Geoapify Autocomplete integration in `geoapifyService.ts` with 250ms debouncing, in-memory cache, and localStorage persistence.
* **Chennai Landmarks & Colleges Preset**: Added offline fallbacks for popular hubs including:
  * VELS University Pallavaram (`12.9565, 80.1601`)
  * Anna University Guindy (`13.0131, 80.2353`)
  * IIT Madras (`12.9915, 80.2337`)
  * SRM University (`12.8230, 80.0444`)
  * Ascendas Tech Park (`12.9863, 80.2432`)
  * Phoenix MarketCity Velachery (`12.9925, 80.2173`)
* **Keyboard Navigation**: Added `ArrowUp`, `ArrowDown`, and `Enter` keyboard controls for accessible search result selection in `LocationSelectorModal.tsx`.

### Phase 6: Saved Addresses Management
* **Comprehensive Address Schema**: Extended `SavedAddress` with `Home`, `Office`, `Work`, `College`, `University`, `Other`, along with `isDemo` and `isDefault` flags.
* **Full CRUD Operations**: Implemented `saveAddress`, `updateSavedAddress`, `setDefaultAddress`, and `deleteSavedAddress` (with `deleteAddress` alias) in `locationService.ts`.
* **Visual Demo Badges**: Pre-seeded demonstration addresses are clearly badged with a "Sample" chip in `LocationSelectorModal.tsx` so users understand they can customize or delete them.

### Phase 7: Standardized Search Radius
* **Shared Radius Options**: Standardized options across the platform to:
  $$\mathbf{1\text{ km} \mid 3\text{ km} \mid 5\text{ km} \mid 10\text{ km} \mid 15\text{ km} \mid 25\text{ km}}$$
  with default set to **5 km**.
* **Visual Polygon Circle**: Generated 64-vertex geodesic circle GeoJSON polygon dynamically recalculated whenever radius or center coordinates change.

### Phase 8 & 9: Live Price Markers & Nearby Discovery
* **Custom Price Pill Markers**: High-contrast, mobile-friendly green and yellow badges (`₹150`, `₹300`, `₹500`, `₹1,000`) formatted in Indian Numbering Format (`en-IN`).
* **Rich Task Preview Card**: Clicking any marker opens an interactive preview card displaying:
  * Task title and category
  * Budget with INR rupee symbol
  * Approximate distance in kilometers
  * Estimated duration in minutes
  * Task status chip (`OPEN`, `ASSIGNED`, etc.)
  * "View Details" action button navigating directly to the task details flow.
* **Actionable Empty State**: When 0 tasks exist in radius, PART displays:
  * Title: **No nearby tasks found**
  * Subtitle: **Try increasing your search radius or selecting another location.**
  * Actions: **Increase Radius** (steps up to next tier), **Change Location** (opens picker), and **Refresh Tasks**.

### Phase 10 & 11: Unified Data Source & Filter Synchronization
* **Single Source of Truth**: Map view and list view on `ExploreScreen.tsx` share identical filtered task datasets.
* **Race Condition Guard**: Request ID counter (`fetchRequestId.current`) prevents stale out-of-order API responses from overwriting newer query results.
* **IST Timezone Today Filter**: Filter uses Chennai local time (`Asia/Kolkata`) via `Intl.DateTimeFormat('en-CA')` instead of UTC `toISOString().split('T')[0]`.
* **Correct Sorters**:
  * `Nearest`: sorted by `distance_km ASC`
  * `Highest Pay`: sorted by `budget_inr DESC`
  * `Newest`: sorted by `created_at DESC`
  * `Quick (< 1 hr)`: filtered for `<= 60 min` and sorted by `distance_km ASC`
  * `Today`: filtered for today's date in IST and sorted by `distance_km ASC`.

### Phase 12: Location-Based Task Creation
* **Fixed Parameter Order**: Corrected call in `PostTaskScreen.tsx` and updated `taskService.createTask` to handle both `(requesterId, input)` and `(input, requesterId)`.
* **Location Modal Integration**: Selecting a location in `LocationSelectorModal` populates `locality`, `address_approximate`, `latitude`, and `longitude` in the task creation form.
* **Collision-Free Unique IDs**: Fixed ID generation with `task-${Date.now()}-${random}` to prevent sequential task overwrites.

### Phase 15: Real-Time Updates
* **Live Task Dispatcher**: Added `taskService.subscribeToTasks` and broadcast dispatchers to automatically refresh task counts, markers, and cards when new tasks are posted.

---

## 2. Issues Resolved

| Issue ID | Description | Resolution |
| :--- | :--- | :--- |
| **ISS-01** | Blank MapLibre canvas | Fixed container dimensions, raster fallback tile structure, and dynamic layer re-attachment on style load. |
| **ISS-02** | Missing `updateUserProfileLocation` crash | Implemented `updateUserProfileLocation` in `locationService.ts` updating both local and remote profile state. |
| **ISS-03** | Task creation parameter order mismatch | Made `taskService.createTask` accept flexible arguments in either order. |
| **ISS-04** | Rapid task posting collision | Replaced `task-${Date.now()}` with collision-free unique IDs. |
| **ISS-05** | Inconsistent radius choices | Standardized to `[1, 3, 5, 10, 15, 25]` km across all screens and components. |
| **ISS-06** | Stale race conditions in task search | Implemented monotonic request ID tracking in `ExploreScreen.tsx`. |
| **ISS-07** | UTC vs IST date bug in "Today" filter | Switched to `Asia/Kolkata` timezone date formatting. |
| **ISS-08** | Autocomplete failure for colleges | Added preset fallbacks for VELS University Pallavaram, Anna University, IIT Madras, etc. |

---

## 3. Remaining Limitations & Production Notes

1. **Remote Supabase DDL Migration**:
   * The remote Supabase instance (`wfjbetswwgfyqmsoltva.supabase.co`) currently lacks the `public.tasks`, `public.task_locations`, and `public.saved_addresses` tables in its schema cache.
   * PART operates reliably via its resilient in-memory sandbox store fallback. To migrate the remote PostgreSQL instance, run the migration script provided below using the Supabase SQL Editor.
2. **Geoapify Domain Referrer Restrictions**:
   * For production launch on Render (`*.render.com`) or custom domains, configure HTTP Referrer restrictions in the Geoapify dashboard for API key `2de1be4fe30a4f60a1b12fb57cb6a2f1`.

---

## 4. Verification Evidence

### Automated Test Suite Execution
* **Tool**: Vitest v1.6.1
* **Command**: `npm test`
* **Result**: **12 test files passed, 106 tests passed, 0 failures.**
* **Execution Duration**: 5.07 seconds.

### Typecheck & Production Build
* **TypeScript Check**: `npm run typecheck` exited with code 0 across all workspaces.
* **Vite Production Build**: `npm run build` completed in 9.66s:
  * `dist/index.html`: 1.30 kB
  * `dist/assets/index-Bbnbz4Uq.css`: 154.75 kB
  * `dist/assets/index-CFMQEFJT.js`: 2,060.24 kB

---

## 5. Production Database Migration Script (PostgreSQL + PostGIS)

To sync the remote Supabase project with PostGIS spatial indexing, execute the following script in the Supabase SQL Editor:

```sql
-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. Tasks Table
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL,
  title VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  budget_inr NUMERIC(10, 2) NOT NULL CHECK (budget_inr >= 50),
  estimated_duration_minutes INT NOT NULL,
  preferred_date DATE NOT NULL,
  preferred_time_window VARCHAR(50),
  required_workers_count INT DEFAULT 1,
  assigned_workers_count INT DEFAULT 0,
  required_skills TEXT[] DEFAULT '{}',
  special_instructions TEXT,
  status VARCHAR(30) DEFAULT 'OPEN',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Task Locations Table with PostGIS Point
CREATE TABLE IF NOT EXISTS public.task_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE UNIQUE,
  city VARCHAR(50) DEFAULT 'Chennai',
  locality VARCHAR(100) NOT NULL,
  address_approximate TEXT NOT NULL,
  address_exact TEXT,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  geom GEOMETRY(Point, 4326) GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)) STORED,
  postal_code VARCHAR(10),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_task_locations_geom ON public.task_locations USING GIST(geom);

-- 3. Saved Addresses Table
CREATE TABLE IF NOT EXISTS public.saved_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label VARCHAR(50) NOT NULL,
  title VARCHAR(100) NOT NULL,
  address_line TEXT NOT NULL,
  locality VARCHAR(100) NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. PostGIS RPC Function for Nearby Tasks
CREATE OR REPLACE FUNCTION public.get_nearby_tasks(
  p_user_lat DOUBLE PRECISION,
  p_user_lng DOUBLE PRECISION,
  p_radius_km DOUBLE PRECISION DEFAULT 20,
  p_category_id UUID DEFAULT NULL,
  p_min_budget NUMERIC DEFAULT 0,
  p_max_budget NUMERIC DEFAULT 100000
)
RETURNS TABLE (
  task_id UUID,
  requester_id UUID,
  category_id UUID,
  title VARCHAR,
  description TEXT,
  budget_inr NUMERIC,
  estimated_duration_minutes INT,
  preferred_date DATE,
  preferred_time_window VARCHAR,
  required_workers_count INT,
  assigned_workers_count INT,
  status VARCHAR,
  created_at TIMESTAMPTZ,
  distance_km DOUBLE PRECISION,
  locality VARCHAR,
  address_approximate TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id AS task_id,
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
    t.status,
    t.created_at,
    (ST_Distance(
      loc.geom::geography,
      ST_SetSRID(ST_MakePoint(p_user_lng, p_user_lat), 4326)::geography
    ) / 1000.0) AS distance_km,
    loc.locality,
    loc.address_approximate,
    loc.latitude,
    loc.longitude
  FROM public.tasks t
  JOIN public.task_locations loc ON loc.task_id = t.id
  WHERE t.status = 'OPEN'
    AND (p_category_id IS NULL OR t.category_id = p_category_id)
    AND t.budget_inr BETWEEN p_min_budget AND p_max_budget
    AND ST_DWithin(
      loc.geom::geography,
      ST_SetSRID(ST_MakePoint(p_user_lng, p_user_lat), 4326)::geography,
      p_radius_km * 1000.0
    )
  ORDER BY distance_km ASC;
END;
$$;
```
