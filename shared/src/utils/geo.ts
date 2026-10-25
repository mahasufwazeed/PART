/**
 * Calculate great-circle distance between two coordinates in kilometers using Haversine formula
 */
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  // Round to 1 decimal place (e.g., 2.4 km)
  return Math.round(distance * 10) / 10;
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Filter items by max distance
 */
export function isWithinRadius(
  userLat: number,
  userLon: number,
  targetLat: number,
  targetLon: number,
  maxDistanceKm: number
): boolean {
  const dist = calculateHaversineDistanceKm(userLat, userLon, targetLat, targetLon);
  return dist <= maxDistanceKm;
}

export const DISTANCE_FILTER_OPTIONS_KM = [1, 3, 5, 10, 15, 25] as const;
export type DistanceFilterOption = (typeof DISTANCE_FILTER_OPTIONS_KM)[number];
export const DEFAULT_SEARCH_RADIUS_KM: DistanceFilterOption = 5;
