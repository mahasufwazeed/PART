# PART – Leaflet.js + OpenStreetMap Migration Engineering Report

**Project:** PART – People At Right Time  
**Scope:** Migration of Geospatial Engine from MapLibre GL to Leaflet.js + OpenStreetMap  
**Author:** Senior React Engineer, Geospatial Systems Architect, and Supabase/PostGIS Developer  
**Status:** COMPLETE & VERIFIED (139/139 Tests Passing, Production Build Validated)

---

## 1. Executive Summary

The hyperlocal map engine of **PART – People At Right Time** has been migrated from MapLibre GL JS to **Leaflet.js + OpenStreetMap**, standardizing geospatial rendering across all client screens (`ExploreScreen`, `HomeScreen`, `LocationSelectorModal`, and `LiveTrackingSheet`).

All original PART UI/UX patterns, including the brand palette (#146B3A PART Emerald, #FFCC00 Electric Gold, #F7F8FA background), rounded 3xl map containers, multi-distance radius selectors (1 km, 3 km, 5 km, 10 km, 15 km, 25 km), INR task price badges (₹150, ₹250, ₹500, etc.), live worker tracking, and modal pin picker were fully preserved.

The client JavaScript production bundle size dropped from **2.06 MB** down to **998 kB** (-51.5% reduction), eliminating MapLibre GL WebGL canvas crashes, worker thread failures, and browser cross-domain tile mirror conflicts.

---

## 2. Original Architecture vs New Architecture

| Dimension | Previous Implementation (MapLibre GL) | New Implementation (Leaflet.js + OpenStreetMap) |
| :--- | :--- | :--- |
| **Rendering Technology** | WebGL 2.0 Canvas (`maplibre-gl`) | DOM / SVG / Canvas Raster (`leaflet` + `react-leaflet`) |
| **Tile System** | Geoapify Vector JSON styles with fragile raster fallback | OpenStreetMap Standard raster tiles (`tile.openstreetmap.org`) with Retina Geoapify OSM Bright tiles |
| **Dependencies** | `maplibre-gl@6.15.0`, `@types/maplibre-gl@1.13.2` | `leaflet@1.9.4`, `react-leaflet@4.2.1`, `@types/leaflet@1.9.22` |
| **React Compatibility** | React 18.3.1 (manual canvas lifecycle hooks) | React 18.3.1 (`react-leaflet@4.2.1` components with declarative JSX) |
| **Search Radius** | GeoJSON polygon approximated with 64 vertices | Native Leaflet `<Circle>` centered on active coordinates (in meters) |
| **Task Price Markers** | HTML elements attached to WebGL marker objects | Custom Leaflet `L.divIcon` displaying live Indian Rupee (INR) amounts |
| **Location State** | Split between `userLocation` and local map states | Unified `activeLocation` supporting 6 verified sources |
| **Bundle Size** | ~2.06 MB minified JS | ~998 kB minified JS (**-51.5% size reduction**) |

---

## 3. Files Modified & Created

### A. New Components & Tests Created
1. [`mobile/src/components/LeafletMapView.tsx`](file:///c:/Users/moham/Downloads/PART/mobile/src/components/LeafletMapView.tsx):
   * Unified declarative React Leaflet component powered by OpenStreetMap tiles.
   * Implements `<MapContainer>`, `<TileLayer>`, `<Marker>`, `<Popup>`, `<Circle>`, `<Polyline>`, custom zoom controls (+/-), floating GPS locator, layer switcher (OSM Standard, OSM Bright, Clean Light), draggable pin picker mode, and interactive task preview cards.
2. [`tests/leafletOsmMigration.test.ts`](file:///c:/Users/moham/Downloads/PART/tests/leafletOsmMigration.test.ts):
   * 20 automated tests validating tile URLs, legal OSM attribution, 6 location sources, radius calculations in meters, price marker formatting, Supabase query resilience, and campus coordinates.

### B. Existing Components Refactored
1. [`mobile/src/components/MapLibreView.tsx`](file:///c:/Users/moham/Downloads/PART/mobile/src/components/MapLibreView.tsx):
   * Replaced entire MapLibre GL implementation with a backward-compatible wrapper delegating to `LeafletMapView`.
2. [`mobile/src/components/RealtimeMap.tsx`](file:///c:/Users/moham/Downloads/PART/mobile/src/components/RealtimeMap.tsx):
   * Standardized to delegate directly to `LeafletMapView`, providing complete visual and functional parity across `HomeScreen` and simulations.
3. [`mobile/src/screens/ExploreScreen.tsx`](file:///c:/Users/moham/Downloads/PART/mobile/src/screens/ExploreScreen.tsx):
   * Removed MapLibre/Leaflet switcher; set Leaflet.js + OpenStreetMap as the unified map engine.
   * Integrated database error handling and `EmptyState` retry flow when Supabase queries fail.
4. [`mobile/src/components/LocationSelectorModal.tsx`](file:///c:/Users/moham/Downloads/PART/mobile/src/components/LocationSelectorModal.tsx):
   * Replaced mini pin picker with `LeafletMapView` in `isPickerMode={true}`.
   * Added dedicated quick chips for **Chennai Campuses & Universities** (`source: 'college'`) and **Profile Locality** (`source: 'profile'`).
5. [`mobile/src/components/LiveTrackingSheet.tsx`](file:///c:/Users/moham/Downloads/PART/mobile/src/components/LiveTrackingSheet.tsx):
   * Updated route navigation and worker live tracking to render via `LeafletMapView`.
6. [`shared/src/types/location.ts`](file:///c:/Users/moham/Downloads/PART/shared/src/types/location.ts):
   * Expanded `LocationSource` to explicitly include `'college'` and `'university'`.
7. [`shared/src/supabase/taskService.ts`](file:///c:/Users/moham/Downloads/PART/shared/src/supabase/taskService.ts) & [`shared/src/supabase/locationService.ts`](file:///c:/Users/moham/Downloads/PART/shared/src/supabase/locationService.ts):
   * Added direct table query fallback when `get_nearby_tasks` PostGIS RPC function is missing or returns 404.
   * Added `getLastQueryError()` and `clearLastQueryError()` for status reporting.
8. [`mobile/package.json`](file:///c:/Users/moham/Downloads/PART/mobile/package.json):
   * Installed `react-leaflet@4.2.1`.
   * Uninstalled `maplibre-gl` and `@types/maplibre-gl`.
   * Pinned `tailwindcss@3.4.17` for build stability.

---

## 4. Dependencies Audit

### Installed
* `react-leaflet@4.2.1`: Official React 18 bindings for Leaflet.js.
* `leaflet@1.9.4` (verified & preserved).
* `@types/leaflet@1.9.22` (verified & preserved).

### Removed
* `maplibre-gl@6.15.0`: Fully removed from `dependencies`.
* `@types/maplibre-gl@1.13.2`: Fully removed from `devDependencies`.

---

## 5. Implementation Details of Key Requirements

### 1. Centralized Location State (6 Verified Sources)
All map searches and task discoveries now synchronize with `useAppStore.activeLocation`:
* **GPS (`source: 'gps'`)**: Acquired via browser `navigator.geolocation` with high accuracy and reverse-geocoded Chennai locality label.
* **Search (`source: 'search'`)**: Acquired via Geoapify 250ms debounced address autocomplete or popular Chennai neighborhood chips.
* **Saved Address (`source: 'saved_address'`)**: Stored user addresses with labels (Home, Work, College).
* **College / University (`source: 'college'` / `'university'`)**: Dedicated Chennai institutions (Anna University Guindy, VELS University Pallavaram, IIT Madras Adyar, SRM Kattankulathur, Loyola College Nungambakkam).
* **Profile Locality (`source: 'profile'`)**: Registered account home locality.
* **Manual Map Pin (`source: 'map_pin'`)**: Draggable pin in `LocationSelectorModal` interactive mini map.

Whenever any location changes:
1. Active search coordinates update in global Zustand store.
2. Leaflet map smoothly re-centers using `useMap().flyTo()`.
3. Radius circle updates to exact meters (`radiusKm * 1000`).
4. Nearby tasks are re-fetched from database / PostGIS service.
5. Task price markers update on the map.
6. Task cards update in list view.
7. Result counter displays `Found X tasks within Ykm`.

### 2. Search Radius & Leaflet Circle
* Supported radius options: `1 km`, `3 km`, `5 km`, `10 km`, `15 km`, `25 km` (default: `5 km`).
* Displayed using Leaflet `<Circle>` with stroke `#146B3A`, fill `#146B3A`, opacity `0.08`, and dashArray `4 4`.
* Filter requests pass the exact radius to `locationService.getNearbyTasks(lat, lng, radiusKm)`.

### 3. Task Price Markers (INR)
* Markers display live prices using Indian Rupee format (e.g. `⚡ ₹150`, `⚡ ₹250`, `⚡ ₹500`, `⚡ ₹1,000`).
* Clicking any marker centers the view and displays:
  * Task title
  * Payout (`₹...`)
  * Distance (`... km`)
  * Category name and icon
  * Estimated duration (`... mins`)
  * Task status (`OPEN`)
  * 1-tap "View Details" button opening `TaskDetailsModal`.

### 4. Supabase Error Resilience (Issue Fixes)
1. **`/auth/v1/signup` 400**:
   * Resolved by validating email format and password length in frontend Zod schemas before submission, returning user-friendly messages for existing users.
2. **`profiles` 404 / PGRST116**:
   * Handled by auto-generating a fallback profile object if the Supabase Postgres trigger hasn't finished writing the user row.
3. **`get_nearby_tasks` & `tasks_within_radius` 404 / PGRST202**:
   * Added automated dual fallback: if the PostGIS RPC function is missing or encounters a schema cache 404, `taskService` automatically queries the `tasks` table directly with client-side Haversine distance filtering.
   * If both fail, an informative error banner is displayed with a "Retry Connection" button, ensuring the application never misleads the user with an empty screen when a database error occurs.

---

## 6. Verification and Test Results

### Automated Test Suite Execution
```text
✓ tests/stateMachine.test.ts (7 tests)
✓ tests/feeCalculator.test.ts (4 tests)
✓ tests/schemas.test.ts (5 tests)
✓ tests/geo.test.ts (2 tests)
✓ tests/googleAuthRepair.test.ts (13 tests)
✓ tests/campusCommunity.test.ts (13 tests)
✓ tests/authSystem.test.ts (17 tests)
✓ tests/leafletOsmMigration.test.ts (20 tests)
✓ tests/phase1AuditE2E.test.ts (11 tests)
✓ tests/marketplaceWorkflow.test.ts (5 tests)
✓ tests/universityOnboarding.test.ts (3 tests)
✓ tests/navigation.test.ts (6 tests)
✓ tests/locationSystem.test.ts (13 tests)
✓ tests/repairedMapSystem.test.ts (20 tests)

Test Files  14 passed (14)
     Tests  139 passed (139)
```

### TypeScript Typecheck & Production Build
```text
> npm run typecheck
✓ 0 errors across all workspaces

> npm run build
dist/index.html                   1.29 kB │ gzip:  0.76 kB
dist/assets/index-C9ZpPbxV.css   80.06 kB │ gzip: 17.45 kB
dist/assets/index-BpEhyOsw.js   998.23 kB │ gzip: 259.42 kB
✓ built in 1.69s
```

---

## 7. Production Deployment Instructions

1. **Environment Variables**:
   * `VITE_OSM_TILE_URL` (optional): Custom tile endpoint (defaults to official OSM raster tile URL).
   * `VITE_GEOAPIFY_API_KEY`: API key for Retina 2x OSM Bright tiles (fallback provided).
   * `VITE_SUPABASE_URL` & `VITE_SUPABASE_ANON_KEY`: Supabase production keys.
2. **Vercel / Hosting Deployment**:
   * Push changes to `main` branch; the GitHub Actions CI/CD pipeline in `.github/workflows/ci-cd.yml` will automatically validate tests and deploy.
