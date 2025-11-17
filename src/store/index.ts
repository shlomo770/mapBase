import { configureStore } from '@reduxjs/toolkit';
import entitiesReducer from './entitiesSlice';
import uiReducer from './uiSlice';

export const store = configureStore({
  reducer: {
    entities: entitiesReducer,
    ui: uiReducer
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;



