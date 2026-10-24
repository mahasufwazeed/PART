import React from 'react';
import { RealtimeMap } from './RealtimeMap';
import { Task } from '@part/shared';

interface Props {
  tasks: Task[];
  centerLat?: number;
  centerLng?: number;
  radiusKm?: number;
  onRadiusChange?: (km: number) => void;
}

export const MapViewSimulation: React.FC<Props> = ({
  tasks,
  centerLat,
  centerLng,
  radiusKm,
  onRadiusChange,
}) => {
  return (
    <RealtimeMap
      tasks={tasks}
      centerLat={centerLat}
      centerLng={centerLng}
      initialRadiusKm={radiusKm}
      onRadiusChange={onRadiusChange}
    />
  );
};
