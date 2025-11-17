import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../store';
import { setDrawMode } from '../store/uiSlice';
import { removeEntity } from '../store/entitiesSlice';

export function useKeyboardShortcuts() {
  const dispatch = useDispatch();
  const selectedId = useSelector((s: RootState) => s.entities.selectedId);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedId) {
          dispatch(removeEntity(selectedId));
        }
      }

      if (e.key === 'Escape') {
        dispatch(setDrawMode('select'));
      }

      if (e.ctrlKey || e.metaKey) return;

      switch (e.key) {
        case 's':
          dispatch(setDrawMode('select'));
          break;
        case 'e':
          dispatch(setDrawMode('edit'));
          break;
        case 'p':
          dispatch(setDrawMode('draw_point'));
          break;
        case 'l':
          dispatch(setDrawMode('draw_line'));
          break;
        case 'g':
          dispatch(setDrawMode('draw_polygon'));
          break;
        case 'c':
          dispatch(setDrawMode('draw_circle'));
          break;
        case 'r':
          dispatch(setDrawMode('draw_rectangle'));
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [dispatch, selectedId]);
}

