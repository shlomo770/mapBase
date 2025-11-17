import React, { useEffect, useState } from 'react';
import maplibregl from 'maplibre-gl';

interface CoordinatesDisplayProps {
  map: maplibregl.Map | null;
  visible: boolean;
}

export const CoordinatesDisplay: React.FC<CoordinatesDisplayProps> = ({ map, visible }) => {
  const [coordinates, setCoordinates] = useState<{ lng: number; lat: number } | null>(null);

  useEffect(() => {
    if (!map || !visible) return;

    const handleMove = () => {
      const center = map.getCenter();
      setCoordinates({ lng: center.lng, lat: center.lat });
    };

    const handleMouseMove = (e: maplibregl.MapMouseEvent) => {
      setCoordinates({ lng: e.lngLat.lng, lat: e.lngLat.lat });
    };

    map.on('move', handleMove);
    map.on('mousemove', handleMouseMove);
    handleMove(); // Initial

    return () => {
      map.off('move', handleMove);
      map.off('mousemove', handleMouseMove);
    };
  }, [map, visible]);

  if (!visible || !coordinates) return null;

  return (
    <div className="absolute bottom-4 right-4 z-20 bg-slate-900/90 border border-slate-700 rounded-md px-3 py-2 text-xs text-slate-200 font-mono">
      <div>Lng: {coordinates.lng.toFixed(6)}</div>
      <div>Lat: {coordinates.lat.toFixed(6)}</div>
    </div>
  );
};

