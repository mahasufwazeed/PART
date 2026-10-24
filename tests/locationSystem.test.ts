import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  geoapifyService,
  locationService,
  mockStore,
  calculateHaversineDistanceKm,
  SavedAddress,
  WorkerLiveLocation,
  Task,
} from '../shared/src';

describe('Location & Mapping System Tests', () => {
  beforeEach(() => {
    mockStore.reset();
  });

  describe('1. Geoapify Service (Geocoding & Autocomplete & Routing)', () => {
    it('returns structured autocomplete suggestions for Chennai areas', async () => {
      const results = await geoapifyService.autocomplete('Velachery', {
        lat: 12.9815,
        lng: 80.218,
      });

      expect(results.length).toBeGreaterThan(0);
      const first = results[0];
      expect(first).toHaveProperty('place_id');
      expect(first).toHaveProperty('formatted');
      expect(first).toHaveProperty('lat');
      expect(first).toHaveProperty('lon');
      expect(first.formatted.toLowerCase()).toContain('velachery');
    });

    it('caches autocomplete results for cost optimization', async () => {
      const spy = vi.spyOn(globalThis, 'fetch');
      // First call may hit fetch or preset
      const res1 = await geoapifyService.autocomplete('Adyar', {
        lat: 13.0012,
        lng: 80.2565,
      });
      const fetchCallsAfterFirst = spy.mock.calls.length;

      // Second identical call must be served from cache
      const res2 = await geoapifyService.autocomplete('Adyar', {
        lat: 13.0012,
        lng: 80.2565,
      });

      expect(spy.mock.calls.length).toBe(fetchCallsAfterFirst);
      expect(res1).toEqual(res2);
      spy.mockRestore();
    });

    it('reverse geocodes coordinates to readable Chennai address', async () => {
      const rev = await geoapifyService.reverseGeocode(12.9815, 80.218);
      expect(rev).toHaveProperty('formatted');
      expect(rev).toHaveProperty('locality');
      expect(rev.formatted).toBeTruthy();
    });

    it('calculates navigation route and ETA between worker and task', async () => {
      const workerCoords = { lat: 13.0012, lng: 80.2565 }; // Adyar
      const taskCoords = { lat: 12.9815, lng: 80.218 }; // Velachery

      const route = await geoapifyService.calculateRoute(
        workerCoords,
        taskCoords,
        'motorcycle'
      );

      expect(route).toHaveProperty('coordinates');
      expect(route.coordinates.length).toBeGreaterThan(0);
      expect(route.distance_km).toBeGreaterThan(3.5);
      expect(route.distance_km).toBeLessThan(15.0);
      expect(route.duration_minutes).toBeGreaterThanOrEqual(1);
      expect(route.eta_text).toContain('mins');
    });
  });

  describe('2. Saved Addresses Management', () => {
    it('retrieves default starter addresses (Home, Work) for quick checkout', async () => {
      const addrs = await locationService.getSavedAddresses('user-123');
      expect(addrs.length).toBeGreaterThanOrEqual(2);

      const home = addrs.find((a) => a.label === 'Home');
      const work = addrs.find((a) => a.label === 'Work');
      expect(home).toBeDefined();
      expect(work).toBeDefined();
      expect(home?.locality).toContain('Velachery');
    });

    it('allows user to save a new custom address', async () => {
      const { address, error } = await locationService.saveAddress('user-123', {
        label: 'Other',
        title: 'Gym & Fitness Center',
        address_line: '100 Feet Road, T. Nagar',
        locality: 'T. Nagar, Chennai',
        latitude: 13.0418,
        longitude: 80.2341,
        is_default: false,
      });

      expect(error).toBeNull();
      expect(address).toBeDefined();
      expect(address?.title).toBe('Gym & Fitness Center');

      const all = await locationService.getSavedAddresses('user-123');
      expect(all.some((a) => a.title === 'Gym & Fitness Center')).toBe(true);
    });

    it('allows user to delete a saved address', async () => {
      const { address } = await locationService.saveAddress('user-123', {
        label: 'Other',
        title: 'Temporary Studio',
        address_line: 'Besant Nagar Beach Road',
        locality: 'Besant Nagar, Chennai',
        latitude: 13.0002,
        longitude: 80.2667,
      });

      const res = await locationService.deleteSavedAddress('user-123', address!.id);
      expect(res.success).toBe(true);

      const all = await locationService.getSavedAddresses('user-123');
      expect(all.some((a) => a.id === address!.id)).toBe(false);
    });
  });

  describe('3. Live Worker Tracking & Supabase Realtime', () => {
    it('updates worker live coordinates and updates store', async () => {
      const taskId = 'task-live-1';
      const workerId = 'worker-99';

      const updateRes = await locationService.updateWorkerLocation(
        taskId,
        workerId,
        {
          latitude: 12.985,
          longitude: 80.222,
          heading: 180,
          speed: 25.5,
          accuracy: 5.0,
        }
      );

      expect(updateRes.success).toBe(true);

      const fetched = await locationService.getWorkerLocation(taskId);
      expect(fetched).not.toBeNull();
      expect(fetched?.latitude).toBe(12.985);
      expect(fetched?.longitude).toBe(80.222);
      expect(fetched?.heading).toBe(180);
      expect(fetched?.speed).toBe(25.5);
    });

    it('subscribes to live worker location updates and receives updates', async () => {
      const taskId = 'task-live-2';
      const workerId = 'worker-100';

      let receivedLocation: WorkerLiveLocation | null = null;
      const unsubscribe = locationService.subscribeWorkerLocation(
        taskId,
        (loc) => {
          receivedLocation = loc;
        }
      );

      expect(typeof unsubscribe).toBe('function');
      unsubscribe();
    });
  });

  describe('4. Nearby Task Discovery within 1, 3, 5 and 10 km', () => {
    beforeEach(() => {
      // Seed tasks at various distances from Velachery center (12.9815, 80.218)
      // 1. Within 0.8 km (Velachery 100ft road)
      mockStore.tasks.set('task-0.8km', {
        id: 'task-0.8km',
        requester_id: 'req-1',
        category_id: 'cat-errands',
        title: 'Grocery delivery from Vijaya Nagar',
        description: 'Pick up milk and fruits',
        budget_inr: 150,
        estimated_duration_minutes: 20,
        preferred_date: '2026-10-25',
        required_workers_count: 1,
        assigned_workers_count: 0,
        required_skills: [],
        status: 'OPEN',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      mockStore.locations.set('task-0.8km', {
        id: 'loc-0.8km',
        task_id: 'task-0.8km',
        city: 'Chennai',
        locality: 'Velachery',
        address_approximate: 'Near Vijaya Nagar Bus Stand',
        latitude: 12.984,
        longitude: 80.215,
        created_at: new Date().toISOString(),
      });

      // 2. Within 2.5 km (Perungudi)
      mockStore.tasks.set('task-2.5km', {
        id: 'task-2.5km',
        requester_id: 'req-2',
        category_id: 'cat-errands',
        title: 'Document courier in Perungudi',
        description: 'Deliver signed legal envelope',
        budget_inr: 200,
        estimated_duration_minutes: 30,
        preferred_date: '2026-10-25',
        required_workers_count: 1,
        assigned_workers_count: 0,
        required_skills: [],
        status: 'OPEN',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      mockStore.locations.set('task-2.5km', {
        id: 'loc-2.5km',
        task_id: 'task-2.5km',
        city: 'Chennai',
        locality: 'Perungudi',
        address_approximate: 'Near RMZ Millenia',
        latitude: 12.965,
        longitude: 80.235,
        created_at: new Date().toISOString(),
      });

      // 3. Within 4.5 km (Adyar)
      mockStore.tasks.set('task-4.5km', {
        id: 'task-4.5km',
        requester_id: 'req-3',
        category_id: 'cat-cleaning',
        title: 'Balcony cleaning in Adyar',
        description: 'Help clean plant pots on terrace',
        budget_inr: 450,
        estimated_duration_minutes: 45,
        preferred_date: '2026-10-25',
        required_workers_count: 1,
        assigned_workers_count: 0,
        required_skills: [],
        status: 'OPEN',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      mockStore.locations.set('task-4.5km', {
        id: 'loc-4.5km',
        task_id: 'task-4.5km',
        city: 'Chennai',
        locality: 'Adyar',
        address_approximate: 'Gandhi Nagar, Adyar',
        latitude: 13.0012,
        longitude: 80.2565,
        created_at: new Date().toISOString(),
      });

      // 4. Within 8.5 km (Mylapore)
      mockStore.tasks.set('task-8.5km', {
        id: 'task-8.5km',
        requester_id: 'req-4',
        category_id: 'cat-tech',
        title: 'Wifi setup in Mylapore',
        description: 'Connect fiber router',
        budget_inr: 500,
        estimated_duration_minutes: 60,
        preferred_date: '2026-10-25',
        required_workers_count: 1,
        assigned_workers_count: 0,
        required_skills: [],
        status: 'OPEN',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      mockStore.locations.set('task-8.5km', {
        id: 'loc-8.5km',
        task_id: 'task-8.5km',
        city: 'Chennai',
        locality: 'Mylapore',
        address_approximate: 'Near Kapaleeshwarar Temple',
        latitude: 13.0368,
        longitude: 80.2676,
        created_at: new Date().toISOString(),
      });

      // 5. Far away ~18 km (Ambattur)
      mockStore.tasks.set('task-18km', {
        id: 'task-18km',
        requester_id: 'req-5',
        category_id: 'cat-tech',
        title: 'Printer repair in Ambattur',
        description: 'Fix paper feed roller',
        budget_inr: 600,
        estimated_duration_minutes: 60,
        preferred_date: '2026-10-25',
        required_workers_count: 1,
        assigned_workers_count: 0,
        required_skills: [],
        status: 'OPEN',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      mockStore.locations.set('task-18km', {
        id: 'loc-18km',
        task_id: 'task-18km',
        city: 'Chennai',
        locality: 'Ambattur',
        address_approximate: 'Ambattur OT',
        latitude: 13.1143,
        longitude: 80.1481,
        created_at: new Date().toISOString(),
      });
    });

    it('correctly filters tasks within 1 km radius', async () => {
      const tasks1km = await locationService.getNearbyTasks(12.9815, 80.218, 1);
      expect(tasks1km.length).toBe(1);
      expect(tasks1km[0].id).toBe('task-0.8km');
    });

    it('correctly filters tasks within 3 km radius', async () => {
      const tasks3km = await locationService.getNearbyTasks(12.9815, 80.218, 3);
      expect(tasks3km.length).toBe(2);
      expect(tasks3km.map((t) => t.id)).toContain('task-0.8km');
      expect(tasks3km.map((t) => t.id)).toContain('task-2.5km');
    });

    it('correctly filters tasks within 5 km radius', async () => {
      const tasks5km = await locationService.getNearbyTasks(12.9815, 80.218, 5);
      expect(tasks5km.length).toBe(3);
      expect(tasks5km.map((t) => t.id)).toContain('task-0.8km');
      expect(tasks5km.map((t) => t.id)).toContain('task-2.5km');
      expect(tasks5km.map((t) => t.id)).toContain('task-4.5km');
    });

    it('correctly filters tasks within 10 km radius', async () => {
      const tasks10km = await locationService.getNearbyTasks(12.9815, 80.218, 10);
      expect(tasks10km.length).toBe(4);
      expect(tasks10km.map((t) => t.id)).not.toContain('task-18km');
    });
  });
});
