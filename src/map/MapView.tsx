import React, { useEffect, useRef, useState, useMemo } from 'react';
import maplibregl, { Map as MlMap } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import { circleToPolygon } from './geometry';
import { useMapDrawing } from './useMapDrawing';
import { useMeasurement } from './useMeasurement';
import { NavigationControls } from '../components/toolbar/NavigationControls';
import { CoordinatesDisplay } from '../components/map/CoordinatesDisplay';
import { MeasurementPanel } from '../components/map/MeasurementPanel';
import { AdvancedTools } from '../components/toolbar/AdvancedTools';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

const DEFAULT_STYLE = 'https://demotiles.maplibre.org/style.json';

export const MapView: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MlMap | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  const allIds = useSelector((s: RootState) => s.entities.allIds);
  const byId = useSelector((s: RootState) => s.entities.byId);
  
  const entities = useMemo(() => {
    return allIds
      .map(id => byId[id])
      .filter(e => e && e.visible);
  }, [allIds, byId]);

  // init map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: DEFAULT_STYLE,
      center: [35, 31],
      zoom: 7,
      pitch: 0,
      bearing: 0
    });

    mapRef.current = map;

    map.doubleClickZoom.disable();

    map.on('load', () => {
      map.addSource('entities', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: []
        }
      });

      map.addLayer({
        id: 'entities-fill',
        type: 'fill',
        source: 'entities',
        filter: ['==', ['get', 'fill'], true],
        paint: {
          'fill-color': ['get', 'color'],
          'fill-opacity': 0.25
        }
      });

      map.addLayer({
        id: 'entities-line',
        type: 'line',
        source: 'entities',
        paint: {
          'line-color': ['get', 'color'],
          'line-width': 2
        }
      });

      map.addLayer({
        id: 'entities-point',
        type: 'circle',
        source: 'entities',
        filter: ['==', ['geometry-type'], 'Point'],
        paint: {
          'circle-radius': 6,
          'circle-color': ['get', 'color'],
          'circle-stroke-width': 1,
          'circle-stroke-color': '#000000'
        }
      });

      map.addSource('draft', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: []
        }
      });

      map.addLayer({
        id: 'draft-line',
        type: 'line',
        source: 'draft',
        paint: {
          'line-color': '#ff0000',
          'line-width': 2,
          'line-dasharray': [2, 2]
        }
      });

      map.addLayer({
        id: 'draft-point',
        type: 'circle',
        source: 'draft',
        paint: {
          'circle-radius': 4,
          'circle-color': '#ff0000',
          'circle-stroke-width': 1,
          'circle-stroke-color': '#ffffff'
        }
      });

      map.addSource('vertices', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: []
        }
      });

      map.addLayer({
        id: 'vertices-point',
        type: 'circle',
        source: 'vertices',
        paint: {
          'circle-radius': 8,
          'circle-color': '#00ff00',
          'circle-stroke-width': 2,
          'circle-stroke-color': '#000000'
        }
      });

      setMapLoaded(true);
    });

    return () => {
      map.remove();
      mapRef.current = null;
      setMapLoaded(false);
    };
  }, []);

  const { draftCoords } = useMapDrawing(mapLoaded ? mapRef.current : null);
  const { measurementPoints, distances, totalDistance } = useMeasurement(mapLoaded ? mapRef.current : null);
  const drawMode = useSelector((s: RootState) => s.ui.activeDrawMode);
  const selectedEntityId = useSelector((s: RootState) => s.entities.selectedId);
  const darkMode = useSelector((s: RootState) => s.ui.darkMode);
  const measurementMode = useSelector((s: RootState) => s.ui.measurementMode);
  const showCoordinates = useSelector((s: RootState) => s.ui.showCoordinates);
  
  useKeyboardShortcuts();

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const src = map.getSource('entities') as maplibregl.GeoJSONSource | undefined;
    if (!src) return;

    const features: GeoJSON.Feature[] = entities.map(e => {
      const baseProps = {
        id: e.id,
        kind: e.kind,
        name: e.name,
        color: e.color
      };

      if (e.kind === 'point') {
        return {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: e.coordinates
          },
          properties: baseProps
        };
      }

      if (e.kind === 'line') {
        return {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: e.coordinates
          },
          properties: baseProps
        };
      }

      if (e.kind === 'polygon') {
        return {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [e.coordinates]
          },
          properties: { ...baseProps, fill: true }
        };
      }

      if (e.kind === 'circle') {
        const poly = circleToPolygon(e.center, e.radiusMeters);
        return {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [poly]
          },
          properties: { ...baseProps, fill: true }
        };
      }

      if (e.kind === 'rectangle') {
        return {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [e.coordinates]
          },
          properties: { ...baseProps, fill: true }
        };
      }

      // fallback
      return {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [0, 0]
        },
        properties: baseProps
      };
    });

    src.setData({
      type: 'FeatureCollection',
      features
    });
  }, [entities]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    const draftSrc = map.getSource('draft') as maplibregl.GeoJSONSource | undefined;
    if (!draftSrc) return;

    if (draftCoords.length === 0) {
      draftSrc.setData({
        type: 'FeatureCollection',
        features: []
      });
      return;
    }

    const draftFeatures: GeoJSON.Feature[] = [];

    if (drawMode === 'draw_line' || drawMode === 'draw_polygon') {
      if (draftCoords.length >= 2) {
        draftFeatures.push({
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: draftCoords
          },
          properties: {}
        });
      }
      draftCoords.forEach(coord => {
        draftFeatures.push({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: coord
          },
          properties: {}
        });
      });
    } else if (drawMode === 'draw_circle' && draftCoords.length === 1) {
      draftFeatures.push({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: draftCoords[0]
        },
        properties: {}
      });
    } else if (drawMode === 'draw_rectangle' && draftCoords.length === 1) {
      draftFeatures.push({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: draftCoords[0]
        },
        properties: {}
      });
    }

    draftSrc.setData({
      type: 'FeatureCollection',
      features: draftFeatures
    });
  }, [draftCoords, drawMode, mapLoaded]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    const verticesSrc = map.getSource('vertices') as maplibregl.GeoJSONSource | undefined;
    if (!verticesSrc) return;

    if (drawMode !== 'edit' || !selectedEntityId) {
      verticesSrc.setData({
        type: 'FeatureCollection',
        features: []
      });
      return;
    }

    const entity = entities.find(e => e.id === selectedEntityId);
    if (!entity) {
      verticesSrc.setData({
        type: 'FeatureCollection',
        features: []
      });
      return;
    }

    const vertexFeatures: GeoJSON.Feature[] = [];

    if (entity.kind === 'point') {
      vertexFeatures.push({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: entity.coordinates
        },
        properties: { entityId: entity.id, vertexIndex: 0 }
      });
    } else if (entity.kind === 'line') {
      entity.coordinates.forEach((coord, idx) => {
        vertexFeatures.push({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: coord
          },
          properties: { entityId: entity.id, vertexIndex: idx }
        });
      });
    } else if (entity.kind === 'polygon') {
      const coords = entity.coordinates.slice(0, -1);
      coords.forEach((coord, idx) => {
        vertexFeatures.push({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: coord
          },
          properties: { entityId: entity.id, vertexIndex: idx }
        });
      });
    } else if (entity.kind === 'circle') {
      vertexFeatures.push({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: entity.center
        },
        properties: { entityId: entity.id, vertexIndex: -1, type: 'center' }
      });
      const poly = circleToPolygon(entity.center, entity.radiusMeters, 64);
      if (poly.length > 0) {
        vertexFeatures.push({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: poly[Math.floor(poly.length / 4)]
          },
          properties: { entityId: entity.id, vertexIndex: -2, type: 'radius' }
        });
      }
    } else if (entity.kind === 'rectangle') {
      const corners = entity.coordinates.slice(0, 4);
      corners.forEach((coord, idx) => {
        vertexFeatures.push({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: coord
          },
          properties: { entityId: entity.id, vertexIndex: idx }
        });
      });
    }

    verticesSrc.setData({
      type: 'FeatureCollection',
      features: vertexFeatures
    });
  }, [drawMode, selectedEntityId, entities, mapLoaded]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;
    
    const container = map.getContainer();
    if (darkMode) {
      container.style.filter = 'brightness(0.6) contrast(1.2)';
    } else {
      container.style.filter = '';
    }
  }, [darkMode, mapLoaded]);

  return (
    <>
      <div ref={containerRef} className="map-container rounded-lg shadow-lg" />
      <NavigationControls map={mapLoaded ? mapRef.current : null} />
      <AdvancedTools map={mapLoaded ? mapRef.current : null} />
      <CoordinatesDisplay map={mapLoaded ? mapRef.current : null} visible={showCoordinates} />
      {measurementMode && (
        <MeasurementPanel
          points={measurementPoints}
          distances={distances}
          totalDistance={totalDistance}
        />
      )}
    </>
  );
};


