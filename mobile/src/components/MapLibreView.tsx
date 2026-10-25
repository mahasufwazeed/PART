import React from 'react';
import { LeafletMapView, LeafletMapViewProps } from './LeafletMapView';

export type MapLibreViewProps = LeafletMapViewProps;

/**
 * MapLibreView wrapper delegating to LeafletMapView.
 * Preserves complete backward compatibility for components importing MapLibreView.
 */
export const MapLibreView: React.FC<LeafletMapViewProps> = (props) => {
  return <LeafletMapView {...props} />;
};

export default MapLibreView;
