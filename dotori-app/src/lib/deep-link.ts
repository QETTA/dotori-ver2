/**
 * Deep link generator for Dotori.
 *
 * Generates app links for facilities, community posts, chat prompts, etc.
 * Used by Kakao share, push notifications, and UTM campaigns.
 */

import { buildUTMUrl, type UTMParams } from './utm'

const APP_ORIGIN =
  typeof window !== 'undefined'
    ? window.location.origin
    : process.env.NEXT_PUBLIC_APP_URL ?? 'https://dotori.app'

export type DeepLinkTarget =
  | { type: 'facility'; id: string }
  | { type: 'community'; postId: string }
  | { type: 'chat'; prompt?: string }
  | { type: 'explore'; query?: string }
  | { type: 'waitlist' }
  | { type: 'home' }

/**
 * Convert a deep link target to a relative path.
 */
export function toPath(target: DeepLinkTarget): string {
  switch (target.type) {
    case 'facility':
      return `/facility/${target.id}`
    case 'community':
      return `/community/${target.postId}`
    case 'chat':
      return target.prompt ? `/chat?prompt=${encodeURIComponent(target.prompt)}` : '/chat'
    case 'explore':
      return target.query ? `/explore?q=${encodeURIComponent(target.query)}` : '/explore'
    case 'waitlist':
      return '/my/waitlist'
    case 'home':
      return '/'
  }
}

/**
 * Generate a full deep link URL with optional UTM tracking.
 */
export function createDeepLink(target: DeepLinkTarget, utm?: Partial<UTMParams>): string {
  const path = toPath(target)
  const fullUrl = `${APP_ORIGIN}${path}`

  if (!utm) return fullUrl

  return buildUTMUrl(fullUrl, {
    source: utm.source ?? 'dotori',
    medium: utm.medium ?? 'deeplink',
    campaign: utm.campaign ?? target.type,
    content: utm.content,
    term: utm.term,
  })
}

/**
 * Generate a Kakao share deep link (with kakao UTM source).
 */
export function createKakaoShareLink(target: DeepLinkTarget, campaign?: string): string {
  return createDeepLink(target, {
    source: 'kakao',
    medium: 'share',
    campaign: campaign ?? `${target.type}_share`,
  })
}
