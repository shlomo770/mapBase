import React from 'react';
import { useDispatch } from 'react-redux';
import { setMeasurementMode } from '../../store/uiSlice';

interface MeasurementPanelProps {
  points: [number, number][];
  distances: number[];
  totalDistance: number;
}

export const MeasurementPanel: React.FC<MeasurementPanelProps> = ({
  points,
  distances,
  totalDistance
}) => {
  const dispatch = useDispatch();

  const formatDistance = (meters: number): string => {
    if (meters < 1000) {
      return `${meters.toFixed(2)} m`;
    }
    return `${(meters / 1000).toFixed(2)} km`;
  };

  if (points.length === 0) return null;

  return (
    <div className="absolute top-20 left-64 z-20 bg-slate-900/90 border border-slate-700 rounded-md p-3 text-xs text-slate-200 min-w-[200px]">
      <div className="flex items-center justify-between mb-2">
        <div className="font-semibold">Measurement</div>
        <button
          onClick={() => dispatch(setMeasurementMode(false))}
          className="text-slate-400 hover:text-slate-200"
        >
          ✕
        </button>
      </div>
      <div className="space-y-1">
        <div>Points: {points.length}</div>
        {distances.map((dist, idx) => (
          <div key={idx} className="text-slate-400">
            Segment {idx + 1}: {formatDistance(dist)}
          </div>
        ))}
        {totalDistance > 0 && (
          <div className="font-semibold text-accent mt-2 pt-2 border-t border-slate-700">
            Total Distance: {formatDistance(totalDistance)}
          </div>
        )}
        <div className="text-[10px] text-slate-400 mt-2 pt-2 border-t border-slate-700">
          💡 Double-click to finish measurement
        </div>
      </div>
    </div>
  );
};

