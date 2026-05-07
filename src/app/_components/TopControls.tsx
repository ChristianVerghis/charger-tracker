'use client';

import { EV_MODELS } from '@/lib/ev-models-data';
import { FILTER_LABELS, type FilterKey } from '@/lib/filters';

const FILTER_ORDER: ReadonlyArray<FilterKey> = ['all', 'dcfc', 'fast', 'hamilton', 'compat'];

export type ViewMode = 'map' | 'list';

export function TopControls({
  evId,
  onEvChange,
  filter,
  onFilterChange,
  view,
  onViewChange,
}: {
  evId: string;
  onEvChange: (id: string) => void;
  filter: FilterKey;
  onFilterChange: (next: FilterKey) => void;
  view: ViewMode;
  onViewChange: (next: ViewMode) => void;
}) {
  const evPicked = evId !== '';
  return (
    <div className="flex flex-col gap-2 border-b border-slate-800 bg-slate-950/80 px-4 py-2 backdrop-blur sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
      <label className="flex items-center gap-2">
        <span className="shrink-0 text-xs text-slate-400">Your EV</span>
        <select
          value={evId}
          onChange={(e) => onEvChange(e.target.value)}
          className="w-full min-w-0 rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-slate-100 sm:w-auto"
        >
          <option value="">— pick a vehicle —</option>
          {EV_MODELS.map((m) => (
            <option key={m.id} value={m.id}>
              {m.year} {m.make} {m.model}
              {m.trim ? ` · ${m.trim}` : ''}
            </option>
          ))}
        </select>
      </label>

      <div className="flex items-center gap-2">
        <div className="flex flex-wrap gap-1.5">
          {FILTER_ORDER.map((key) => {
            const active = key === filter;
            const compatNeedsEv = key === 'compat' && !evPicked;
            return (
              <button
                key={key}
                type="button"
                onClick={() => onFilterChange(key)}
                disabled={compatNeedsEv}
                title={compatNeedsEv ? 'Pick a vehicle first' : undefined}
                className={
                  'rounded-full px-3 py-1 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ' +
                  (active
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-slate-800 text-slate-200 hover:bg-slate-700')
                }
              >
                {FILTER_LABELS[key]}
              </button>
            );
          })}
        </div>
        <div className="ml-auto flex shrink-0 overflow-hidden rounded-md border border-slate-700">
          <ViewButton current={view} value="map" onClick={onViewChange}>
            Map
          </ViewButton>
          <ViewButton current={view} value="list" onClick={onViewChange}>
            List
          </ViewButton>
        </div>
      </div>
    </div>
  );
}

function ViewButton({
  current,
  value,
  onClick,
  children,
}: {
  current: ViewMode;
  value: ViewMode;
  onClick: (v: ViewMode) => void;
  children: React.ReactNode;
}) {
  const active = current === value;
  return (
    <button
      type="button"
      onClick={() => onClick(value)}
      className={
        'px-3 py-1 text-xs font-medium ' +
        (active ? 'bg-slate-700 text-slate-100' : 'bg-slate-900 text-slate-400 hover:text-slate-200')
      }
    >
      {children}
    </button>
  );
}
