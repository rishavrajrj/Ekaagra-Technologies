import { ImageResponse } from 'next/og';

export const alt = 'Ekaagra Technologies | Websites people remember.';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#FAF7F2',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          padding: '80px',
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
      >
        {/* Decorative ambient accent */}
        <div
          style={{
            position: 'absolute',
            top: '-100px',
            right: '-100px',
            width: '400px',
            height: '400px',
            borderRadius: '200px',
            background: 'rgba(67, 56, 202, 0.1)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-100px',
            left: '-100px',
            width: '400px',
            height: '400px',
            borderRadius: '200px',
            background: 'rgba(249, 115, 96, 0.1)',
          }}
        />

        {/* Top Logo & Eyebrow */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: '#4338CA',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              fontSize: '28px',
              fontWeight: 900,
            }}
          >
            E
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '24px', fontWeight: 900, color: '#131B2E', letterSpacing: '-0.5px' }}>
              EKAAGRA
            </span>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#F97360', letterSpacing: '2px' }}>
              TECHNOLOGIES
            </span>
          </div>
        </div>

        {/* Center Main Message */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '900px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              fontWeight: 800,
              color: '#4338CA',
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
            }}
          >
            <div style={{ width: '8px', height: '8px', borderRadius: '4px', background: '#F97360' }} />
            <span>WEBSITE DESIGN &amp; DIGITAL PRODUCTS</span>
          </div>
          <div
            style={{
              fontSize: '64px',
              fontWeight: 900,
              color: '#131B2E',
              lineHeight: 1.1,
              letterSpacing: '-1.5px',
            }}
          >
            Websites people remember.
          </div>
          <div
            style={{
              fontSize: '24px',
              fontWeight: 500,
              color: '#64748B',
              lineHeight: 1.4,
            }}
          >
            Custom website design, edtech platforms, and digital experiences crafted around your business.
          </div>
        </div>

        {/* Bottom Proof Strip */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '32px',
            fontSize: '16px',
            fontWeight: 700,
            color: '#475569',
            borderTop: '2px solid #E2E8F0',
            paddingTop: '24px',
            width: '100%',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '4px', background: '#4338CA' }} />
            <span>Custom Design</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '4px', background: '#F97360' }} />
            <span>Mobile-First</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '4px', background: '#10B981' }} />
            <span>Live Case Studies</span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
