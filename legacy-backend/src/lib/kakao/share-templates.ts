import './env'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://dotori.ai'
const MAX_TITLE_LENGTH = 60
const MAX_DESCRIPTION_LENGTH = 120
const MAX_REF_LENGTH = 64
const MAX_PATH_LENGTH = 120
const MAX_BUTTON_LABEL_LENGTH = 24

type ShareKind = 'result' | 'invite' | 'community'

interface ShareTemplateParams {
  kind: ShareKind
  ref: string
  title: string
  description: string
  path: string
  imageUrl?: string
  buttonLabel?: string
}

interface ShareTemplateResult {
  objectType: 'feed'
  content: {
    title: string
    description: string
    imageUrl: string
    link: {
      mobileWebUrl: string
      webUrl: string
    }
  }
  buttons: Array<{
    title: string
    link: {
      mobileWebUrl: string
      webUrl: string
    }
  }>
  serverCallbackArgs: {
    ref: string
    entry: 'kakao_share'
    kind: ShareKind
  }
}

function trimOrEmpty(value: string, fallback = ''): string {
  const text = value.trim()
  return text || fallback
}

function clampText(value: string | undefined, maxLength: number, fallback: string): string {
  if (!value) return fallback
  const normalized = trimOrEmpty(value)
  if (!normalized) return fallback
  return normalized.length <= maxLength ? normalized : normalized.slice(0, maxLength)
}

function normalizeKind(kind: string): ShareKind {
  const allowed: ReadonlyArray<ShareKind> = ['result', 'invite', 'community']
  return allowed.includes(kind as ShareKind) ? (kind as ShareKind) : 'result'
}

function normalizePath(path: string): string {
  const normalized = trimOrEmpty(path, '/home')
  const sliced = normalized.length > MAX_PATH_LENGTH ? normalized.slice(0, MAX_PATH_LENGTH) : normalized
  return sliced.startsWith('/') ? sliced : `/${sliced}`
}

function normalizeRef(ref: string): string {
  return clampText(ref, MAX_REF_LENGTH, 'share')
}

function buildShareUrl(path: string, ref: string, kind: ShareKind): string {
  const qs = new URLSearchParams({
    entry: 'kakao_share',
    ref: normalizeRef(ref),
    kind,
  })
  return `${BASE_URL}${path}?${qs.toString()}`
}

/**
 * 카카오톡 공유 템플릿을 생성합니다.
 * title/description 길이를 제한하고 파라미터를 정규화해 안전하게 구성합니다.
 */
export function buildShareTemplate(params: ShareTemplateParams): ShareTemplateResult {
  const kind = normalizeKind(params.kind)
  const safeTitle = clampText(params.title, MAX_TITLE_LENGTH, '도토리')
  const safeDescription = clampText(
    params.description,
    MAX_DESCRIPTION_LENGTH,
    '입소 AI 분석과 TO 알림을 확인해보세요.',
  )
  const safePath = normalizePath(params.path)
  const safeImageUrl = params.imageUrl?.trim() ? params.imageUrl : `${BASE_URL}/og-default.png`
  const safeButtonLabel = params.buttonLabel
    ? clampText(params.buttonLabel, MAX_BUTTON_LABEL_LENGTH, '자세히 보기')
    : '자세히 보기'
  const url = buildShareUrl(safePath, params.ref, kind)

  return {
    objectType: 'feed',
    content: {
      title: safeTitle,
      description: safeDescription,
      imageUrl: safeImageUrl,
      link: { mobileWebUrl: url, webUrl: url },
    },
    buttons: [{ title: safeButtonLabel, link: { mobileWebUrl: url, webUrl: url } }],
    serverCallbackArgs: {
      ref: normalizeRef(params.ref),
      entry: 'kakao_share',
      kind,
    },
  }
}

export function resultShareTemplate(
  facilityId: string,
  facilityName: string,
  score: number,
  summary: string,
  ref: string,
) {
  return buildShareTemplate({
    kind: 'result',
    ref,
    title: `${facilityName} 입소 확률 ${score}%`,
    description: summary,
    path: `/facility/${facilityId}`,
    buttonLabel: '확률 확인하기',
  })
}

export function inviteShareTemplate(district: string, dong: string, ref: string) {
  return buildShareTemplate({
    kind: 'invite',
    ref,
    title: `${dong} 어린이집 TO 알림, 같이 받아요`,
    description: `${district} ${dong} 지역 맞춤 분석`,
    path: '/home',
    buttonLabel: '같이 알림 받기',
  })
}

export function communityShareTemplate(postId: string, postTitle: string, ref: string) {
  return buildShareTemplate({
    kind: 'community',
    ref,
    title: postTitle,
    description: '우리 동네 어린이집 이야기',
    path: `/community/posts/${postId}`,
    buttonLabel: '글 보기',
  })
}
