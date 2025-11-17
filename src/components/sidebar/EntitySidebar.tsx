import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../../store';
import { removeEntity, toggleVisibility, setSelectedEntity } from '../../store/entitiesSlice';

export const EntitySidebar: React.FC = () => {
  const dispatch = useDispatch();
  const entitiesState = useSelector((s: RootState) => s.entities);

  return (
    <div className="w-64 bg-slate-900 border-l border-slate-700 text-slate-100 flex flex-col">
      <div className="px-3 py-2 border-b border-slate-700 text-xs font-semibold">
        Entities ({entitiesState.allIds.length})
      </div>
      <div className="flex-1 overflow-auto text-xs">
        {entitiesState.allIds.map(id => {
          const e = entitiesState.byId[id];
          if (!e) return null;
          const selected = entitiesState.selectedId === id;
          return (
            <div
              key={id}
              className={`px-3 py-2 flex items-center justify-between border-b border-slate-800 cursor-pointer ${
                selected ? 'bg-slate-800' : 'hover:bg-slate-800/60'
              }`}
              onClick={() => dispatch(setSelectedEntity(id))}
            >
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-1">
                  <span
                    className="inline-block w-2 h-2 rounded-full"
                    style={{ backgroundColor: e.color }}
                  />
                  <span className="font-semibold">{e.name}</span>
                </div>
                <div className="text-[10px] text-slate-400">
                  {e.kind.toUpperCase()}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={ev => {
                    ev.stopPropagation();
                    dispatch(toggleVisibility(id));
                  }}
                  className="px-1 py-0.5 text-[10px] border border-slate-600 rounded"
                >
                  {e.visible ? 'Hide' : 'Show'}
                </button>
                <button
                  onClick={ev => {
                    ev.stopPropagation();
                    dispatch(removeEntity(id));
                  }}
                  className="px-1 py-0.5 text-[10px] border border-red-500 text-red-300 rounded"
                >
                  Del
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};


