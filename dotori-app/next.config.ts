import type { NextConfig } from 'next'

const isDev = process.env.NODE_ENV === 'development'

const cspDirectives = [
  "default-src 'self'",
  // 'unsafe-eval' only in dev (Next.js HMR requires it); 'unsafe-inline' only in dev for HMR scripts.
  // In production, only 'self' + trusted domains.
  isDev
    ? "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://t1.kakaocdn.net https://dapi.kakao.com https://www.googletagmanager.com https://www.google-analytics.com"
    : "script-src 'self' 'unsafe-inline' https://t1.kakaocdn.net https://dapi.kakao.com https://www.googletagmanager.com https://www.google-analytics.com",
  // 'unsafe-inline' required for Tailwind CSS v4 runtime styles
  "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
  "img-src 'self' data: blob: https://k.kakaocdn.net https://img1.kakaocdn.net https://*.daumcdn.net",
  "font-src 'self' https://cdn.jsdelivr.net",
  "connect-src 'self' https://*.kakao.com https://*.google-analytics.com https://api.anthropic.com",
  "frame-src 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join('; ')

const nextConfig: NextConfig = {
  output: 'standalone',
  compress: true,
  reactStrictMode: true,
  serverExternalPackages: ['mongoose'],
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: 'k.kakaocdn.net' },
      { protocol: 'https', hostname: 'img1.kakaocdn.net' },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Content-Security-Policy', value: cspDirectives },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self), payment=(), usb=(), bluetooth=()',
          },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
        ],
      },
    ]
  },
  poweredByHeader: false,
}

export default nextConfig
