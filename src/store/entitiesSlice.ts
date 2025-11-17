import { createSlice, PayloadAction, nanoid } from '@reduxjs/toolkit';

export type EntityKind = 'point' | 'line' | 'polygon' | 'circle' | 'rectangle';

export interface BaseEntity {
  id: string;
  kind: EntityKind;
  name: string;
  visible: boolean;
  color: string;
}

export interface PointEntity extends BaseEntity {
  kind: 'point';
  coordinates: [number, number];
}

export interface LineEntity extends BaseEntity {
  kind: 'line';
  coordinates: [number, number][];
}

export interface PolygonEntity extends BaseEntity {
  kind: 'polygon';
  coordinates: [number, number][];
}

export interface CircleEntity extends BaseEntity {
  kind: 'circle';
  center: [number, number];
  radiusMeters: number;
}

export interface RectangleEntity extends BaseEntity {
  kind: 'rectangle';
  // [SW, SE, NE, NW, SW]
  coordinates: [number, number][];
}

export type AnyEntity =
  | PointEntity
  | LineEntity
  | PolygonEntity
  | CircleEntity
  | RectangleEntity;

interface EntitiesState {
  byId: Record<string, AnyEntity>;
  allIds: string[];
  selectedId: string | null;
}

const initialState: EntitiesState = {
  byId: {},
  allIds: [],
  selectedId: null
};

interface AddEntityPayload extends Partial<BaseEntity> {
  kind: EntityKind;
  data: Omit<AnyEntity, keyof BaseEntity | 'kind'>;
}

export const entitiesSlice = createSlice({
  name: 'entities',
  initialState,
  reducers: {
    addEntity: (state, action: PayloadAction<AddEntityPayload>) => {
      const existingId = state.allIds.find(id => {
        const existing = state.byId[id];
        if (!existing) return false;
        if (existing.kind !== action.payload.kind) return false;
        
        if (action.payload.kind === 'point') {
          const data = action.payload.data as PointEntity;
          const coordMatch = existing.kind === 'point' && 
                 Math.abs(existing.coordinates[0] - data.coordinates[0]) < 0.0001 &&
                 Math.abs(existing.coordinates[1] - data.coordinates[1]) < 0.0001;
          return coordMatch;
        }
        
        if (action.payload.kind === 'circle') {
          const data = action.payload.data as CircleEntity;
          const centerMatch = existing.kind === 'circle' &&
                 Math.abs(existing.center[0] - data.center[0]) < 0.0001 &&
                 Math.abs(existing.center[1] - data.center[1]) < 0.0001 &&
                 Math.abs(existing.radiusMeters - data.radiusMeters) < 1;
          return centerMatch;
        }
        
        if (action.payload.kind === 'rectangle') {
          const data = action.payload.data as RectangleEntity;
          if (existing.kind !== 'rectangle' || !data.coordinates || !existing.coordinates) return false;
          if (data.coordinates.length !== existing.coordinates.length) return false;
          const match = data.coordinates.every((coord, idx) => {
            const existingCoord = existing.coordinates[idx];
            return Math.abs(coord[0] - existingCoord[0]) < 0.0001 &&
                   Math.abs(coord[1] - existingCoord[1]) < 0.0001;
          });
          return match;
        }
        
        if (action.payload.kind === 'line') {
          const data = action.payload.data as LineEntity;
          if (existing.kind !== 'line' || !data.coordinates || !existing.coordinates) return false;
          if (data.coordinates.length !== existing.coordinates.length) return false;
          const match = data.coordinates.every((coord, idx) => {
            const existingCoord = existing.coordinates[idx];
            return Math.abs(coord[0] - existingCoord[0]) < 0.0001 &&
                   Math.abs(coord[1] - existingCoord[1]) < 0.0001;
          });
          return match;
        }
        
        if (action.payload.kind === 'polygon') {
          const data = action.payload.data as PolygonEntity;
          if (existing.kind !== 'polygon' || !data.coordinates || !existing.coordinates) return false;
          const dataCoords = data.coordinates.slice(0, -1);
          const existingCoords = existing.coordinates.slice(0, -1);
          if (dataCoords.length !== existingCoords.length) return false;
          const match = dataCoords.every((coord, idx) => {
            const existingCoord = existingCoords[idx];
            return Math.abs(coord[0] - existingCoord[0]) < 0.0001 &&
                   Math.abs(coord[1] - existingCoord[1]) < 0.0001;
          });
          return match;
        }
        
        return false;
      });
      
      if (existingId) {
        state.selectedId = existingId;
        return;
      }
      
      const id = nanoid();
      const base: BaseEntity = {
        id,
        kind: action.payload.kind,
        name: action.payload.name ?? `${action.payload.kind.toUpperCase()} ${state.allIds.length + 1}`,
        visible: action.payload.visible ?? true,
        color: action.payload.color ?? '#38bdf8'
      };

      const entity: AnyEntity = {
        ...(base as any),
        ...(action.payload.data as any)
      };

      state.byId[id] = entity;
      state.allIds.push(id);
      state.selectedId = id;
    },
    updateEntity: (state, action: PayloadAction<{ id: string; changes: Partial<AnyEntity> }>) => {
      const { id, changes } = action.payload;
      const existing = state.byId[id];
      if (!existing) return;
      state.byId[id] = { ...existing, ...changes } as AnyEntity;
    },
    removeEntity: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      if (!state.byId[id]) return;
      delete state.byId[id];
      state.allIds = state.allIds.filter(x => x !== id);
      if (state.selectedId === id) state.selectedId = null;
    },
    toggleVisibility: (state, action: PayloadAction<string>) => {
      const e = state.byId[action.payload];
      if (!e) return;
      e.visible = !e.visible;
    },
    setSelectedEntity: (state, action: PayloadAction<string | null>) => {
      state.selectedId = action.payload;
    }
  }
});

export const {
  addEntity,
  updateEntity,
  removeEntity,
  toggleVisibility,
  setSelectedEntity
} = entitiesSlice.actions;

export default entitiesSlice.reducer;


