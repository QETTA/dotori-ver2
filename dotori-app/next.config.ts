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
  "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.googleapis.com",
  "img-src 'self' data: blob: https://k.kakaocdn.net https://img1.kakaocdn.net https://*.daumcdn.net https://*.googleusercontent.com",
  "font-src 'self' https://cdn.jsdelivr.net https://fonts.gstatic.com",
  "connect-src 'self' https://*.kakao.com https://*.google-analytics.com https://api.anthropic.com https://cdn.jsdelivr.net",
  "frame-src 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join('; ')

const nextConfig: NextConfig = {
  output: 'standalone',
  compress: true,
  reactStrictMode: true,
  serverExternalPackages: ['mongoose'],
  experimental: {
    optimizePackageImports: ['@headlessui/react', 'motion', 'lucide-react'],
  },
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
            value: 'camera=(), microphone=(), geolocation=(self), payment=(), usb=()',
          },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ]
  },
  async rewrites() {
    return [
      {
        source: '/in-fox/:path*',
        destination: '/:path*',
      },
      {
        source: '/in-fox',
        destination: '/',
      },
    ];
  },
  poweredByHeader: false,
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
  webpack(config) {
    // SVGR loader for Webpack bundler
    const fileLoaderRule = config.module?.rules?.find(
      (rule: { test?: RegExp }) => rule.test?.test?.('.svg'),
    )
    if (fileLoaderRule) {
      fileLoaderRule.exclude = /\.svg$/i
    }
    config.module?.rules?.push({
      test: /\.svg$/i,
      issuer: /\.[jt]sx?$/,
      use: ['@svgr/webpack'],
    })
    return config
  },
}

export default nextConfig
