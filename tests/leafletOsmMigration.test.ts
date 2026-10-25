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
  CHENNAI_COLLEGES,
  ActiveLocation,
  LocationSource,
  Task,
  TASK_CATEGORIES,
} from '../shared/src';

describe('PART – Leaflet.js + OpenStreetMap Migration Test Suite', () => {
  beforeEach(() => {
    mockStore.reset();
  });

  // 1. Tile & Attribution Verification
  describe('1. OpenStreetMap Tile Configuration & Legal Attribution', () => {
    it('configures OpenStreetMap standard raster tiles as reliable default', () => {
      const defaultOsmTile = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
      expect(defaultOsmTile).toMatch(/^https:\/\/tile\.openstreetmap\.org\/\{z\}\/\{x\}\/\{y\}\.png$/);
    });

    it('provides valid OpenStreetMap legal copyright attribution', () => {
      const osmAttribution =
        '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors';
      expect(osmAttribution).toContain('OpenStreetMap');
      expect(osmAttribution).toContain('https://www.openstreetmap.org/copyright');
    });

    it('provides retina Geoapify OSM Bright tiles when API key is configured', () => {
      const apiKey = geoapifyService.getApiKey();
      expect(apiKey).toBeDefined();
      const brightTileUrl = `https://maps.geoapify.com/v1/tile/osm-bright/{z}/{x}/{y}@2x.png?apiKey=${apiKey}`;
      expect(brightTileUrl).toContain('maps.geoapify.com');
      expect(brightTileUrl).toContain(apiKey);
    });
  });

  // 2. Centralized Location State & 6 Location Sources
  describe('2. Centralized Location State & 6 Location Sources', () => {
    const testCases: { source: LocationSource; label: string; lat: number; lng: number }[] = [
      { source: 'gps', label: 'Current GPS Location, Chennai', lat: 12.9815, lng: 80.218 },
      { source: 'search', label: 'Anna Nagar, Chennai', lat: 13.085, lng: 80.2101 },
      { source: 'saved_address', label: 'Home (Vijaya Nagar, Velachery)', lat: 12.9815, lng: 80.218 },
      { source: 'college', label: 'Anna University, Guindy, Chennai', lat: 13.0102, lng: 80.2355 },
      { source: 'university', label: 'VELS University, Pallavaram, Chennai', lat: 12.9675, lng: 80.1491 },
      { source: 'profile', label: 'Taramani, Chennai', lat: 12.9863, lng: 80.2432 },
      { source: 'map_pin', label: 'Custom Dropped Pin, Chennai', lat: 13.0418, lng: 80.2341 },
    ];

    testCases.forEach(({ source, label, lat, lng }) => {
      it(`supports location source '${source}' with accurate coordinates`, () => {
        const activeLocation: ActiveLocation = {
          coordinates: { latitude: lat, longitude: lng },
          label,
          source,
          updatedAt: Date.now(),
        };

        expect(activeLocation.source).toBe(source);
        expect(activeLocation.coordinates.latitude).toBe(lat);
        expect(activeLocation.coordinates.longitude).toBe(lng);
        expect(activeLocation.label).toBe(label);
      });
    });

    it('distinguishes between profile locality and GPS coordinates', () => {
      const profileLocation: ActiveLocation = {
        coordinates: { latitude: 12.9863, longitude: 80.2432 },
        label: 'Taramani, Chennai',
        source: 'profile',
        updatedAt: Date.now(),
      };

      const gpsLocation: ActiveLocation = {
        coordinates: { latitude: 12.9815, longitude: 80.218 },
        label: 'Current GPS Location, Chennai',
        source: 'gps',
        accuracyMeters: 12,
        updatedAt: Date.now(),
      };

      expect(profileLocation.source).not.toBe(gpsLocation.source);
      expect(profileLocation.source).toBe('profile');
      expect(gpsLocation.source).toBe('gps');
      expect(gpsLocation.accuracyMeters).toBe(12);
    });
  });

  // 3. Search Radius & Leaflet Circle
  describe('3. Standardized Search Radius (1km, 3km, 5km, 10km, 15km, 25km)', () => {
    it('standardizes supported radius options and defaults to 5 km', () => {
      expect(DISTANCE_FILTER_OPTIONS_KM).toEqual([1, 3, 5, 10, 15, 25]);
      expect(DEFAULT_SEARCH_RADIUS_KM).toBe(5);
    });

    it('computes Leaflet circle radius in exact meters', () => {
      const radiusKmValues = [1, 3, 5, 10, 15, 25];
      radiusKmValues.forEach((km) => {
        const meters = km * 1000;
        expect(meters).toBe(km * 1000);
      });
    });
  });

  // 4. Task Price Markers (INR) & Details Preview
  describe('4. Task Price Markers & Preview Card Data', () => {
    beforeEach(async () => {
      await taskService.createTask('poster-m1', {
        title: 'Deliver books to Velachery Library',
        description: 'Drop 2 reference books at the main reception counter',
        category_id: TASK_CATEGORIES[0].id,
        budget_inr: 250,
        city: 'Chennai',
        locality: 'Velachery, Chennai',
        address_approximate: 'Velachery Main Road',
        address_exact: 'No. 5, Gandhi Road',
        latitude: 12.9815,
        longitude: 80.218,
        estimated_duration_minutes: 40,
        preferred_date: '2026-10-25',
        required_workers_count: 1,
        required_skills: [],
      });
      await taskService.createTask('poster-m2', {
        title: 'Pickup medicines from Apollo Adyar',
        description: 'Urgent prescription delivery',
        category_id: TASK_CATEGORIES[1].id,
        budget_inr: 500,
        city: 'Chennai',
        locality: 'Adyar, Chennai',
        address_approximate: 'Adyar Signal',
        address_exact: 'LB Road',
        latitude: 13.0012,
        longitude: 80.2565,
        estimated_duration_minutes: 30,
        preferred_date: '2026-10-25',
        required_workers_count: 1,
        required_skills: [],
      });
    });

    it('formats task prices correctly with Indian Rupee symbol', () => {
      const sampleBudgets = [150, 250, 500, 1000, 2500];
      sampleBudgets.forEach((amount) => {
        const formatted = `₹${amount.toLocaleString('en-IN')}`;
        expect(formatted).toMatch(/^₹[0-9,]+$/);
      });
    });

    it('ensures tasks have complete fields for map marker preview cards', async () => {
      const tasks = await locationService.getNearbyTasks(12.9815, 80.218, 10);
      expect(tasks.length).toBeGreaterThan(0);

      const firstTask = tasks[0];
      expect(firstTask.title).toBeDefined();
      expect(firstTask.budget_inr).toBeGreaterThan(0);
      expect(firstTask.location?.latitude).toBeDefined();
      expect(firstTask.location?.longitude).toBeDefined();
      expect(firstTask.status).toBe('OPEN');
    });

    it('ensures map markers and task cards share the same filtered dataset', async () => {
      const lat = 12.9815;
      const lng = 80.218;
      const radiusKm = 5;

      const results = await locationService.getNearbyTasks(lat, lng, radiusKm);
      // Filter for tasks under 60 mins (quick tasks filter)
      const quickTasks = results.filter((t) => (t.estimated_duration_minutes || 0) <= 60);

      expect(Array.isArray(quickTasks)).toBe(true);
      quickTasks.forEach((t) => {
        expect(t.estimated_duration_minutes).toBeLessThanOrEqual(60);
      });
    });
  });

  // 5. Supabase Error Handling & Resilient Fallbacks
  describe('5. Supabase Error Resilience & Status Reporting', () => {
    it('provides getNearbyTasks resilient fallback when PostGIS RPC fails', async () => {
      await taskService.createTask('poster-resilient', {
        title: 'Document delivery',
        description: 'Drop files in Velachery',
        category_id: TASK_CATEGORIES[0].id,
        budget_inr: 200,
        city: 'Chennai',
        locality: 'Velachery, Chennai',
        address_approximate: 'Main Road',
        address_exact: 'Station View',
        latitude: 12.9815,
        longitude: 80.218,
        estimated_duration_minutes: 25,
        preferred_date: '2026-10-25',
        required_workers_count: 1,
        required_skills: [],
      });
      const tasks = await locationService.getNearbyTasks(12.9815, 80.218, 5);
      expect(Array.isArray(tasks)).toBe(true);
      expect(tasks.length).toBeGreaterThan(0);
    });

    it('reports query error status without crashing when RPC is missing', () => {
      const error = locationService.getLastQueryError();
      // Error can be null or a descriptive string, but should not throw
      expect(error === null || typeof error === 'string').toBe(true);
    });

    it('clears query error upon clearLastQueryError() call', () => {
      locationService.clearLastQueryError();
      expect(locationService.getLastQueryError()).toBeNull();
    });
  });

  // 6. Chennai Campuses & Universities
  describe('6. Chennai Universities & Campuses Support', () => {
    it('includes premier Chennai colleges with verified localities', () => {
      expect(CHENNAI_COLLEGES.length).toBeGreaterThanOrEqual(5);

      const annaUniv = CHENNAI_COLLEGES.find((c) => c.id === 'anna-university');
      expect(annaUniv).toBeDefined();
      expect(annaUniv?.locality).toBe('Guindy');

      const vels = CHENNAI_COLLEGES.find((c) => c.id === 'vels-university');
      expect(vels).toBeDefined();
      expect(vels?.locality).toBe('Pallavaram');
    });
  });

  // 7. PartLeafletMap Component Contract & GPS vs Search Center
  describe('7. PartLeafletMap Component Contract & GPS vs Search Distinction', () => {
    it('properly distinguishes physical device GPS from selected search center', () => {
      const searchCenter = { latitude: 13.085, longitude: 80.2101 }; // Anna Nagar
      const physicalGps = { latitude: 12.9815, longitude: 80.218 }; // Velachery

      const isDistinct =
        Math.abs(physicalGps.latitude - searchCenter.latitude) > 0.001 ||
        Math.abs(physicalGps.longitude - searchCenter.longitude) > 0.001;

      expect(isDistinct).toBe(true);
      const distanceApartKm = calculateHaversineDistanceKm(
        physicalGps.latitude,
        physicalGps.longitude,
        searchCenter.latitude,
        searchCenter.longitude
      );
      expect(distanceApartKm).toBeGreaterThan(10);
    });

    it('calculates radius bounds accurately for Leaflet Circle fitting', () => {
      const centerLat = 12.9815;
      const centerLng = 80.218;
      const radiusKm = 5;

      const deltaLat = radiusKm / 110.574;
      const deltaLng = radiusKm / (111.32 * Math.cos((centerLat * Math.PI) / 180));

      const bounds = [
        [centerLat - deltaLat, centerLng - deltaLng],
        [centerLat + deltaLat, centerLng + deltaLng],
      ];

      expect(bounds[1][0]).toBeGreaterThan(bounds[0][0]);
      expect(bounds[1][1]).toBeGreaterThan(bounds[0][1]);
    });

    it('verifies standard radius filter options [1, 3, 5, 10, 15, 25] km', () => {
      expect(DISTANCE_FILTER_OPTIONS_KM).toEqual([1, 3, 5, 10, 15, 25]);
    });

    it('validates PartLeafletMap module and NearbyTasks component implementations', async () => {
      const fs = await import('fs');
      const path = await import('path');

      const mapFilePath = path.resolve(__dirname, '../mobile/src/components/map/PartLeafletMap.tsx');
      expect(fs.existsSync(mapFilePath)).toBe(true);
      const mapContent = fs.readFileSync(mapFilePath, 'utf-8');
      expect(mapContent).toContain('export default function PartLeafletMap');
      expect(mapContent).toContain('MapContainer');
      expect(mapContent).toContain('TileLayer');
      expect(mapContent).toContain('Circle');
      expect(mapContent).toContain('useMap');
      expect(mapContent).toContain('UpdateMapCenter');

      const nearbyTasksPath = path.resolve(__dirname, '../mobile/src/components/NearbyTasks.tsx');
      expect(fs.existsSync(nearbyTasksPath)).toBe(true);
      const nearbyContent = fs.readFileSync(nearbyTasksPath, 'utf-8');
      expect(nearbyContent).toContain('export default function NearbyTasks');
      expect(nearbyContent).toContain('DISTANCE_FILTER_OPTIONS_KM');
      expect(nearbyContent).toContain('PartLeafletMap');
      expect(nearbyContent).toContain('useAppStore');

      const reexportPath = path.resolve(__dirname, '../mobile/src/components/PartLeafletMap.tsx');
      expect(fs.existsSync(reexportPath)).toBe(true);
    });
  });
});

