'use client';

// Next.js's per-route error boundary. Complements the React-tree
// ErrorBoundary in `_components/ErrorBoundary.tsx`: this catches errors
// that propagate up to the route segment (server component throws,
// metadata generation failures, navigation errors). The `reset()` callback
// re-renders the same segment without a hard reload.
//
// Errors hitting this route are real platform-level issues — log them
// when Sentry is wired (planned v1.1).

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Route-level error:', error);
  }, [error]);

  return (
    <main className="flex h-screen flex-col items-center justify-center gap-6 bg-slate-950 px-6 text-center text-slate-200">
      <div
        aria-hidden
        className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500 text-3xl text-slate-950"
      >
        ⚠
      </div>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Something broke.</h1>
        <p className="mt-2 max-w-md text-sm text-slate-400">
          A page-level error stopped this view from rendering. Try again — if it persists, the
          issue is on our side.
        </p>
        {error.digest && (
          <p className="mt-2 font-mono text-[11px] text-slate-600">ref: {error.digest}</p>
        )}
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={reset}
          className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
        >
          Try again
        </button>
        <a
          href="/"
          className="rounded-md border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800"
        >
          Home
        </a>
      </div>
    </main>
  );
}
