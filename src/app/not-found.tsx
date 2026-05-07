import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex h-screen flex-col items-center justify-center gap-6 bg-slate-950 px-6 text-center text-slate-200">
      <div
        aria-hidden
        className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500 text-3xl text-slate-950"
      >
        ⚡
      </div>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">No charger here</h1>
        <p className="mt-2 max-w-md text-sm text-slate-400">
          That URL doesn't match any page in charger-tracker. The most likely
          reason: a stale share-link, or the station ID isn't in the current
          dataset.
        </p>
      </div>
      <Link
        href="/"
        className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
      >
        Back to the map
      </Link>
    </main>
  );
}
