export type AddressLabel = 'Home' | 'Work' | 'Other';

export interface SavedAddress {
  id: string;
  user_id?: string;
  label: AddressLabel;
  title: string;
  address_line: string;
  locality: string;
  latitude: number;
  longitude: number;
  is_default?: boolean;
  created_at?: string;
}

export interface WorkerLiveLocation {
  task_id: string;
  worker_id: string;
  latitude: number;
  longitude: number;
  heading?: number | null;
  speed?: number | null;
  accuracy?: number | null;
  updated_at: string;
}

export interface RouteInfo {
  coordinates: [number, number][]; // [longitude, latitude] GeoJSON format
  distance_meters: number;
  distance_km: number;
  duration_seconds: number;
  duration_minutes: number;
  eta_text: string;
  mode: 'motorcycle' | 'drive' | 'bicycle' | 'walk';
}

export interface GeocodeSuggestion {
  place_id: string;
  formatted: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  postcode?: string;
  lat: number;
  lon: number;
}
