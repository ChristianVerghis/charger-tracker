import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

// 32×32 favicon: emerald square with a white lightning bolt. Matches the
// emerald accent in globals.css and the OG card.

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#10b981',
          color: '#ffffff',
          fontSize: 24,
          fontWeight: 900,
          borderRadius: 6,
        }}
      >
        ⚡
      </div>
    ),
    size,
  );
}
