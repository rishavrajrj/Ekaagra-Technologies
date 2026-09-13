import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/solutions',
        destination: '/services#industries',
        permanent: true,
      },
      {
        source: '/blog/how-to-choose-best-website-developer-in-motihari',
        destination: '/blog/best-website-developer-motihari',
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/SCH-:suffix',
        destination: '/school-onboarding/SCH-:suffix',
      },
      {
        source: '/REQ-:suffix',
        destination: '/school-onboarding/REQ-:suffix',
      },
      {
        source: '/ONB-:suffix',
        destination: '/school-onboarding/ONB-:suffix',
      },
      {
        source: '/school-project/:token',
        destination: '/school-onboarding/:token',
      },
    ];
  },
};

export default nextConfig;
