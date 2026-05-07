'use client';

export type FilterKey = 'all' | 'dcfc' | 'fast' | 'hamilton';

const OPTIONS: ReadonlyArray<{ key: FilterKey; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'dcfc', label: 'DCFC only' },
  { key: 'fast', label: '≥150 kW' },
  { key: 'hamilton', label: 'Hamilton' },
];

export function Filters({
  value,
  onChange,
}: {
  value: FilterKey;
  onChange: (next: FilterKey) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {OPTIONS.map(({ key, label }) => {
        const active = key === value;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            className={
              'rounded-full px-3 py-1 text-xs font-medium transition ' +
              (active
                ? 'bg-emerald-500 text-slate-950'
                : 'bg-slate-800 text-slate-200 hover:bg-slate-700')
            }
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
