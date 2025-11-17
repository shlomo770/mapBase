import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import maplibregl from 'maplibre-gl';
import type { RootState } from '../../store';
import { setDarkMode, setMeasurementMode, setShowCoordinates } from '../../store/uiSlice';

interface NavigationControlsProps {
  map: maplibregl.Map | null;
}

export const NavigationControls: React.FC<NavigationControlsProps> = ({ map }) => {
  const dispatch = useDispatch();
  const darkMode = useSelector((s: RootState) => s.ui.darkMode);
  const measurementMode = useSelector((s: RootState) => s.ui.measurementMode);
  const showCoordinates = useSelector((s: RootState) => s.ui.showCoordinates);

  const handleZoomIn = () => {
    if (!map) return;
    map.zoomIn();
  };

  const handleZoomOut = () => {
    if (!map) return;
    map.zoomOut();
  };

  const handleResetNorth = () => {
    if (!map) return;
    map.resetNorthPitch();
  };

  const handleRotateLeft = () => {
    if (!map) return;
    const currentBearing = map.getBearing();
    map.rotateTo(currentBearing - 15, { duration: 300 });
  };

  const handleRotateRight = () => {
    if (!map) return;
    const currentBearing = map.getBearing();
    map.rotateTo(currentBearing + 15, { duration: 300 });
  };

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <div className="absolute top-20 right-4 z-20 flex flex-col gap-2">
      {/* Zoom Controls */}
      <div className="bg-slate-800/80 border border-slate-600 rounded-md overflow-hidden">
        <button
          onClick={handleZoomIn}
          className="w-8 h-8 flex items-center justify-center text-slate-200 hover:bg-slate-700 border-b border-slate-600"
          title="Zoom In"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
        <button
          onClick={handleZoomOut}
          className="w-8 h-8 flex items-center justify-center text-slate-200 hover:bg-slate-700"
          title="Zoom Out"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>
      </div>

      {/* Compass / Reset North */}
      <button
        onClick={handleResetNorth}
        className="w-8 h-8 bg-slate-800/80 border border-slate-600 rounded-md text-slate-200 hover:bg-slate-700 flex items-center justify-center"
        title="Reset North"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
      </button>

      {/* Rotation Controls */}
      <div className="bg-slate-800/80 border border-slate-600 rounded-md overflow-hidden">
        <button
          onClick={handleRotateLeft}
          className="w-8 h-8 flex items-center justify-center text-slate-200 hover:bg-slate-700 border-b border-slate-600"
          title="Rotate Left"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
        <button
          onClick={handleRotateRight}
          className="w-8 h-8 flex items-center justify-center text-slate-200 hover:bg-slate-700"
          title="Rotate Right"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" transform="scale(-1,1) translate(-24,0)" />
          </svg>
        </button>
      </div>

      {/* Dark Mode Toggle */}
      <button
        onClick={() => dispatch(setDarkMode(!darkMode))}
        className={`w-8 h-8 border rounded-md flex items-center justify-center ${
          darkMode
            ? 'bg-yellow-500/20 border-yellow-500 text-yellow-300'
            : 'bg-slate-800/80 border-slate-600 text-slate-200 hover:bg-slate-700'
        }`}
        title={darkMode ? 'Light Mode' : 'Dark Mode'}
      >
        {darkMode ? (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
          </svg>
        )}
      </button>

      {/* Measurement Tool */}
      <button
        onClick={() => dispatch(setMeasurementMode(!measurementMode))}
        className={`w-8 h-8 border rounded-md flex items-center justify-center ${
          measurementMode
            ? 'bg-accent/20 border-accent text-accent'
            : 'bg-slate-800/80 border-slate-600 text-slate-200 hover:bg-slate-700'
        }`}
        title="Measurement Tool"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
      </button>

      {/* Fullscreen */}
      <button
        onClick={handleFullscreen}
        className="w-8 h-8 bg-slate-800/80 border border-slate-600 rounded-md text-slate-200 hover:bg-slate-700 flex items-center justify-center"
        title="Fullscreen"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
        </svg>
      </button>
    </div>
  );
};

