'use client'

import { useEffect, useState } from 'react'
import '@/styles/splash.css'

export function SplashScreen() {
  const [visible, setVisible] = useState(false)
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    try {
      if (sessionStorage.getItem('dotori_splashed')) return
      sessionStorage.setItem('dotori_splashed', '1')
    } catch {
      return // private browsing without storage → skip splash
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisible(true)

    const exitTimer = setTimeout(() => setExiting(true), 1900)
    const doneTimer = setTimeout(() => setVisible(false), 2350)

    return () => {
      clearTimeout(exitTimer)
      clearTimeout(doneTimer)
    }
  }, [])

  if (!visible) return null

  return (
    <div
      className={`dotori-splash fixed inset-0 z-[9999]${exiting ? ' dotori-splash--exit' : ''}`}
      aria-hidden="true"
    >
      {/* Symbol — bounce-in via splash.css */}
      <div className="dotori-splash__symbol" style={{ width: 100, height: 110 }}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="100"
          height="110"
          viewBox="-40 -60 80 100"
          aria-hidden="true"
        >
          <defs>
            <radialGradient id="ss-body" cx="0.40" cy="0.32" r="0.60">
              <stop offset="0%" stopColor="#dab080" />
              <stop offset="55%" stopColor="#c8956a" />
              <stop offset="100%" stopColor="#a87848" />
            </radialGradient>
            <linearGradient id="ss-cap" x1="0.1" y1="0.1" x2="0.9" y2="0.9">
              <stop offset="0%" stopColor="#aa8462" />
              <stop offset="100%" stopColor="#7a5438" />
            </linearGradient>
          </defs>

          {/* Body */}
          <ellipse cx="0" cy="6" rx="33" ry="31" fill="url(#ss-body)" />
          <ellipse cx="-10" cy="-4" rx="10" ry="14" fill="white" opacity="0.06" transform="rotate(-10 -10 -4)" />

          {/* Cap */}
          <path
            d="M-31,-15 Q-31,-39 0,-41 Q31,-39 31,-15 Q18,-7 0,-7 Q-18,-7 -31,-15Z"
            fill="url(#ss-cap)"
          />
          <path d="M-23,-22 Q-10,-18 0,-18 Q10,-18 23,-22" stroke="#8a6440" strokeWidth="0.55" fill="none" opacity="0.25" />
          <path d="M-26,-27 Q-12,-22 0,-22 Q12,-22 26,-27" stroke="#8a6440" strokeWidth="0.4" fill="none" opacity="0.15" />

          {/* Stem */}
          <path d="M-3,-41 Q-4.5,-50 -2.5,-53.5 Q0,-55 2.5,-53.5 Q4.5,-50 3,-41" fill="#7a5438" />

          {/* Eyes — sequential fade-in */}
          <g className="dotori-splash__eyes">
            <circle cx="-9" cy="6" r="2.7" fill="#4a3018" />
            <circle cx="9" cy="6" r="2.7" fill="#4a3018" />
            <circle cx="-10" cy="4.5" r="0.9" fill="white" opacity="0.45" />
            <circle cx="8" cy="4.5" r="0.9" fill="white" opacity="0.45" />
          </g>

          {/* Smile */}
          <g className="dotori-splash__smile">
            <path d="M-7,14 Q0,20.5 7,14" stroke="#4a3018" strokeWidth="1.8" strokeLinecap="round" fill="none" />
          </g>

          {/* Blush */}
          <g className="dotori-splash__blush">
            <ellipse cx="-16" cy="10.5" rx="5.5" ry="2.8" fill="#d4907a" opacity="0.22" />
            <ellipse cx="16" cy="10.5" rx="5.5" ry="2.8" fill="#d4907a" opacity="0.22" />
          </g>
        </svg>
      </div>

      {/* Wordmark — slide up */}
      <div className="dotori-splash__wordmark mt-5 text-center">
        <p
          className="font-sans font-bold tracking-tight text-dotori-800"
          style={{ fontSize: 28 }}
        >
          도토리
        </p>
        {/* Tagline — delayed fade-in after wordmark */}
        <p
          className="font-sans mt-1 text-sm font-medium text-dotori-600"
          style={{
            opacity: 0,
            animation: 'dotori-fade-in 400ms ease-out 1300ms forwards',
          }}
        >
          어린이집 이동 고민? AI가 해결해드려요
        </p>
      </div>
    </div>
  )
}
