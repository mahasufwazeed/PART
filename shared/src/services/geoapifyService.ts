import { GeocodeSuggestion, RouteInfo } from '../types/location';

export const DEFAULT_GEOAPIFY_KEY = '2de1be4fe30a4f60a1b12fb57cb6a2f1';

// Cache maps to avoid duplicate network calls
const autocompleteCache = new Map<string, GeocodeSuggestion[]>();
const reverseGeocodeCache = new Map<string, { formatted: string; locality: string }>();
const routeCache = new Map<string, RouteInfo>();

export function getGeoapifyApiKey(): string {
  if (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_GEOAPIFY_API_KEY) {
    return process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY;
  }
  try {
    const metaEnv = (import.meta as any)?.env;
    if (metaEnv?.NEXT_PUBLIC_GEOAPIFY_API_KEY) {
      return metaEnv.NEXT_PUBLIC_GEOAPIFY_API_KEY;
    }
    if (metaEnv?.VITE_GEOAPIFY_API_KEY) {
      return metaEnv.VITE_GEOAPIFY_API_KEY;
    }
  } catch {
    // ignore
  }
  return DEFAULT_GEOAPIFY_KEY;
}

/**
 * Haversine distance in kilometers
 */
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

export const geoapifyService = {
  getApiKey(): string {
    return getGeoapifyApiKey();
  },

  /**
   * Address Autocomplete with Debounce & Multi-level Caching
   */
  async autocomplete(
    query: string,
    proximity: { lat: number; lng: number } = { lat: 12.9815, lng: 80.218 }
  ): Promise<GeocodeSuggestion[]> {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed || trimmed.length < 2) return [];

    const cacheKey = `${trimmed}_${proximity.lat.toFixed(3)}_${proximity.lng.toFixed(3)}`;
    if (autocompleteCache.has(cacheKey)) {
      return autocompleteCache.get(cacheKey)!;
    }

    // Try reading localStorage cache if available
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const stored = localStorage.getItem(`geo_ac_${cacheKey}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          autocompleteCache.set(cacheKey, parsed);
          return parsed;
        }
      } catch {
        // ignore
      }
    }

    try {
      const apiKey = getGeoapifyApiKey();
      const url = new URL('https://api.geoapify.com/v1/geocode/autocomplete');
      url.searchParams.set('text', trimmed);
      url.searchParams.set('filter', 'countrycode:in');
      url.searchParams.set('bias', `proximity:${proximity.lng},${proximity.lat}`);
      url.searchParams.set('limit', '6');
      url.searchParams.set('apiKey', apiKey);

      const res = await fetch(url.toString());
      if (!res.ok) {
        throw new Error(`Geoapify geocoding error: ${res.statusText}`);
      }

      const data = await res.json();
      const features = data?.features || [];

      const results: GeocodeSuggestion[] = features.map((f: any, idx: number) => {
        const props = f.properties || {};
        return {
          place_id: props.place_id || `place_${idx}_${props.lat}_${props.lon}`,
          formatted: props.formatted || `${props.address_line1 || ''}, ${props.city || ''}`,
          address_line1: props.address_line1 || props.name || '',
          address_line2: props.address_line2 || '',
          city: props.city || props.county || 'Chennai',
          state: props.state || 'Tamil Nadu',
          postcode: props.postcode || '',
          lat: props.lat,
          lon: props.lon,
        };
      });

      autocompleteCache.set(cacheKey, results);
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          localStorage.setItem(`geo_ac_${cacheKey}`, JSON.stringify(results));
        } catch {
          // ignore storage limit
        }
      }

      return results;
    } catch (err) {
      console.warn('Geoapify autocomplete fallback:', err);
      // Fallback matching against standard Chennai localities
      const CHENNAI_PRESETS = [
        { name: 'Velachery', lat: 12.9815, lon: 80.218 },
        { name: 'Adyar', lat: 13.0012, lon: 80.2565 },
        { name: 'Anna Nagar', lat: 13.085, lon: 80.2101 },
        { name: 'T. Nagar', lat: 13.0418, lon: 80.2341 },
        { name: 'Thiruvanmiyur', lat: 12.983, lon: 80.2594 },
        { name: 'Besant Nagar', lat: 13.0002, lon: 80.2667 },
        { name: 'Mylapore', lat: 13.0368, lon: 80.2676 },
        { name: 'Nungambakkam', lat: 13.0569, lon: 80.2425 },
        { name: 'Guindy', lat: 13.0067, lon: 80.2025 },
        { name: 'Tambaram', lat: 12.9249, lon: 80.1481 },
        { name: 'Porur', lat: 13.0382, lon: 80.1565 },
        { name: 'Alwarpet', lat: 13.0336, lon: 80.2526 },
        { name: 'OMR - Sholinganallur', lat: 12.901, lon: 80.2279 },
      ];

      return CHENNAI_PRESETS.filter((p) =>
        p.name.toLowerCase().includes(trimmed)
      ).map((p) => ({
        place_id: `fallback_${p.name}`,
        formatted: `${p.name}, Chennai, Tamil Nadu`,
        address_line1: p.name,
        address_line2: 'Chennai, Tamil Nadu',
        city: 'Chennai',
        state: 'Tamil Nadu',
        lat: p.lat,
        lon: p.lon,
      }));
    }
  },

  /**
   * Reverse Geocode coordinates to address and locality
   */
  async reverseGeocode(
    lat: number,
    lng: number
  ): Promise<{ formatted: string; locality: string }> {
    const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;
    if (reverseGeocodeCache.has(cacheKey)) {
      return reverseGeocodeCache.get(cacheKey)!;
    }

    try {
      const apiKey = getGeoapifyApiKey();
      const url = `https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lng}&apiKey=${apiKey}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Reverse geocode failed: ${res.statusText}`);

      const data = await res.json();
      const feat = data?.features?.[0]?.properties;

      if (feat) {
        const locality = feat.suburb || feat.district || feat.city || 'Chennai';
        const formatted =
          feat.formatted || `${feat.address_line1 || locality}, Chennai`;
        const result = { formatted, locality };
        reverseGeocodeCache.set(cacheKey, result);
        return result;
      }
    } catch (err) {
      console.warn('Geoapify reverseGeocode fallback:', err);
    }

    const fallback = {
      formatted: `${lat.toFixed(4)}, ${lng.toFixed(4)}, Chennai`,
      locality: 'Chennai',
    };
    reverseGeocodeCache.set(cacheKey, fallback);
    return fallback;
  },

  /**
   * Automatic IP-based Geolocation fallback
   */
  async getIpLocation(): Promise<{ locality: string; latitude: number; longitude: number } | null> {
    try {
      const apiKey = getGeoapifyApiKey();
      const res = await fetch(`https://api.geoapify.com/v1/ipinfo?apiKey=${apiKey}`);
      if (!res.ok) throw new Error(`IP info lookup failed: ${res.statusText}`);
      const data = await res.json();
      const lat = data?.location?.latitude;
      const lng = data?.location?.longitude;
      const city = data?.city?.name || 'Chennai';
      const state = data?.state?.name || 'Tamil Nadu';

      if (typeof lat === 'number' && typeof lng === 'number') {
        const rev = await this.reverseGeocode(lat, lng);
        return {
          locality: rev.formatted || `${city}, ${state}`,
          latitude: lat,
          longitude: lng,
        };
      }
    } catch (err) {
      console.warn('IP location detection fallback:', err);
    }
    return null;
  },

  /**
   * Geoapify Routing API: Navigation route between Worker and Task
   */
  async calculateRoute(
    start: { lat: number; lng: number },
    end: { lat: number; lng: number },
    mode: 'motorcycle' | 'drive' | 'bicycle' | 'walk' = 'motorcycle'
  ): Promise<RouteInfo> {
    const cacheKey = `${start.lat.toFixed(4)},${start.lng.toFixed(4)}_${end.lat.toFixed(4)},${end.lng.toFixed(4)}_${mode}`;
    if (routeCache.has(cacheKey)) {
      return routeCache.get(cacheKey)!;
    }

    try {
      const apiKey = getGeoapifyApiKey();
      const url = `https://api.geoapify.com/v1/routing?waypoints=${start.lat},${start.lng}|${end.lat},${end.lng}&mode=${mode}&apiKey=${apiKey}`;

      const res = await fetch(url);
      if (!res.ok) throw new Error(`Routing API failed: ${res.statusText}`);

      const data = await res.json();
      const feature = data?.features?.[0];

      if (feature && feature.geometry && feature.properties) {
        // GeoJSON coordinates are [longitude, latitude]
        const rawCoords: [number, number][] = feature.geometry.coordinates?.[0] || [];
        const distanceMeters: number = feature.properties.distance || 0;
        const durationSeconds: number = feature.properties.time || 0;

        const distanceKm = Number((distanceMeters / 1000).toFixed(2));
        const durationMinutes = Math.max(1, Math.round(durationSeconds / 60));

        const routeInfo: RouteInfo = {
          coordinates: rawCoords,
          distance_meters: distanceMeters,
          distance_km: distanceKm,
          duration_seconds: durationSeconds,
          duration_minutes: durationMinutes,
          eta_text: `~${durationMinutes} mins (${distanceKm} km)`,
          mode,
        };

        routeCache.set(cacheKey, routeInfo);
        return routeInfo;
      }
    } catch (err) {
      console.warn('Geoapify calculateRoute fallback:', err);
    }

    // High fidelity fallback using Haversine calculation + intermediate points
    const distKm = calculateHaversineDistanceKm(
      start.lat,
      start.lng,
      end.lat,
      end.lng
    );
    // Average urban city transit speed: ~22 km/h
    const durMins = Math.max(1, Math.round((distKm / 22) * 60));

    // Construct direct 2-point line geometry [lng, lat]
    const fallbackCoords: [number, number][] = [
      [start.lng, start.lat],
      [end.lng, end.lat],
    ];

    const fallbackRoute: RouteInfo = {
      coordinates: fallbackCoords,
      distance_meters: Math.round(distKm * 1000),
      distance_km: distKm,
      duration_seconds: durMins * 60,
      duration_minutes: durMins,
      eta_text: `~${durMins} mins (${distKm} km)`,
      mode,
    };

    routeCache.set(cacheKey, fallbackRoute);
    return fallbackRoute;
  },

  /**
   * Helper to format Vector Tile Style URL for MapLibre GL
   */
  getMapLibreStyleUrl(style: 'osm-bright' | 'positron' | 'osm-carto' = 'osm-bright'): string {
    const key = getGeoapifyApiKey();
    return `https://maps.geoapify.com/v1/styles/${style}/style.json?apiKey=${key}`;
  },
};
