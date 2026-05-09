import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

// Larger apple-touch-icon for iOS Springboard (Home Screen). Same look as
// the 32×32 favicon but with rounder corners (iOS will round these anyway,
// but we mass them slightly so non-iOS shortcuts also look correct).

export default function AppleIcon() {
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
          fontSize: 130,
          fontWeight: 900,
          borderRadius: 36,
        }}
      >
        ⚡
      </div>
    ),
    size,
  );
}
