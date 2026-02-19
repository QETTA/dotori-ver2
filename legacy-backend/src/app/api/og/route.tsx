import { ImageResponse } from 'next/og'
import type { NextRequest } from 'next/server'

export const runtime = 'edge'

/**
 * GET /api/og?title=xxx&subtitle=xxx&grade=A&probability=88
 * Dynamic OpenGraph image for social sharing
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const title = searchParams.get('title') ?? '도토리'
  const subtitle = searchParams.get('subtitle') ?? 'AI가 찾아주는 우리 아이 어린이집'
  const grade = searchParams.get('grade')
  const probability = searchParams.get('probability')

  const palette = {
    white: 'rgb(255, 255, 255)',
    gray100: 'rgb(249, 250, 251)',
    gray200: 'rgb(229, 231, 235)',
    gray300: 'rgb(209, 213, 219)',
    gray500: 'rgb(107, 114, 128)',
    gray600: 'rgb(75, 85, 99)',
    slate900: 'rgb(17, 24, 39)',
    brand: 'rgb(13, 148, 136)',
    brandDark: 'rgb(6, 182, 212)',
    surface: 'rgb(13, 148, 136)',
    danger: 'rgb(239, 68, 68)',
  }

  const gradeColors: Record<string, string> = {
    A: 'var(--palette-emerald-500)',
    B: 'var(--palette-cyan-500)',
    C: 'var(--palette-amber-400)',
    D: 'var(--palette-orange-500)',
    E: 'var(--palette-red-500)',
    F: 'var(--palette-red-900)',
  }

  return new ImageResponse(
    <div
      style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, rgb(240, 253, 250) 0%, rgb(224, 242, 254) 50%, rgb(240, 249, 255) 100%)',
        fontFamily: 'sans-serif',
      }}
    >
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: `linear-gradient(135deg, ${palette.brand}, ${palette.brandDark})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: palette.white,
            fontSize: 24,
            fontWeight: 800,
          }}
        >
          🌰
        </div>
        <span style={{ fontSize: 28, fontWeight: 800, color: palette.brand }}>도토리</span>
      </div>

      {/* Grade badge (if present) */}
      {grade && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            marginBottom: 20,
            background: palette.white,
            borderRadius: 20,
            padding: '16px 32px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: gradeColors[grade] ?? 'rgb(156, 163, 175)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: palette.white,
              fontSize: 28,
              fontWeight: 800,
            }}
          >
            {grade}
          </div>
          {probability && (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 36, fontWeight: 800, color: palette.slate900 }}>{probability}%</span>
              <span style={{ fontSize: 14, color: palette.gray500 }}>입소 확률</span>
            </div>
          )}
        </div>
      )}

      {/* Title */}
      <div
        style={{
          fontSize: 36,
          fontWeight: 800,
          color: palette.slate900,
          textAlign: 'center',
          maxWidth: 800,
          lineHeight: 1.3,
        }}
      >
        {title}
      </div>

      {/* Subtitle */}
      <div
        style={{
          fontSize: 18,
          color: palette.gray500,
          marginTop: 8,
          textAlign: 'center',
          maxWidth: 600,
        }}
      >
        {subtitle}
      </div>

      {/* Footer */}
      <div
        style={{
          position: 'absolute',
          bottom: 32,
          fontSize: 14,
          color: palette.gray300,
        }}
      >
        dotori.ai — 실시간 TO 알림 · 입소 확률 분석 · 맞춤 전략 상담
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
    },
  )
}
