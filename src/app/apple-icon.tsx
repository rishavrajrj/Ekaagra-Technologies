import { ImageResponse } from 'next/og';

export const size = {
  width: 180,
  height: 180,
};
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 108,
          background: 'linear-gradient(135deg, #4338CA, #6366F1)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 900,
          borderRadius: '40px',
          fontFamily: 'sans-serif',
        }}
      >
        E
      </div>
    ),
    {
      ...size,
    }
  );
}
