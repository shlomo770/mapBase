import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setExampleFormOpen } from '../../store/uiSlice';

export const TopBar: React.FC = () => {
  const dispatch = useDispatch();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  return (
    <div className="h-12 flex items-center justify-between px-4 bg-slate-900 border-b border-slate-700 text-slate-100">
      <div className="flex items-center gap-3">
        <button
          onClick={() => dispatch(setExampleFormOpen(true))}
          className="p-2 hover:bg-slate-800 rounded-md transition-colors"
          title="Example Form"
        >
          <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </button>
        <div className="font-semibold tracking-wide">
          Map Editor <span className="text-accent">PRO</span>
        </div>
      </div>
      
      <div className="flex items-center gap-6 flex-1 justify-center">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5" title="Antenna Status">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
            </svg>
            <span className="text-xs text-white font-semibold">ANT</span>
          </div>
          
          <div className="flex items-center gap-1.5" title="Communication Status">
            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="text-xs text-green-500 font-semibold">COM</span>
          </div>
          
          <div className="flex items-center gap-1.5" title="GPS Status">
            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-xs text-red-500 font-semibold">GPS</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-xs text-slate-300">
          <span className="text-slate-400">🕐</span>
          <span>{formatTime(currentTime)}</span>
          <span className="text-slate-500">|</span>
          <span>{formatDate(currentTime)}</span>
        </div>
        
        <div className="px-2 py-0.5 bg-green-500/20 border border-green-500/50 rounded text-xs text-green-400 font-semibold">
          OPERATIONAL MODE
        </div>
      </div>
      
      <div className="text-xs text-slate-400">
        React · MapLibre · Redux
      </div>
    </div>
  );
};


