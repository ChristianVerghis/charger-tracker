import { ChargerExplorer } from './_components/ChargerExplorer';

export default function HomePage() {
  return (
    <main className="flex h-screen w-screen flex-col">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 px-4 py-3">
        <div>
          <h1 className="text-base font-semibold tracking-tight">
            charger-tracker <span className="text-slate-500">·</span>{' '}
            <span className="text-slate-400">Hamilton / GTA</span>
          </h1>
          <p className="text-xs text-slate-500">
            Open-data EV chargers. Pick your car for charge-time estimates. v1 preview.
          </p>
        </div>
        <span className="text-xs text-slate-500">v1 preview · open-data only</span>
      </header>
      <ChargerExplorer />
    </main>
  );
}
