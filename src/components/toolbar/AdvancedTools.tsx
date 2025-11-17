import React, { useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import maplibregl from 'maplibre-gl';
import type { RootState } from '../../store';
import { addEntity } from '../../store/entitiesSlice';

interface AdvancedToolsProps {
  map: maplibregl.Map | null;
}

export const AdvancedTools: React.FC<AdvancedToolsProps> = ({ map }) => {
  const dispatch = useDispatch();
  const entities = useSelector((s: RootState) => s.entities);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportGeoJSON = () => {
    const features: GeoJSON.Feature[] = entities.allIds
      .map(id => {
        const e = entities.byId[id];
        if (!e || !e.visible) return null;

        let geometry: GeoJSON.Geometry;
        if (e.kind === 'point') {
          geometry = { type: 'Point', coordinates: e.coordinates };
        } else if (e.kind === 'line') {
          geometry = { type: 'LineString', coordinates: e.coordinates };
        } else if (e.kind === 'polygon') {
          geometry = { type: 'Polygon', coordinates: [e.coordinates] };
        } else if (e.kind === 'circle') {
          const R = 6378137;
          const [lng, lat] = e.center;
          const steps = 64;
          const coords: [number, number][] = [];
          for (let i = 0; i <= steps; i++) {
            const angle = (i / steps) * 2 * Math.PI;
            const dx = e.radiusMeters * Math.cos(angle);
            const dy = e.radiusMeters * Math.sin(angle);
            const dLng = (dx / (R * Math.cos((lat * Math.PI) / 180))) * (180 / Math.PI);
            const dLat = (dy / R) * (180 / Math.PI);
            coords.push([lng + dLng, lat + dLat]);
          }
          geometry = { type: 'Polygon', coordinates: [coords] };
        } else if (e.kind === 'rectangle') {
          geometry = { type: 'Polygon', coordinates: [e.coordinates] };
        } else {
          return null;
        }

        return {
          type: 'Feature',
          geometry,
          properties: {
            id: e.id,
            kind: e.kind,
            name: e.name,
            color: e.color,
            visible: e.visible
          }
        };
      })
      .filter((f): f is GeoJSON.Feature => f !== null);

    const geoJSON: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features
    };

    const blob = new Blob([JSON.stringify(geoJSON, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `map-export-${new Date().toISOString().split('T')[0]}.geojson`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportGeoJSON = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const geoJSON = JSON.parse(event.target?.result as string) as GeoJSON.FeatureCollection;
        geoJSON.features.forEach(feature => {
          const props = feature.properties || {};
          let data: any;

          if (feature.geometry.type === 'Point') {
            data = { coordinates: feature.geometry.coordinates };
            dispatch(addEntity({ kind: 'point', data, name: props.name, color: props.color } as any));
          } else if (feature.geometry.type === 'LineString') {
            data = { coordinates: feature.geometry.coordinates };
            dispatch(addEntity({ kind: 'line', data, name: props.name, color: props.color } as any));
          } else if (feature.geometry.type === 'Polygon') {
            data = { coordinates: feature.geometry.coordinates[0] };
            dispatch(addEntity({ kind: 'polygon', data, name: props.name, color: props.color } as any));
          }
        });
      } catch (error) {
        alert('Error reading file');
        console.error(error);
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  const handleExportImage = () => {
    if (!map) return;
    map.getCanvas().toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `map-screenshot-${new Date().toISOString().split('T')[0]}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }, 'image/png');
  };

  const handleCopySelected = () => {
    const selectedId = entities.selectedId;
    if (!selectedId) {
      alert('Please select an entity to copy');
      return;
    }
    const entity = entities.byId[selectedId];
    if (!entity) return;

    const entityData = JSON.stringify({
      kind: entity.kind,
      data: entity.kind === 'circle' 
        ? { center: entity.center, radiusMeters: entity.radiusMeters }
        : { coordinates: entity.coordinates },
      name: `${entity.name} (Copy)`,
      color: entity.color
    });
    navigator.clipboard.writeText(entityData);
    alert('Entity copied! Use Paste to paste it');
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const entityData = JSON.parse(text);
      dispatch(addEntity(entityData as any));
    } catch (error) {
      alert('No copied entity found');
    }
  };

  return (
    <div className="absolute left-4 bottom-4 z-20 flex flex-col gap-2">
      <input
        ref={fileInputRef}
        type="file"
        accept=".geojson,.json"
        onChange={handleFileChange}
        className="hidden"
      />
      
      <div className="bg-slate-800/90 border border-slate-600 rounded-md p-2 flex flex-col gap-2">
        <div className="text-xs font-semibold text-slate-300 mb-1">Advanced Tools</div>
        
        <button
          onClick={handleExportGeoJSON}
          className="px-3 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 rounded border border-slate-600"
          title="Export to GeoJSON"
        >
          📥 Export GeoJSON
        </button>
        
        <button
          onClick={handleImportGeoJSON}
          className="px-3 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 rounded border border-slate-600"
          title="Import from GeoJSON"
        >
          📤 Import GeoJSON
        </button>
        
        <button
          onClick={handleExportImage}
          className="px-3 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 rounded border border-slate-600"
          title="Export as Image"
        >
          📷 Screenshot
        </button>
        
        <div className="border-t border-slate-600 my-1" />
        
        <button
          onClick={handleCopySelected}
          className="px-3 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 rounded border border-slate-600"
          title="Copy Selected Entity"
        >
          📋 Copy
        </button>
        
        <button
          onClick={handlePaste}
          className="px-3 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 rounded border border-slate-600"
          title="Paste Entity"
        >
          📄 Paste
        </button>
      </div>
    </div>
  );
};

