import { useEffect, useRef, useState } from 'react';
import maplibregl, { Map as MlMap, MapLayerMouseEvent } from 'maplibre-gl';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../store';
import { addEntity, updateEntity, setSelectedEntity } from '../store/entitiesSlice';
import { setDrawMode, setEditingEntity } from '../store/uiSlice';
import { bboxToRectangle } from './geometry';

export function useMapDrawing(map: MlMap | null) {
  const dispatch = useDispatch();
  const drawMode = useSelector((s: RootState) => s.ui.activeDrawMode);
  const measurementMode = useSelector((s: RootState) => s.ui.measurementMode);

  const [draftCoords, setDraftCoords] = useState<[number, number][]>([]);
  const dragState = useRef<{
    entityId: string | null;
    startLngLat: maplibregl.LngLat | null;
    originalCoords: any;
  }>({ entityId: null, startLngLat: null, originalCoords: null });
  const clickTimeoutRef = useRef<number | null>(null);
  const lastClickTimeRef = useRef<number>(0);
  const pendingClickRef = useRef<(() => void) | null>(null);
  const isProcessingClickRef = useRef<boolean>(false);
  const handlersRegisteredRef = useRef<Set<string>>(new Set());
  const editingEntityId = useSelector((s: RootState) => s.ui.editingEntityId);
  const editingVertexIndex = useSelector((s: RootState) => s.ui.editingVertexIndex);

  useEffect(() => {
    if (!map) return;
    if (measurementMode) return;
    if (drawMode === 'none' || drawMode === 'select' || drawMode === 'edit') return;

    const handleClick = (e: maplibregl.MapMouseEvent & maplibregl.EventData) => {
      e.preventDefault?.();
      
      if (isProcessingClickRef.current) {
        return;
      }
      
      const now = Date.now();
      const timeSinceLastClick = now - lastClickTimeRef.current;
      
      if (pendingClickRef.current) {
        clearTimeout(clickTimeoutRef.current!);
        pendingClickRef.current = null;
        clickTimeoutRef.current = null;
      }
      
      if (timeSinceLastClick < 300 && timeSinceLastClick > 0) {
        lastClickTimeRef.current = 0;
        return;
      }
      
      lastClickTimeRef.current = now;
      const { lng, lat } = e.lngLat;
      
      const clickAction = () => {
        if (isProcessingClickRef.current) {
          return;
        }
        isProcessingClickRef.current = true;
        
        if (drawMode === 'draw_point') {
          dispatch(
            addEntity({
              kind: 'point',
              data: { coordinates: [lng, lat] }
            } as any)
          );
          dispatch(setDrawMode('select'));
          setTimeout(() => {
            isProcessingClickRef.current = false;
          }, 100);
          return;
        }

        if (drawMode === 'draw_line' || drawMode === 'draw_polygon') {
          setDraftCoords(prev => [...prev, [lng, lat]]);
          setTimeout(() => {
            isProcessingClickRef.current = false;
          }, 100);
          return;
        }

        if (drawMode === 'draw_circle') {
          setDraftCoords(prev => {
            if (prev.length === 0) {
              setTimeout(() => {
                isProcessingClickRef.current = false;
              }, 100);
              return [[lng, lat]];
            } else if (prev.length === 1) {
              const [cx, cy] = prev[0];
              const rMeters = distanceMeters([cx, cy], [lng, lat]);
              dispatch(
                addEntity({
                  kind: 'circle',
                  data: { center: [cx, cy], radiusMeters: rMeters }
                } as any)
              );
              dispatch(setDrawMode('select'));
              setTimeout(() => {
                isProcessingClickRef.current = false;
              }, 100);
              return [];
            }
            setTimeout(() => {
              isProcessingClickRef.current = false;
            }, 100);
            return prev;
          });
          return;
        }

        if (drawMode === 'draw_rectangle') {
          setDraftCoords(prev => {
            if (prev.length === 0) {
              setTimeout(() => {
                isProcessingClickRef.current = false;
              }, 100);
              return [[lng, lat]];
            } else if (prev.length === 1) {
              const rect = bboxToRectangle(prev[0], [lng, lat]);
              dispatch(
                addEntity({
                  kind: 'rectangle',
                  data: { coordinates: rect }
                } as any)
              );
              dispatch(setDrawMode('select'));
              setTimeout(() => {
                isProcessingClickRef.current = false;
              }, 100);
              return [];
            }
            setTimeout(() => {
              isProcessingClickRef.current = false;
            }, 100);
            return prev;
          });
          return;
        }
        
        setTimeout(() => {
          isProcessingClickRef.current = false;
        }, 100);
      };
      
      const executeClick = () => {
        if (!pendingClickRef.current) return;
        const fn = pendingClickRef.current;
        pendingClickRef.current = null;
        clickTimeoutRef.current = null;
        
        fn();
      };
      
      pendingClickRef.current = clickAction;
      clickTimeoutRef.current = window.setTimeout(executeClick, 300);
    };

    const handlerKey = 'draw-click';
    if (handlersRegisteredRef.current.has(handlerKey)) {
      map.off('click', handleClick);
      handlersRegisteredRef.current.delete(handlerKey);
    }
    
    map.on('click', handleClick);
    handlersRegisteredRef.current.add(handlerKey);
    
    return () => {
      if (handlersRegisteredRef.current.has(handlerKey)) {
        map.off('click', handleClick);
        handlersRegisteredRef.current.delete(handlerKey);
      }
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
        clickTimeoutRef.current = null;
      }
      pendingClickRef.current = null;
      isProcessingClickRef.current = false;
    };
  }, [map, drawMode, measurementMode, dispatch]);

  useEffect(() => {
    if (!map) return;
    if (drawMode !== 'draw_line' && drawMode !== 'draw_polygon') return;

    const handleDbl = (e: maplibregl.MapMouseEvent & maplibregl.EventData) => {
      e.preventDefault?.();
      
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
        clickTimeoutRef.current = null;
      }
      if (pendingClickRef.current) {
        pendingClickRef.current = null;
      }
      lastClickTimeRef.current = 0;
      
      setDraftCoords(prev => {
        if (drawMode === 'draw_line' && prev.length >= 2) {
          setTimeout(() => {
            dispatch(
              addEntity({
                kind: 'line',
                data: { coordinates: prev }
              } as any)
            );
            dispatch(setDrawMode('select'));
          }, 0);
          return [];
        }

        if (drawMode === 'draw_polygon' && prev.length >= 3) {
          setTimeout(() => {
            dispatch(
              addEntity({
                kind: 'polygon',
                data: { coordinates: [...prev, prev[0]] }
              } as any)
            );
            dispatch(setDrawMode('select'));
          }, 0);
          return [];
        }

        return prev;
      });
    };

    const handlerKey = 'draw-dblclick';
    if (handlersRegisteredRef.current.has(handlerKey)) {
      map.off('dblclick', handleDbl);
      handlersRegisteredRef.current.delete(handlerKey);
    }
    
    map.on('dblclick', handleDbl);
    handlersRegisteredRef.current.add(handlerKey);
    
    return () => {
      if (handlersRegisteredRef.current.has(handlerKey)) {
        map.off('dblclick', handleDbl);
        handlersRegisteredRef.current.delete(handlerKey);
      }
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
        clickTimeoutRef.current = null;
      }
      pendingClickRef.current = null;
    };
  }, [map, drawMode, dispatch]);

  const editingEntity = useSelector((s: RootState) => 
    editingEntityId ? s.entities.byId[editingEntityId] : null
  );

  useEffect(() => {
    if (!map) return;
    if (drawMode !== 'edit' || !editingEntityId || !editingEntity) return;

    const handleClick = (e: maplibregl.MapMouseEvent & maplibregl.EventData) => {
      if (editingVertexIndex === null) return;
      
      const { lng, lat } = e.lngLat;
      const vertexIndex = editingVertexIndex;

      if (editingEntity.kind === 'point') {
        dispatch(updateEntity({
          id: editingEntity.id,
          changes: { coordinates: [lng, lat] } as any
        }));
        dispatch(setEditingEntity({ entityId: null }));
        dispatch(setDrawMode('select'));
      } else if (editingEntity.kind === 'line') {
        const newCoords = [...editingEntity.coordinates];
        newCoords[vertexIndex] = [lng, lat];
        dispatch(updateEntity({
          id: editingEntity.id,
          changes: { coordinates: newCoords } as any
        }));
        dispatch(setEditingEntity({ entityId: null }));
        dispatch(setDrawMode('select'));
      } else if (editingEntity.kind === 'polygon') {
        const newCoords = [...editingEntity.coordinates];
        newCoords[vertexIndex] = [lng, lat];
        if (vertexIndex === newCoords.length - 1) {
          newCoords[0] = [lng, lat];
        }
        dispatch(updateEntity({
          id: editingEntity.id,
          changes: { coordinates: newCoords } as any
        }));
        dispatch(setEditingEntity({ entityId: null }));
        dispatch(setDrawMode('select'));
      } else if (editingEntity.kind === 'circle') {
        if (editingVertexIndex === -1) {
          dispatch(updateEntity({
            id: editingEntity.id,
            changes: { center: [lng, lat] } as any
          }));
        } else {
          const rMeters = distanceMeters(editingEntity.center, [lng, lat]);
          dispatch(updateEntity({
            id: editingEntity.id,
            changes: { radiusMeters: rMeters } as any
          }));
        }
        dispatch(setEditingEntity({ entityId: null }));
        dispatch(setDrawMode('select'));
      } else if (editingEntity.kind === 'rectangle') {
        const newCoords = [...editingEntity.coordinates];
        newCoords[vertexIndex] = [lng, lat];
        const rect = bboxToRectangle(
          newCoords[0],
          newCoords[2] || newCoords[0]
        );
        dispatch(updateEntity({
          id: editingEntity.id,
          changes: { coordinates: rect } as any
        }));
        dispatch(setEditingEntity({ entityId: null }));
        dispatch(setDrawMode('select'));
      }
    };

    const handlerKey = 'edit-click';
    if (!handlersRegisteredRef.current.has(handlerKey)) {
      map.on('click', handleClick);
      handlersRegisteredRef.current.add(handlerKey);
    }
    
    return () => {
      if (handlersRegisteredRef.current.has(handlerKey)) {
        map.off('click', handleClick);
        handlersRegisteredRef.current.delete(handlerKey);
      }
    };
  }, [map, drawMode, editingEntityId, editingVertexIndex, editingEntity, dispatch]);

  useEffect(() => {
    if (!map) return;
    if (drawMode !== 'edit') return;

    const onVertexClick = (e: MapLayerMouseEvent) => {
      e.preventDefault?.();
      const feature = e.features?.[0];
      if (!feature) return;
      const entityId = feature.properties?.entityId as string | undefined;
      const vertexIndex = feature.properties?.vertexIndex as number | undefined;
      if (!entityId || vertexIndex === undefined) return;

      dispatch(setEditingEntity({ entityId, vertexIndex }));
      map.getCanvas().style.cursor = 'crosshair';
    };

    if (map.getLayer('vertices-point')) {
      const handlerKey = 'vertex-click';
      if (!handlersRegisteredRef.current.has(handlerKey)) {
        map.on('click', 'vertices-point', onVertexClick);
        handlersRegisteredRef.current.add(handlerKey);
      }
      
      return () => {
        if (handlersRegisteredRef.current.has(handlerKey)) {
          map.off('click', 'vertices-point', onVertexClick);
          handlersRegisteredRef.current.delete(handlerKey);
        }
      };
    }
  }, [map, drawMode, dispatch]);

  useEffect(() => {
    if (!map) return;
    if (drawMode !== 'select' && drawMode !== 'none') return;

    const onDown = (e: MapLayerMouseEvent) => {
      const feature = e.features?.[0];
      if (!feature) return;
      const entityId = feature.properties?.id as string | undefined;
      if (!entityId) return;

      dragState.current.entityId = entityId;
      dragState.current.startLngLat = e.lngLat;
      dragState.current.originalCoords = feature.geometry;

      map.getCanvas().style.cursor = 'grabbing';
      dispatch(setSelectedEntity(entityId));
    };

    const onMove = (e: maplibregl.MapMouseEvent & maplibregl.EventData) => {
      if (!dragState.current.entityId || !dragState.current.startLngLat) return;
      const { lng, lat } = e.lngLat;
      const { lng: slng, lat: slat } = dragState.current.startLngLat;
      const dLng = lng - slng;
      const dLat = lat - slat;

      const id = dragState.current.entityId;
      const geom = dragState.current.originalCoords;

      if (!geom) return;

      if (geom.type === 'Point') {
        const [x, y] = geom.coordinates as [number, number];
        dispatch(
          updateEntity({
            id,
            changes: { coordinates: [x + dLng, y + dLat] } as any
          })
        );
      } else if (geom.type === 'LineString' || geom.type === 'Polygon') {
        const coords = geom.type === 'LineString'
          ? (geom.coordinates as [number, number][])
          : (geom.coordinates[0] as [number, number][]);

        const moved = coords.map(([x, y]) => [x + dLng, y + dLat]) as [number, number][];

        if (geom.type === 'LineString') {
          dispatch(
            updateEntity({
              id,
              changes: { coordinates: moved } as any
            })
          );
        } else {
          dispatch(
            updateEntity({
              id,
              changes: { coordinates: moved } as any
            })
          );
        }
      }
    };

    const onUp = () => {
      dragState.current = { entityId: null, startLngLat: null, originalCoords: null };
      map.getCanvas().style.cursor = '';
    };

    const layers = ['entities-fill', 'entities-line', 'entities-point'];

    layers.forEach(layerId => {
      if (map.getLayer(layerId)) {
        map.on('mousedown', layerId, onDown);
      }
    });

    map.on('mousemove', onMove);
    map.on('mouseup', onUp);

    return () => {
      layers.forEach(layerId => {
        if (map.getLayer(layerId)) {
          map.off('mousedown', layerId, onDown);
        }
      });
      map.off('mousemove', onMove);
      map.off('mouseup', onUp);
    };
  }, [map, drawMode, dispatch]);

  return { draftCoords };
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


