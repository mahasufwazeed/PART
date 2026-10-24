import { describe, it, expect } from 'vitest';
import { calculateHaversineDistanceKm, isWithinRadius } from '../shared/src/utils/geo';
import { CHENNAI_LOCALITIES } from '../shared/src/constants/chennaiLocations';

describe('Geospatial & Chennai Proximity Utilities', () => {
  it('calculates accurate distance between Anna Nagar and Velachery', () => {
    const annaNagar = CHENNAI_LOCALITIES.find((l) => l.name === 'Anna Nagar')!;
    const velachery = CHENNAI_LOCALITIES.find((l) => l.name === 'Velachery')!;

    const dist = calculateHaversineDistanceKm(
      annaNagar.latitude,
      annaNagar.longitude,
      velachery.latitude,
      velachery.longitude
    );

    // Distance between Anna Nagar and Velachery is approx 11.5 - 12.0 km
    expect(dist).toBeGreaterThan(11.0);
    expect(dist).toBeLessThan(13.0);
  });

  it('correctly filters nearby locations within 5 km radius', () => {
    const velachery = CHENNAI_LOCALITIES.find((l) => l.name === 'Velachery')!;
    const adyar = CHENNAI_LOCALITIES.find((l) => l.name === 'Adyar')!;
    const annaNagar = CHENNAI_LOCALITIES.find((l) => l.name === 'Anna Nagar')!;

    // Adyar is approx 4.7km from Velachery (within 5km)
    expect(
      isWithinRadius(velachery.latitude, velachery.longitude, adyar.latitude, adyar.longitude, 5)
    ).toBe(true);

    // Anna Nagar is ~11.6km from Velachery (outside 5km)
    expect(
      isWithinRadius(velachery.latitude, velachery.longitude, annaNagar.latitude, annaNagar.longitude, 5)
    ).toBe(false);
  });
});
