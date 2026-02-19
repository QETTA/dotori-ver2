import type { Metadata } from 'next'

/* Centralized metadata for pages that use 'use client' and can't export metadata directly.
   Import and spread in parent layout or use generateMetadata in server components. */

export const PAGE_METADATA: Record<string, Metadata> = {
  home: {
    title: '홈',
    description: '도토리 대시보드 — 관심 시설 현황, TO 알림, 확률 추이',
  },
  explore: {
    title: '시설 탐색',
    description: '내 주변 어린이집 검색 및 필터링',
  },
  map: {
    title: '지도',
    description: '주변 어린이집 지도 보기 — 거리별 시설 확인',
  },
  compare: {
    title: '시설 비교',
    description: '관심 어린이집 비교 분석 — 확률, 비용, 거리, 평점',
  },
  chat: {
    title: 'AI 상담',
    description: '도토리 AI 상담사와 어린이집 입소 상담',
  },
  simulation: {
    title: '시뮬레이션',
    description: '입소 확률 시뮬레이션 — 전략별 효과 분석',
  },
  alerts: {
    title: 'TO 알림',
    description: '실시간 TO 알림 타임라인',
  },
  notifications: {
    title: '알림',
    description: '알림 센터 — TO, 확률, 시스템, 상담 알림',
  },
  consult: {
    title: '상담',
    description: '전문 상담 서비스 — AI 상담 및 1:1 전문가 상담',
  },
  mypage: {
    title: '마이페이지',
    description: '내 정보 관리, 플랜, 알림 설정',
  },
  settings: {
    title: '설정',
    description: '앱 설정 — 알림, 테마, 계정 관리',
  },
  pricing: {
    title: '요금제',
    description: '도토리 요금제 비교 — 무료, 베이직, 프로',
  },
  adminDashboard: {
    title: '관리자 대시보드',
    description: '도토리 관리자 KPI 대시보드',
  },
  adminAudit: {
    title: '감사 로그',
    description: '시스템 이벤트 및 사용자 활동 기록',
  },
}
