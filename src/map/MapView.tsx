/**
 * MapView Component
 * 
 * Main map component that handles:
 * - Map initialization with MapLibre GL
 * - Dynamic style switching while preserving entities
 * - Entity rendering (points, lines, polygons, circles, rectangles)
 * - Drawing tools integration
 * - Measurement tools
 * - Edit mode with vertex manipulation
 */

import React, { useEffect, useRef, useState, useMemo } from 'react';
import maplibregl, { Map as MlMap } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import { circleToPolygon } from './geometry';
import type { AnyEntity } from '../store/entitiesSlice';
import { useMapDrawing } from './useMapDrawing';
import { useMeasurement } from './useMeasurement';
import { NavigationControls } from '../components/toolbar/NavigationControls';
import { CoordinatesDisplay } from '../components/map/CoordinatesDisplay';
import { MeasurementPanel } from '../components/map/MeasurementPanel';
import { AdvancedTools } from '../components/toolbar/AdvancedTools';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

// Map style URLs (using free Carto basemaps)
const DEFAULT_STYLE = 'https://demotiles.maplibre.org/style.json';
const DARK_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';
const LIGHT_STYLE = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';
const VOYAGER_STYLE = 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json';

/**
 * Get map style URL based on map type
 * Uses free Carto basemaps that don't require API keys
 */
const getMapStyle = (mapType: string): string => {
  switch (mapType) {
    case 'satellite':
    case 'terrain':
      return VOYAGER_STYLE; // Voyager style with more detail
    case 'dark':
      return DARK_STYLE; // Dark theme basemap
    case 'osm':
      return LIGHT_STYLE; // Light theme basemap
    case 'default':
    default:
      return DEFAULT_STYLE; // MapLibre demo tiles
  }
};

/**
 * Add all necessary map sources and layers
 * This function is idempotent - it only adds sources/layers that don't already exist
 * 
 * Layers:
 * - entities: User-created geographic features (points, lines, polygons)
 * - draft: Temporary preview while drawing
 * - vertices: Edit mode vertex handles
 */
const addMapLayers = (map: MlMap) => {
  // Add entities source if it doesn't exist
  if (!map.getSource('entities')) {
    map.addSource('entities', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: []
      }
    });
  }

  // Add entity layers if they don't exist
  if (!map.getLayer('entities-fill')) {
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
  }

  if (!map.getLayer('entities-line')) {
    map.addLayer({
      id: 'entities-line',
      type: 'line',
      source: 'entities',
      paint: {
        'line-color': ['get', 'color'],
        'line-width': 2
      }
    });
  }

  if (!map.getLayer('entities-point')) {
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
  }

  // Add draft source for drawing preview
  if (!map.getSource('draft')) {
    map.addSource('draft', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: []
      }
    });
  }

  if (!map.getLayer('draft-line')) {
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
  }

  if (!map.getLayer('draft-point')) {
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
  }

  // Add vertices source for edit mode
  if (!map.getSource('vertices')) {
    map.addSource('vertices', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: []
      }
    });
  }

  if (!map.getLayer('vertices-point')) {
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
  }
};

export const MapView: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MlMap | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const previousMapTypeRef = useRef<string>('default');
  const isStyleChangingRef = useRef<boolean>(false);
  const entitiesRef = useRef<AnyEntity[]>([]);

  const allIds = useSelector((s: RootState) => s.entities.allIds);
  const byId = useSelector((s: RootState) => s.entities.byId);
  
  const entities = useMemo(() => {
    const result = allIds
      .map(id => byId[id])
      .filter(e => e && e.visible);
    entitiesRef.current = result;
    return result;
  }, [allIds, byId]);

  // Initialize map on component mount
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: getMapStyle('default'),
      center: [35, 31],
      zoom: 7,
      pitch: 0,
      bearing: 0
    });

    mapRef.current = map;

    map.doubleClickZoom.disable();

    map.on('load', () => {
      addMapLayers(map);
      setMapLoaded(true);
    });

    return () => {
      map.remove();
      mapRef.current = null;
      setMapLoaded(false);
    };
  }, []);

  // Custom hooks for map interactions
  const { draftCoords } = useMapDrawing(mapLoaded ? mapRef.current : null);
  const { measurementPoints, distances, totalDistance } = useMeasurement(mapLoaded ? mapRef.current : null);
  useKeyboardShortcuts();

  // UI state selectors
  const drawMode = useSelector((s: RootState) => s.ui.activeDrawMode);
  const selectedEntityId = useSelector((s: RootState) => s.entities.selectedId);
  const darkMode = useSelector((s: RootState) => s.ui.darkMode);
  const measurementMode = useSelector((s: RootState) => s.ui.measurementMode);
  const showCoordinates = useSelector((s: RootState) => s.ui.showCoordinates);
  const mapType = useSelector((s: RootState) => s.ui.mapType);

  // Helper function to convert entities to GeoJSON features
  const entitiesToFeatures = (entitiesList: typeof entities): GeoJSON.Feature[] => {
    return entitiesList.map(e => {
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

      return {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [0, 0]
        },
        properties: baseProps
      };
    });
  };

  // Handle map style changes while preserving entities
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    // Only change style if it's different from previous
    if (previousMapTypeRef.current === mapType) return;

    const newStyleUrl = getMapStyle(mapType);
    previousMapTypeRef.current = mapType;
    isStyleChangingRef.current = true;

    // Save current view state
    const center = map.getCenter();
    const zoom = map.getZoom();
    const bearing = map.getBearing();
    const pitch = map.getPitch();

    // Change map style
    map.setStyle(newStyleUrl);

    // Wait for style to fully load and map to be idle
    const onIdle = () => {
      // Remove the listener
      map.off('idle', onIdle);
      
      // Add layers
      addMapLayers(map);

      // Restore view state
      map.setCenter(center);
      map.setZoom(zoom);
      map.setBearing(bearing);
      map.setPitch(pitch);

      // Update entities
      const entitiesSrc = map.getSource('entities') as maplibregl.GeoJSONSource | undefined;
      if (entitiesSrc) {
        const features = entitiesToFeatures(entitiesRef.current);
        entitiesSrc.setData({
          type: 'FeatureCollection',
          features
        });
      }
      
      // Release the lock
      isStyleChangingRef.current = false;
    };
    
    map.once('idle', onIdle);
    
    return () => {
      map.off('idle', onIdle);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapType, mapLoaded]);

  // Update entities whenever they change
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || isStyleChangingRef.current) return;

    const src = map.getSource('entities') as maplibregl.GeoJSONSource | undefined;
    if (src) {
      const features = entitiesToFeatures(entities);
      src.setData({
        type: 'FeatureCollection',
        features
      });
    }
  }, [entities, mapLoaded]);

  // Update draft preview while drawing
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

  // Update vertices for edit mode
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

  // Apply dark mode filter
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;
    
    const container = map.getContainer();
    container.style.filter = darkMode ? 'brightness(0.6) contrast(1.2)' : '';
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


