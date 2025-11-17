import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../../store';
import { setMapType, type MapType } from '../../store/uiSlice';

export const MapTypeSelector: React.FC = () => {
  const dispatch = useDispatch();
  const mapType = useSelector((s: RootState) => s.ui.mapType);

  const mapTypes: { value: MapType; label: string; icon: string }[] = [
    { value: 'default', label: 'ברירת מחדל', icon: '🗺️' },
    { value: 'satellite', label: 'לוויין', icon: '🛰️' },
    { value: 'terrain', label: 'טופוגרפיה', icon: '⛰️' },
    { value: 'dark', label: 'כהה', icon: '🌙' },
    { value: 'osm', label: 'OpenStreetMap', icon: '🌍' }
  ];

  return (
    <div className="bg-slate-800/90 border border-slate-600 rounded-md p-2">
      <div className="text-xs font-semibold text-slate-300 mb-2">סוג מפה</div>
      <div className="flex flex-col gap-1">
        {mapTypes.map((type) => (
          <button
            key={type.value}
            onClick={() => dispatch(setMapType(type.value))}
            className={`px-3 py-1.5 text-xs rounded border transition-colors ${
              mapType === type.value
                ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-500'
                : 'bg-slate-700 hover:bg-slate-600 text-slate-200 border-slate-600'
            }`}
            title={type.label}
          >
            <span className="mr-2">{type.icon}</span>
            {type.label}
          </button>
        ))}
      </div>
    </div>
  );
};

