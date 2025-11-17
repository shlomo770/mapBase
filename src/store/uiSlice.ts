import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { EntityKind } from './entitiesSlice';

export type DrawMode =
  | 'none'
  | 'draw_point'
  | 'draw_line'
  | 'draw_polygon'
  | 'draw_circle'
  | 'draw_rectangle'
  | 'select'
  | 'edit';

interface UIState {
  activeDrawMode: DrawMode;
  rightSidebarOpen: boolean;
  editingEntityId: string | null;
  editingVertexIndex: number | null;
  darkMode: boolean;
  measurementMode: boolean;
  showCoordinates: boolean;
  welcomeScreenClosed: boolean;
  exampleFormOpen: boolean;
}

const initialState: UIState = {
  activeDrawMode: 'none',
  rightSidebarOpen: true,
  editingEntityId: null,
  editingVertexIndex: null,
  darkMode: false,
  measurementMode: false,
  showCoordinates: true,
  welcomeScreenClosed: false,
  exampleFormOpen: false
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setDrawMode: (state, action: PayloadAction<DrawMode>) => {
      state.activeDrawMode = action.payload;
      if (action.payload !== 'edit') {
        state.editingEntityId = null;
        state.editingVertexIndex = null;
      }
    },
    setRightSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.rightSidebarOpen = action.payload;
    },
    setEditingEntity: (state, action: PayloadAction<{ entityId: string | null; vertexIndex?: number | null }>) => {
      state.editingEntityId = action.payload.entityId;
      state.editingVertexIndex = action.payload.vertexIndex ?? null;
      if (action.payload.entityId) {
        state.activeDrawMode = 'edit';
      }
    },
    setDarkMode: (state, action: PayloadAction<boolean>) => {
      state.darkMode = action.payload;
    },
    setMeasurementMode: (state, action: PayloadAction<boolean>) => {
      state.measurementMode = action.payload;
    },
    setShowCoordinates: (state, action: PayloadAction<boolean>) => {
      state.showCoordinates = action.payload;
    },
    setWelcomeScreenClosed: (state) => {
      state.welcomeScreenClosed = true;
    },
    setExampleFormOpen: (state, action: PayloadAction<boolean>) => {
      state.exampleFormOpen = action.payload;
    }
  }
});

export const { setDrawMode, setRightSidebarOpen, setEditingEntity, setDarkMode, setMeasurementMode, setShowCoordinates, setWelcomeScreenClosed, setExampleFormOpen } = uiSlice.actions;
export default uiSlice.reducer;


