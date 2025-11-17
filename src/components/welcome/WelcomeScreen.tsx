import React from 'react';
import { useDispatch } from 'react-redux';
import { setWelcomeScreenClosed } from '../../store/uiSlice';

export const WelcomeScreen: React.FC = () => {
  const dispatch = useDispatch();

  const handleEnter = () => {
    dispatch(setWelcomeScreenClosed());
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center z-50">
      <div className="text-center space-y-8 px-8">
        <div className="flex justify-center">
          <div className="relative">
            <svg
              className="w-40 h-40 text-accent"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-24 h-24 bg-accent/30 rounded-full blur-2xl animate-pulse"></div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h1 className="text-5xl font-bold text-white tracking-wide">
            BASE <span className="text-accent">MAPS</span>
          </h1>
          <p className="text-slate-400 text-lg">
            Professional Map Editor & Analysis System
          </p>
        </div>

        <button
          onClick={handleEnter}
          className="px-8 py-3 bg-accent text-black font-semibold rounded-lg hover:bg-accent/90 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-accent/50 text-lg"
        >
          ENTER SYSTEM
        </button>

        <div className="pt-8 text-xs text-slate-500">
          <p>React · TypeScript · MapLibre · Redux</p>
        </div>
      </div>
    </div>
  );
};

