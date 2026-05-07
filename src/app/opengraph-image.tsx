import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'charger-tracker — Hamilton/GTA EV chargers';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Statically rendered OG card. JSX-as-image via next/og's ImageResponse —
// no PNG asset to maintain. Keeps the visual language consistent with
// globals.css (slate-950 background, emerald accent).

export default function OG() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '64px',
          background: '#0b0f14',
          color: '#e6edf3',
          fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 9999,
              background: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 36,
            }}
          >
            ⚡
          </div>
          <div style={{ display: 'flex', fontSize: 32, color: '#94a3b8' }}>charger-tracker</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', fontSize: 78, fontWeight: 700, lineHeight: 1.05 }}>
            Public EV chargers
            <br />
            across Hamilton & the GTA
          </div>
          <div style={{ display: 'flex', fontSize: 30, color: '#94a3b8', maxWidth: 1000 }}>
            Pick your EV. See which chargers actually work for it, and how long
            they'll take from any state of charge.
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            gap: '24px',
            fontSize: 22,
            color: '#cbd5e1',
            alignItems: 'center',
          }}
        >
          <Pill color="#10b981">≥ 150 kW</Pill>
          <Pill color="#f59e0b">50–149 kW</Pill>
          <Pill color="#3b82f6">L2</Pill>
          <div style={{ display: 'flex', marginLeft: 'auto', color: '#64748b' }}>
            Open Charge Map · MapLibre · v1
          </div>
        </div>
      </div>
    ),
    size,
  );
}

function Pill({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '8px 16px',
        borderRadius: 9999,
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <div style={{ width: 12, height: 12, borderRadius: 9999, background: color }} />
      <div style={{ display: 'flex' }}>{children}</div>
    </div>
  );
}
