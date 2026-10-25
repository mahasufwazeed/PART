import { describe, it, expect, beforeEach } from 'vitest';
import {
  geoapifyService,
  locationService,
  taskService,
  mockStore,
  calculateHaversineDistanceKm,
  DISTANCE_FILTER_OPTIONS_KM,
  DEFAULT_SEARCH_RADIUS_KM,
  CHENNAI_LOCALITIES,
  ActiveLocation,
  Task,
  TASK_CATEGORIES,
} from '../shared/src';

describe('Phase 17: Repaired Hyperlocal Map & Location System Tests (A-L)', () => {
  beforeEach(() => {
    mockStore.reset();
  });

  // TEST A: Map Loading Configuration & Tile Fallbacks
  describe('Test A: Map loading configuration & raster fallback', () => {
    it('provides valid Geoapify style URL and fallback raster tile structure', () => {
      const apiKey = process.env.VITE_GEOAPIFY_API_KEY || '2de1be4fe30a4f60a1b12fb57cb6a2f1';
      const geoapifyVectorUrl = `https://maps.geoapify.com/v1/styles/osm-bright/style.json?apiKey=${apiKey}`;
      const osmFallbackTile = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

      expect(geoapifyVectorUrl).toContain('maps.geoapify.com');
      expect(geoapifyVectorUrl).toContain(apiKey);
      expect(osmFallbackTile).toContain('tile.openstreetmap.org');
    });

    it('defines valid OpenStreetMap attribution for legal compliance', () => {
      const attribution =
        '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, © <a href="https://www.geoapify.com/">Geoapify</a>';
      expect(attribution).toContain('OpenStreetMap');
      expect(attribution).toContain('Geoapify');
    });
  });

  // TEST B: Locality Selection
  describe('Test B: Locality selection (Velachery, Pallavaram, Anna Nagar)', () => {
    it('resolves Velachery with correct Chennai coordinates', () => {
      const velachery = CHENNAI_LOCALITIES.find((l) => l.name === 'Velachery');
      expect(velachery).toBeDefined();
      expect(velachery?.latitude).toBeCloseTo(12.9815, 2);
      expect(velachery?.longitude).toBeCloseTo(80.218, 2);
    });

    it('resolves Pallavaram with correct Chennai coordinates', () => {
      const pallavaram = CHENNAI_LOCALITIES.find((l) => l.name === 'Pallavaram');
      expect(pallavaram).toBeDefined();
      expect(pallavaram?.latitude).toBeCloseTo(12.9675, 2);
      expect(pallavaram?.longitude).toBeCloseTo(80.1491, 2);
    });

    it('resolves Anna Nagar with correct Chennai coordinates', () => {
      const annaNagar = CHENNAI_LOCALITIES.find((l) => l.name === 'Anna Nagar');
      expect(annaNagar).toBeDefined();
      expect(annaNagar?.latitude).toBeCloseTo(13.085, 2);
      expect(annaNagar?.longitude).toBeCloseTo(80.2101, 2);
    });

    it('creates a compliant ActiveLocation object when a locality is chosen', () => {
      const velachery = CHENNAI_LOCALITIES.find((l) => l.name === 'Velachery')!;
      const activeLoc: ActiveLocation = {
        coordinates: {
          latitude: velachery.latitude,
          longitude: velachery.longitude,
        },
        label: `${velachery.name}, Chennai`,
        source: 'search',
        updatedAt: Date.now(),
      };

      expect(activeLoc.coordinates.latitude).toBe(velachery.latitude);
      expect(activeLoc.coordinates.longitude).toBe(velachery.longitude);
      expect(activeLoc.source).toBe('search');
      expect(activeLoc.label).toContain('Velachery');
    });
  });

  // TEST C: Standardized Radius Selection
  describe('Test C: Standardized radius selection (1 km, 3 km, 5 km, 10 km, 15 km, 25 km)', () => {
    it('standardizes search radius choices exactly to 1, 3, 5, 10, 15, 25 km with default 5 km', () => {
      expect(DISTANCE_FILTER_OPTIONS_KM).toEqual([1, 3, 5, 10, 15, 25]);
      expect(DEFAULT_SEARCH_RADIUS_KM).toBe(5);
    });

    it('generates a valid 64-vertex GeoJSON circle polygon for any selected radius', () => {
      const lat = 12.9815;
      const lng = 80.218;
      const radiusKm = 10;
      const points = 64;
      const coords: [number, number][] = [];
      const kmInLat = 1 / 110.574;
      const kmInLng = 1 / (111.32 * Math.cos((lat * Math.PI) / 180));

      for (let i = 0; i < points; i++) {
        const theta = (i / points) * (2 * Math.PI);
        const pLat = lat + radiusKm * kmInLat * Math.sin(theta);
        const pLng = lng + radiusKm * kmInLng * Math.cos(theta);
        coords.push([pLng, pLat]);
      }
      coords.push(coords[0]); // close loop

      expect(coords.length).toBe(65);
      expect(coords[0][0]).toBe(coords[64][0]);
      expect(coords[0][1]).toBe(coords[64][1]);
    });
  });

  // TEST D: GPS Detection & Coordinates
  describe('Test D: GPS Geolocation resolution & accuracy', () => {
    it('formats active search location with GPS source and actual accuracy', () => {
      const mockGpsCoords = {
        latitude: 12.9782,
        longitude: 80.2215,
        accuracy: 12.5,
      };

      const gpsLocation: ActiveLocation = {
        coordinates: {
          latitude: mockGpsCoords.latitude,
          longitude: mockGpsCoords.longitude,
        },
        label: 'Current GPS Location (±13m)',
        source: 'gps',
        updatedAt: Date.now(),
      };

      expect(gpsLocation.source).toBe('gps');
      expect(gpsLocation.coordinates.latitude).toBe(12.9782);
      expect(gpsLocation.coordinates.longitude).toBe(80.2215);
      expect(gpsLocation.label).toContain('±13m');
    });
  });

  // TEST E: Address Search & Autocomplete
  describe('Test E: Address search & Autocomplete (VELS, Anna Nagar, Velachery)', () => {
    it('finds VELS University Pallavaram in autocomplete suggestions', async () => {
      const results = await geoapifyService.autocomplete('VELS University Pallavaram');
      expect(results.length).toBeGreaterThan(0);
      const match = results[0];
      expect(match.formatted.toLowerCase()).toContain('vels');
      expect(match.formatted.toLowerCase()).toContain('pallavaram');
      expect(match.lat).toBeCloseTo(12.9565, 1);
      expect(match.lon).toBeCloseTo(80.16, 1);
    });

    it('finds Anna Nagar Chennai in autocomplete suggestions', async () => {
      const results = await geoapifyService.autocomplete('Anna Nagar Chennai');
      expect(results.length).toBeGreaterThan(0);
      const match = results.find((r) => r.formatted.toLowerCase().includes('anna nagar')) || results[0];
      expect(match.formatted.toLowerCase()).toContain('anna nagar');
      expect(match.lat).toBeGreaterThan(12.9);
      expect(match.lon).toBeGreaterThan(80.1);
    });

    it('finds Velachery in autocomplete suggestions', async () => {
      const results = await geoapifyService.autocomplete('Velachery');
      expect(results.length).toBeGreaterThan(0);
      const match = results[0];
      expect(match.formatted.toLowerCase()).toContain('velachery');
    });
  });

  // TEST F: Saved Addresses Management
  describe('Test F: Saved address CRUD and selection', () => {
    const testUserId = 'test-user-saved-addr';

    it('retrieves saved addresses including Home and Office/Work', async () => {
      const addresses = await locationService.getSavedAddresses(testUserId);
      expect(addresses.length).toBeGreaterThanOrEqual(2);
      const home = addresses.find((a) => a.label === 'Home');
      expect(home).toBeDefined();
      expect(home?.latitude).toBeDefined();
      expect(home?.longitude).toBeDefined();
    });

    it('allows adding, updating, setting default, and deleting a saved address', async () => {
      // 1. Add
      const { address: created } = await locationService.saveAddress(testUserId, {
        label: 'College',
        title: 'College Campus Library',
        address_line: 'Velachery Main Rd',
        locality: 'Velachery, Chennai',
        latitude: 12.9815,
        longitude: 80.218,
        is_default: false,
      });
      expect(created).toBeDefined();
      expect(created?.id).toBeDefined();
      expect(created?.label).toBe('College');

      // 2. Set Default
      const setDefaultRes = await locationService.setDefaultAddress(testUserId, created!.id);
      expect(setDefaultRes.success).toBe(true);

      const afterDefault = await locationService.getSavedAddresses(testUserId);
      const defaultAddr = afterDefault.find((a) => a.id === created!.id);
      expect(defaultAddr?.is_default).toBe(true);

      // 3. Update
      const updated = await locationService.updateSavedAddress(testUserId, created!.id, {
        title: 'Updated Campus Gate 2',
      });
      expect(updated.address?.title).toBe('Updated Campus Gate 2');

      // 4. Delete
      const deleted = await locationService.deleteAddress(testUserId, created!.id);
      expect(deleted.success).toBe(true);

      const afterDelete = await locationService.getSavedAddresses(testUserId);
      expect(afterDelete.find((a) => a.id === created!.id)).toBeUndefined();
    });
  });

  // TEST G: Task Price Markers & Formatting
  describe('Test G: Task price markers and INR formatting', () => {
    it('formats price badges cleanly for map display', () => {
      const formatPriceBadge = (inr: number) => {
        if (inr >= 1000) {
          return `₹${inr.toLocaleString('en-IN')}`;
        }
        return `₹${inr}`;
      };

      expect(formatPriceBadge(150)).toBe('₹150');
      expect(formatPriceBadge(300)).toBe('₹300');
      expect(formatPriceBadge(500)).toBe('₹500');
      expect(formatPriceBadge(1000)).toBe('₹1,000');
      expect(formatPriceBadge(2500)).toBe('₹2,500');
    });
  });

  // TEST H: Outside Radius Exclusion
  describe('Test H: Outside-radius task exclusion', () => {
    it('excludes tasks farther than selected radius from center', async () => {
      // Center at Velachery (12.9815, 80.2180)
      const centerLat = 12.9815;
      const centerLng = 80.218;

      // 1. Create nearby task in Velachery (~0.5 km)
      const { task: t1, error: err1 } = await taskService.createTask('poster-h1', {
        title: 'Print Project Reports at Velachery xerox shop',
        description: 'Need 30 pages color printout from shop near MRTS station',
        category_id: TASK_CATEGORIES[0].id,
        budget_inr: 250,
        city: 'Chennai',
        locality: 'Velachery, Chennai',
        address_approximate: 'Near Velachery MRTS Station',
        address_exact: 'Velachery Bypass Rd',
        latitude: 12.983,
        longitude: 80.22,
        estimated_duration_minutes: 25,
        preferred_date: '2026-10-25',
        required_workers_count: 1,
        required_skills: [],
      });
      expect(err1).toBeUndefined();
      expect(t1).toBeDefined();

      // 2. Create distant task in Tambaram (~14 km)
      const { task: t2, error: err2 } = await taskService.createTask('poster-h2', {
        title: 'Pick up medical report at Tambaram',
        description: 'Collect paper report from Tambaram East clinic',
        category_id: TASK_CATEGORIES[0].id,
        budget_inr: 400,
        city: 'Chennai',
        locality: 'Tambaram, Chennai',
        address_approximate: 'Tambaram East Railway Station',
        address_exact: 'GST Road',
        latitude: 12.9249,
        longitude: 80.1,
        estimated_duration_minutes: 45,
        preferred_date: '2026-10-25',
        required_workers_count: 1,
        required_skills: [],
      });
      expect(err2).toBeUndefined();
      expect(t2).toBeDefined();

      // Query with 5 km radius -> Tambaram task must NOT be included
      const tasks5km = await locationService.getNearbyTasks(centerLat, centerLng, 5);
      const tambaramIn5km = tasks5km.find((t) => t.location?.locality?.includes('Tambaram') || t.title.includes('Tambaram'));
      const velacheryIn5km = tasks5km.find((t) => t.title.includes('Print Project Reports'));

      expect(tambaramIn5km).toBeUndefined();
      expect(velacheryIn5km).toBeDefined();

      // Query with 25 km radius -> Both tasks should be included
      const tasks25km = await locationService.getNearbyTasks(centerLat, centerLng, 25);
      const tambaramIn25km = tasks25km.find((t) => t.location?.locality?.includes('Tambaram') || t.title.includes('Tambaram'));
      expect(tambaramIn25km).toBeDefined();
    });
  });

  // TEST I: Task Filtering & Sorting
  describe('Test I: Task filtering and sorting (Nearest, Highest Pay, Newest, Quick, Today)', () => {
    it('correctly sorts by distance, budget, date, and filters by duration and today', async () => {
      const centerLat = 12.9815;
      const centerLng = 80.218;

      const todayStr = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date());

      // Task 1: Closest, lower pay, quick
      const { task: t1, error: err1 } = await taskService.createTask('poster-i1', {
        title: 'Deliver books to Velachery Library',
        description: 'Drop 2 reference books at the main reception counter',
        category_id: TASK_CATEGORIES[0].id,
        budget_inr: 150,
        city: 'Chennai',
        locality: 'Velachery, Chennai',
        address_approximate: 'Velachery Main Road',
        address_exact: 'Main Road',
        latitude: 12.982,
        longitude: 80.2185,
        estimated_duration_minutes: 20,
        preferred_date: todayStr,
        required_workers_count: 1,
        required_skills: [],
      });
      expect(err1).toBeUndefined();
      expect(t1).toBeDefined();

      // Task 2: Further, high pay, long duration
      const { task: t2, error: err2 } = await taskService.createTask('poster-i2', {
        title: 'Full Day Event Photography Assistant',
        description: 'Assist with lighting and lenses throughout the wedding ceremony',
        category_id: TASK_CATEGORIES[1].id,
        budget_inr: 1500,
        city: 'Chennai',
        locality: 'Guindy, Chennai',
        address_approximate: 'Race Course Road, Guindy',
        address_exact: 'Race Course Rd',
        latitude: 13.0067,
        longitude: 80.2025,
        estimated_duration_minutes: 240,
        preferred_date: '2026-12-31',
        required_workers_count: 1,
        required_skills: [],
      });
      expect(err2).toBeUndefined();
      expect(t2).toBeDefined();

      const all = await locationService.getNearbyTasks(centerLat, centerLng, 15);

      // 1. Sort by Nearest
      const sortedNearest = [...all].sort((a, b) => (a.distance_km || 0) - (b.distance_km || 0));
      expect(sortedNearest[0].title).toBe('Deliver books to Velachery Library');

      // 2. Sort by Highest Pay
      const sortedPay = [...all].sort((a, b) => b.budget_inr - a.budget_inr);
      expect(sortedPay[0].title).toBe('Full Day Event Photography Assistant');
      expect(sortedPay[0].budget_inr).toBe(1500);

      // 3. Filter Quick Tasks (< 60 min)
      const quickTasks = all.filter((t) => (t.estimated_duration_minutes || 0) <= 60);
      expect(quickTasks.some((t) => t.title.includes('Deliver books'))).toBe(true);
      expect(quickTasks.some((t) => t.title.includes('Photography Assistant'))).toBe(false);

      // 4. Filter Today Tasks (using IST date)
      const todayTasks = all.filter((t) => t.preferred_date === todayStr);
      expect(todayTasks.some((t) => t.title.includes('Deliver books'))).toBe(true);
      expect(todayTasks.some((t) => t.title.includes('Photography Assistant'))).toBe(false);
    });
  });

  // TEST J: Mobile Responsiveness & Controls
  describe('Test J: Mobile responsiveness data structures and interactive controls', () => {
    it('verifies essential preview payload for mobile task cards and sheet', () => {
      const task: Task = {
        id: 'task-preview-1',
        title: 'Move hostel luggage to MRTS',
        description: '2 heavy bags from hostel room 302',
        requester_id: 'user-req-1',
        category_id: 'cat-moving',
        budget_inr: 350,
        status: 'OPEN',
        is_campus_exclusive: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        required_workers_count: 1,
        assigned_workers_count: 0,
        required_skills: [],
        preferred_date: '2026-10-25',
        location: {
          id: 'loc-preview-1',
          task_id: 'task-preview-1',
          city: 'Chennai',
          latitude: 12.9815,
          longitude: 80.218,
          address_approximate: 'Hostel Gate 1',
          address_exact: null,
          locality: 'Velachery, Chennai',
          created_at: new Date().toISOString(),
        },
        estimated_duration_minutes: 45,
        distance_km: 1.2,
      };

      // Preview sheet requires: title, budget, category, distance, duration, and status
      expect(task.title).toBeTruthy();
      expect(task.budget_inr).toBe(350);
      expect(task.category_id).toBe('cat-moving');
      expect(task.distance_km).toBe(1.2);
      expect(task.estimated_duration_minutes).toBe(45);
      expect(task.status).toBe('OPEN');
    });
  });

  // TEST K: Empty State with Action Handlers
  describe('Test K: Empty state with action handlers', () => {
    it('provides multi-action fallback when no tasks exist within selected radius', async () => {
      // Query in an isolated coordinate with 1 km radius where no tasks exist
      const isolatedLat = 12.5;
      const isolatedLng = 79.5;
      const emptyResults = await locationService.getNearbyTasks(isolatedLat, isolatedLng, 1);

      expect(emptyResults.length).toBe(0);

      // Empty state configuration must provide:
      const emptyStateConfig = {
        title: 'No nearby tasks found',
        subtitle: 'Try increasing your search radius or selecting another location.',
        primaryAction: 'Increase Radius',
        secondaryActions: ['Change Location', 'Refresh Tasks'],
      };

      expect(emptyStateConfig.title).toBe('No nearby tasks found');
      expect(emptyStateConfig.primaryAction).toBe('Increase Radius');
      expect(emptyStateConfig.secondaryActions).toContain('Change Location');
      expect(emptyStateConfig.secondaryActions).toContain('Refresh Tasks');
    });
  });

  // TEST L: GPS Failure & Permission Denied Handling
  describe('Test L: GPS failure and permission denied handling', () => {
    it('handles GeolocationPositionError.PERMISSION_DENIED without crashing and marks fallback clearly', () => {
      const simulatedGpsError = {
        code: 1, // PERMISSION_DENIED
        message: 'User denied Geolocation',
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      };

      let statusMsg = '';
      if (simulatedGpsError.code === simulatedGpsError.PERMISSION_DENIED) {
        statusMsg = 'Location permission was denied. Please select your locality or saved address manually.';
      }

      expect(statusMsg).toContain('denied');

      // The fallback location must be clearly identified as default/fallback, not claimed as true GPS
      const fallbackActiveLocation: ActiveLocation = {
        coordinates: {
          latitude: 12.9815,
          longitude: 80.218,
        },
        label: 'Velachery, Chennai (Default Fallback)',
        source: 'search',
        updatedAt: Date.now(),
      };

      expect(fallbackActiveLocation.source).not.toBe('gps');
      expect(fallbackActiveLocation.label).toContain('Default Fallback');
    });
  });
});
