/**
 * UTM (Urchin Tracking Module) builder & parser.
 *
 * Generates campaign-tagged URLs for Kakao, community shares, and CTA links.
 * Parses inbound UTM params for analytics attribution.
 */

export interface UTMParams {
  source: string     // e.g., 'kakao', 'community', 'direct'
  medium: string     // e.g., 'share', 'channel', 'cta'
  campaign: string   // e.g., 'facility_share', 'enrollment_season'
  content?: string   // e.g., 'facility_12345', 'chat_recommend'
  term?: string      // search term (optional)
}

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const

/**
 * Build a URL with UTM parameters appended.
 */
export function buildUTMUrl(baseUrl: string, params: UTMParams): string {
  const url = new URL(baseUrl, typeof window !== 'undefined' ? window.location.origin : 'https://dotori.app')
  url.searchParams.set('utm_source', params.source)
  url.searchParams.set('utm_medium', params.medium)
  url.searchParams.set('utm_campaign', params.campaign)
  if (params.content) url.searchParams.set('utm_content', params.content)
  if (params.term) url.searchParams.set('utm_term', params.term)
  return url.toString()
}

/**
 * Parse UTM parameters from a URL string or URLSearchParams.
 * Returns null if no UTM params are present.
 */
export function parseUTM(input: string | URLSearchParams): UTMParams | null {
  const params = typeof input === 'string' ? new URL(input).searchParams : input
  const source = params.get('utm_source')
  const medium = params.get('utm_medium')
  const campaign = params.get('utm_campaign')

  if (!source || !medium || !campaign) return null

  return {
    source,
    medium,
    campaign,
    content: params.get('utm_content') ?? undefined,
    term: params.get('utm_term') ?? undefined,
  }
}

/**
 * Strip UTM parameters from a URL (for clean display).
 */
export function stripUTM(url: string): string {
  const parsed = new URL(url)
  for (const key of UTM_KEYS) {
    parsed.searchParams.delete(key)
  }
  return parsed.toString()
}
