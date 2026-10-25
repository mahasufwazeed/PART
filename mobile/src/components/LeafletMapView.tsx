import React from 'react';
import PartLeafletMap, { PartLeafletMapProps } from './map/PartLeafletMap';

export type LeafletMapViewProps = PartLeafletMapProps & {
  centerLat?: number;
  centerLng?: number;
};

/**
 * LeafletMapView delegating to PartLeafletMap.
 * Guarantees unified OpenStreetMap rendering with zero code duplication.
 */
export const LeafletMapView: React.FC<LeafletMapViewProps> = ({
  centerLat,
  centerLng,
  latitude,
  longitude,
  ...rest
}) => {
  return (
    <PartLeafletMap
      latitude={latitude ?? centerLat}
      longitude={longitude ?? centerLng}
      {...rest}
    />
  );
};

export default LeafletMapView;
