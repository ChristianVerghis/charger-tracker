import { ImageResponse } from 'next/og';
import { getStation } from '@/lib/server-snapshot';
import {
  CONNECTION_TYPE_NAMES,
  DC_CONNECTION_TYPES,
  hasDcfc,
  maxKw,
  NETWORK_NAMES,
} from '@/lib/snapshot-types';

// Per-station OG card — what shows up when someone shares /station/[id] on
// iMessage / Slack / Twitter / LinkedIn. Keep visually consistent with the
// generic OG card; only the body content differs.

export const alt = 'charger-tracker — station detail';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

type Params = { id: string };

function describeDcConnectors(conns: Array<{ type: number; kw: number; qty: number }>): string {
  const counts = new Map<number, number>();
  for (const c of conns) {
    if (!DC_CONNECTION_TYPES.has(c.type)) continue;
    counts.set(c.type, (counts.get(c.type) ?? 0) + (c.qty ?? 1));
  }
  if (counts.size === 0) return '';
  return Array.from(counts.entries())
    .map(([type, qty]) => `${qty}× ${CONNECTION_TYPE_NAMES[type] ?? `Type ${type}`}`)
    .join(' · ');
}

function tierColor(kw: number): string {
  if (kw >= 150) return '#10b981';
  if (kw >= 50) return '#f59e0b';
  return '#3b82f6';
}

export default async function OG({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  const station = getStation(Number(id));
  if (!station) {
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#0b0f14',
            color: '#e6edf3',
            fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
            fontSize: 56,
            fontWeight: 700,
          }}
        >
          Station not found · charger-tracker
        </div>
      ),
      size,
    );
  }

  const kw = maxKw(station);
  const network =
    station.op != null ? (NETWORK_NAMES[station.op] ?? `Operator ${station.op}`) : 'Unknown operator';
  const dc = hasDcfc(station);
  const dcSummary = describeDcConnectors(station.conns);
  const accent = tierColor(kw);

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
          <div style={{ display: 'flex', marginLeft: 'auto', fontSize: 24, color: '#64748b' }}>
            {network}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 24px',
                borderRadius: 9999,
                background: `${accent}1a`,
                border: `2px solid ${accent}`,
                fontSize: 36,
                fontWeight: 700,
                color: accent,
              }}
            >
              {kw} kW
            </div>
            {dc && (
              <div style={{ display: 'flex', fontSize: 28, color: '#94a3b8' }}>DC fast</div>
            )}
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 64,
              fontWeight: 700,
              lineHeight: 1.1,
              maxWidth: 1080,
            }}
          >
            {station.name}
          </div>
          <div style={{ display: 'flex', fontSize: 28, color: '#94a3b8' }}>
            {[station.addr, station.town].filter(Boolean).join(' · ')}
          </div>
          {dc && dcSummary && (
            <div style={{ display: 'flex', fontSize: 24, color: '#cbd5e1', maxWidth: 1080 }}>
              {dcSummary}
            </div>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            fontSize: 22,
            color: '#64748b',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex' }}>Open data · MapLibre · v1</div>
          <div style={{ display: 'flex' }}>Tap to see your EV's charge time</div>
        </div>
      </div>
    ),
    size,
  );
}
