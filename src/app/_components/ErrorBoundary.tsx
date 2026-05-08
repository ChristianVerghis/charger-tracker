'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';

// Catches runtime exceptions in the React tree below it and renders a
// friendly fallback. Without this, any thrown error in a client component
// would unmount the whole app and leave a blank page — bad first impression
// for the cold-outreach moment.

type Props = { children: ReactNode };
type State = { error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    // Log to the browser console; once Sentry is wired this is where the
    // capture call would go.
    console.error('ChargerExplorer crashed:', error, info);
  }

  reset = () => {
    this.setState({ error: null });
  };

  override render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center text-sm text-slate-300">
        <div
          aria-hidden
          className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500 text-2xl text-slate-950"
        >
          ⚠
        </div>
        <div>
          <p className="text-base font-semibold text-slate-100">Something broke on this screen.</p>
          <p className="mt-1 max-w-md text-slate-400">
            An unexpected error stopped the explorer. The rest of the site still works — try
            reloading, or come back to the home page.
          </p>
          {process.env.NODE_ENV !== 'production' && (
            <pre className="mt-3 max-w-xl overflow-auto rounded bg-slate-900 p-3 text-left text-xs text-amber-200">
              {this.state.error.message}
            </pre>
          )}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              this.reset();
              window.location.reload();
            }}
            className="rounded-md bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-emerald-400"
          >
            Reload
          </button>
          <a
            href="/"
            className="rounded-md border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-800"
          >
            Home
          </a>
        </div>
      </div>
    );
  }
}
