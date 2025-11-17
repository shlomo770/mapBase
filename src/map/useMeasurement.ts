import { useEffect, useRef, useState } from 'react';
import maplibregl, { Map as MlMap } from 'maplibre-gl';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';

export function useMeasurement(map: MlMap | null) {
  const measurementMode = useSelector((s: RootState) => s.ui.measurementMode);
  const [measurementPoints, setMeasurementPoints] = useState<[number, number][]>([]);
  const measurementLineRef = useRef<string | null>(null);

  useEffect(() => {
    if (!map || !measurementMode) {
      if (measurementLineRef.current && map?.getSource('measurement')) {
        const src = map.getSource('measurement') as maplibregl.GeoJSONSource;
        src.setData({ type: 'FeatureCollection', features: [] });
      }
      setMeasurementPoints([]);
      return;
    }

    if (!map.getSource('measurement')) {
      map.addSource('measurement', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      });

      map.addLayer({
        id: 'measurement-line',
        type: 'line',
        source: 'measurement',
        paint: {
          'line-color': '#ff6b6b',
          'line-width': 2,
          'line-dasharray': [2, 2]
        }
      });

      map.addLayer({
        id: 'measurement-point',
        type: 'circle',
        source: 'measurement',
        paint: {
          'circle-radius': 5,
          'circle-color': '#ff6b6b',
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff'
        }
      });
    }

    const handleClick = (e: maplibregl.MapMouseEvent & maplibregl.EventData) => {
      const { lng, lat } = e.lngLat;
      setMeasurementPoints(prev => [...prev, [lng, lat]]);
    };

    map.on('click', handleClick);

    return () => {
      map.off('click', handleClick);
    };
  }, [map, measurementMode]);

  useEffect(() => {
    if (!map || !measurementMode || measurementPoints.length < 2) {
      const src = map?.getSource('measurement') as maplibregl.GeoJSONSource | undefined;
      if (src) {
        src.setData({ type: 'FeatureCollection', features: [] });
      }
      return;
    }

    const src = map.getSource('measurement') as maplibregl.GeoJSONSource;
    if (!src) return;

    const features: GeoJSON.Feature[] = [];

    if (measurementPoints.length >= 2) {
      features.push({
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: measurementPoints
        },
        properties: {}
      });
    }

    measurementPoints.forEach((coord, idx) => {
      features.push({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: coord
        },
        properties: { index: idx }
      });
    });

    src.setData({
      type: 'FeatureCollection',
      features
    });
  }, [map, measurementMode, measurementPoints]);

  const distances = measurementPoints.length >= 2
    ? measurementPoints.slice(1).map((point, idx) => {
        const prev = measurementPoints[idx];
        return distanceMeters(prev, point);
      })
    : [];

  const totalDistance = distances.reduce((sum, d) => sum + d, 0);

  useEffect(() => {
    if (!measurementMode) {
      setMeasurementPoints([]);
    }
  }, [measurementMode]);

  return { measurementPoints, distances, totalDistance };
}

function distanceMeters(a: [number, number], b: [number, number]): number {
  const [lng1, lat1] = a;
  const [lng2, lat2] = b;
  const R = 6378137;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const la1 = (lat1 * Math.PI) / 180;
  const la2 = (lat2 * Math.PI) / 180;

  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);

  const h =
    sinDLat * sinDLat +
    Math.cos(la1) * Math.cos(la2) * sinDLng * sinDLng;

  return 2 * R * Math.asin(Math.sqrt(h));
}

