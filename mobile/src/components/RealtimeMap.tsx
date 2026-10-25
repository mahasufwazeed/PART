import React from 'react';
import { LeafletMapView } from './LeafletMapView';
import { Task } from '@part/shared';

interface Props {
  tasks: Task[];
  centerLat?: number;
  centerLng?: number;
  initialRadiusKm?: number;
  onRadiusChange?: (km: number) => void;
  className?: string;
}

/**
 * RealtimeMap wrapper delegating directly to LeafletMapView (react-leaflet + OpenStreetMap).
 * Provides seamless consistency across HomeScreen, ExploreScreen, and simulations.
 */
export const RealtimeMap: React.FC<Props> = ({
  tasks,
  centerLat,
  centerLng,
  initialRadiusKm = 5,
  onRadiusChange,
  className = '',
}) => {
  return (
    <LeafletMapView
      tasks={tasks}
      centerLat={centerLat}
      centerLng={centerLng}
      radiusKm={initialRadiusKm}
      onRadiusChange={onRadiusChange}
      className={className}
    />
  );
};

export default RealtimeMap;
