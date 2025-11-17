import { useEffect, useState } from 'react';
import maplibregl, { Map as MlMap } from 'maplibre-gl';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';

export function useAreaMeasurement(map: MlMap | null) {
  const measurementMode = useSelector((s: RootState) => s.ui.measurementMode);
  const [areaPoints, setAreaPoints] = useState<[number, number][]>([]);
  const [area, setArea] = useState<number>(0);

  useEffect(() => {
    if (!map || !measurementMode) {
      setAreaPoints([]);
      setArea(0);
      return;
    }

    if (!map.getSource('area-measurement')) {
      map.addSource('area-measurement', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      });

      map.addLayer({
        id: 'area-measurement-fill',
        type: 'fill',
        source: 'area-measurement',
        paint: {
          'fill-color': '#ff6b6b',
          'fill-opacity': 0.3
        }
      });

      map.addLayer({
        id: 'area-measurement-line',
        type: 'line',
        source: 'area-measurement',
        paint: {
          'line-color': '#ff6b6b',
          'line-width': 2,
          'line-dasharray': [2, 2]
        }
      });
    }

    const handleClick = (e: maplibregl.MapMouseEvent & maplibregl.EventData) => {
      const { lng, lat } = e.lngLat;
      setAreaPoints(prev => [...prev, [lng, lat]]);
    };

    map.on('click', handleClick);

    return () => {
      map.off('click', handleClick);
    };
  }, [map, measurementMode]);

  useEffect(() => {
    if (areaPoints.length < 3) {
      setArea(0);
      const src = map?.getSource('area-measurement') as maplibregl.GeoJSONSource | undefined;
      if (src) {
        src.setData({ type: 'FeatureCollection', features: [] });
      }
      return;
    }

    const calculatedArea = calculateArea(areaPoints);
    setArea(calculatedArea);

    const src = map?.getSource('area-measurement') as maplibregl.GeoJSONSource | undefined;
    if (src) {
      src.setData({
        type: 'FeatureCollection',
        features: [{
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [[...areaPoints, areaPoints[0]]]
          },
          properties: {}
        }]
      });
    }
  }, [map, areaPoints]);

  return { areaPoints, area };
}

function calculateArea(coords: [number, number][]): number {
  if (coords.length < 3) return 0;

  const R = 6378137; // Earth radius in meters
  let area = 0;

  for (let i = 0; i < coords.length; i++) {
    const j = (i + 1) % coords.length;
    const [lng1, lat1] = coords[i];
    const [lng2, lat2] = coords[j];

    area += (lng2 - lng1) * (2 + Math.sin((lat1 * Math.PI) / 180) + Math.sin((lat2 * Math.PI) / 180));
  }

  area = Math.abs(area * R * R / 2);
  return area;
}

