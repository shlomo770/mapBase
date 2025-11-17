import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../../store';
import { setDrawMode, DrawMode } from '../../store/uiSlice';
import { MapTypeSelector } from '../map/MapTypeSelector';

const buttons: { id: DrawMode; label: string }[] = [
  { id: 'select', label: 'Select' },
  { id: 'edit', label: 'Edit' },
  { id: 'draw_point', label: 'Point' },
  { id: 'draw_line', label: 'Line' },
  { id: 'draw_polygon', label: 'Polygon' },
  { id: 'draw_circle', label: 'Circle' },
  { id: 'draw_rectangle', label: 'Rect' }
];

export const DrawToolbar: React.FC = () => {
  const dispatch = useDispatch();
  const active = useSelector((s: RootState) => s.ui.activeDrawMode);

  return (
    <div className="absolute left-4 top-20 z-20 flex flex-col gap-2">
      {buttons.map(btn => (
        <button
          key={btn.id}
          onClick={() => dispatch(setDrawMode(btn.id))}
          className={`px-3 py-1 text-xs rounded-md border 
            ${
              active === btn.id
                ? 'bg-accent text-black border-accent'
                : 'bg-slate-800/80 text-slate-200 border-slate-600 hover:bg-slate-700'
            }`}
        >
          {btn.label}
        </button>
      ))}
      <div className="mt-2">
        <MapTypeSelector />
      </div>
    </div>
  );
};


