// Compact attribution footer. OSM ToS requires a visible attribution; OCM
// data is CC-BY-SA so they need credit too. The GitHub link is a placeholder
// until the repo is published — flip it on then.

const GITHUB_URL: string | null = null;

export function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-slate-950 px-4 py-2 text-[11px] text-slate-500">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          Data:{' '}
          <a
            className="hover:text-slate-300"
            href="https://openchargemap.org/"
            target="_blank"
            rel="noreferrer"
          >
            Open Charge Map
          </a>{' '}
          (CC-BY-SA) · Tiles:{' '}
          <a
            className="hover:text-slate-300"
            href="https://www.openstreetmap.org/copyright"
            target="_blank"
            rel="noreferrer"
          >
            © OpenStreetMap contributors
          </a>
        </div>
        <div className="flex items-center gap-3">
          <span>v1 preview</span>
          {GITHUB_URL ? (
            <a
              className="hover:text-slate-300"
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer"
            >
              GitHub ↗
            </a>
          ) : null}
        </div>
      </div>
    </footer>
  );
}
