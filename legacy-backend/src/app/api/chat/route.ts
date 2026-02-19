import { apiHandler } from '@/lib/api-guard'
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { chatMessageSchema } from '@/lib/validations'

type AiProvider = 'mock' | 'openai' | 'spark' | 'anthropic'

interface AiProviderConfig {
  provider: AiProvider
  apiKey: string
  endpoint: string
  model: string
  temperature: number
  topP: number
  maxTokens: number
  reasoning: boolean
  extraBody: Record<string, unknown>
  systemPrompt: string
  requestTimeoutMs: number
}

interface ChatHistoryItem {
  role: string
  content: string
}

interface ChatCompletionChunk {
  choices?: Array<{
    delta?: {
      content?: string
    }
  }>
}

interface RichCard {
  cardType: 'facility' | 'strategy' | 'compare' | 'gauge'
  data: any
}

interface MockAction {
  action: 'start_research' | 'show_map'
  data: Record<string, unknown>
}

const DEFAULT_OPENAI_MODEL = 'gpt-4o-mini'
const DEFAULT_SPARK_MODEL = 'spark-5.3'
const DEFAULT_ANTHROPIC_MODEL = 'claude-opus-4-6'

export const POST = apiHandler({
  auth: false,
  input: chatMessageSchema,
  handler: async ({ input, request }) => {
    const clientIp =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? request.headers.get('x-real-ip') ?? 'anonymous'
    const rateCheck = await checkRateLimit(clientIp, RATE_LIMITS.chat)
    if (!rateCheck.allowed) {
      const retryAfter = Math.max(1, Math.ceil((rateCheck.resetAt - Date.now()) / 1000))
      return Response.json(
        { success: false, error: { code: 'RATE_LIMIT', message: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' } },
        { status: 429, headers: { 'Retry-After': String(retryAfter) } },
      ) as any
    }

    const encoder = new TextEncoder()
    const config = resolveAiConfig()
    const history = normalizeHistory(input.history)

    const stream = new ReadableStream({
      async start(controller) {
        const sendMockFallback = async () => {
          const { chunks, cards, actions } = generateAIResponse(input.message)

          for (const chunk of chunks) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'delta', content: chunk })}\n\n`))
            await new Promise((r) => setTimeout(r, 45))
          }

          for (const card of cards) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'card', cardType: card.cardType, data: card.data })}\n\n`),
            )
            await new Promise((r) => setTimeout(r, 90))
          }

          for (const action of actions) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: 'action', action: action.action, data: action.data })}\n\n`,
              ),
            )
            await new Promise((r) => setTimeout(r, 70))
          }

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done', content: chunks.join('') })}\n\n`))
        }

        const sendErrorFallback = async (error: unknown) => {
          console.error('[Chat API] AI stream error', error)
          await sendMockFallback()
        }

        if (config.provider === 'mock') {
          await sendMockFallback()
          controller.close()
          return
        }

        try {
          const fullText = await streamChatCompletion({
            input: input.message,
            facilityId: input.facilityId,
            config,
            history,
            onDelta: (chunk) => {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'delta', content: chunk })}\n\n`))
            },
            onEvent: (event) => {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
            },
          })

          if (!fullText || !fullText.trim()) {
            await sendMockFallback()
          } else {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done', content: fullText })}\n\n`))
          }
        } catch (error) {
          await sendErrorFallback(error)
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' },
    }) as any
  },
})

function resolveAiConfig(): AiProviderConfig {
  const provider = (process.env.AI_PROVIDER ?? '').trim().toLowerCase()
  const openaiApiKey = process.env.OPENAI_API_KEY?.trim() ?? ''
  const sparkApiKey = process.env.SPARK_API_KEY?.trim() ?? ''
  const openaiEndpoint = buildChatCompletionUrl(
    process.env.OPENAI_API_URL ?? process.env.OPENAI_BASE_URL ?? process.env.OPENAI_HOST ?? 'https://api.openai.com/v1',
  )
  const sparkEndpoint = buildChatCompletionUrl(
    process.env.SPARK_API_URL ??
      process.env.SPARK_API_HOST ??
      process.env.SPARK_BASE_URL ??
      process.env.AI_BASE_URL ??
      'https://api.openai.com/v1',
  )
  const commonFallback = {
    temperature: parseNumber(process.env.SPARK_TEMPERATURE, 0.35),
    topP: parseNumber(process.env.SPARK_TOP_P, 0.9),
    maxTokens: parseNumber(process.env.SPARK_MAX_TOKENS, 1024, 256, 4096),
    reasoning: false,
    extraBody: parseExtraBody(process.env.SPARK_EXTRA_BODY),
    systemPrompt: resolveSystemPrompt(),
    requestTimeoutMs: parseNumber(process.env.SPARK_REQUEST_TIMEOUT_MS, 30000, 5000, 120000),
  }

  if (provider === 'mock') {
    return {
      provider: 'mock',
      apiKey: '',
      endpoint: '',
      model: DEFAULT_OPENAI_MODEL,
      ...commonFallback,
    }
  }

  if (provider === 'anthropic') {
    const anthropicKey = process.env.ANTHROPIC_API_KEY?.trim() ?? ''
    if (!anthropicKey) {
      return { provider: 'mock', apiKey: '', endpoint: '', model: DEFAULT_ANTHROPIC_MODEL, ...commonFallback }
    }
    return {
      provider: 'anthropic',
      apiKey: anthropicKey,
      endpoint: 'https://api.anthropic.com/v1/messages',
      model: process.env.ANTHROPIC_MODEL?.trim() || DEFAULT_ANTHROPIC_MODEL,
      temperature: parseNumber(process.env.ANTHROPIC_TEMPERATURE, 0.4),
      topP: parseNumber(process.env.ANTHROPIC_TOP_P, 0.95),
      maxTokens: parseNumber(process.env.ANTHROPIC_MAX_TOKENS, 2048, 256, 8192),
      reasoning: false,
      extraBody: {},
      systemPrompt: resolveSystemPrompt(),
      requestTimeoutMs: parseNumber(process.env.ANTHROPIC_REQUEST_TIMEOUT_MS, 60000, 5000, 180000),
    }
  }

  if (provider === 'openai') {
    if (!openaiApiKey) {
      return {
        provider: 'mock',
        apiKey: '',
        endpoint: '',
        model: DEFAULT_OPENAI_MODEL,
        ...commonFallback,
      }
    }

    return {
      provider: 'openai',
      apiKey: openaiApiKey,
      endpoint: openaiEndpoint,
      model: process.env.OPENAI_MODEL?.trim() || process.env.AI_MODEL?.trim() || DEFAULT_OPENAI_MODEL,
      temperature: parseNumber(process.env.OPENAI_TEMPERATURE, 0.55),
      topP: parseNumber(process.env.OPENAI_TOP_P, 0.95),
      maxTokens: parseNumber(process.env.OPENAI_MAX_TOKENS, 1200, 256, 4096),
      reasoning: false,
      extraBody: parseExtraBody(process.env.OPENAI_EXTRA_BODY),
      systemPrompt: resolveSystemPrompt(),
      requestTimeoutMs: parseNumber(process.env.OPENAI_REQUEST_TIMEOUT_MS, 30000, 5000, 120000),
    }
  }

  if (provider === 'spark') {
    if (!sparkApiKey) {
      return {
        provider: 'mock',
        apiKey: '',
        endpoint: '',
        model: DEFAULT_SPARK_MODEL,
        ...commonFallback,
      }
    }

    return {
      provider: 'spark',
      apiKey: sparkApiKey,
      endpoint: sparkEndpoint,
      model: process.env.SPARK_MODEL?.trim() || DEFAULT_SPARK_MODEL,
      temperature: parseNumber(process.env.SPARK_TEMPERATURE, 0.35),
      topP: parseNumber(process.env.SPARK_TOP_P, 0.9),
      maxTokens: parseNumber(process.env.SPARK_MAX_TOKENS, 1800, 256, 4096),
      reasoning: parseBoolean(process.env.SPARK_REASONING, true),
      extraBody: parseExtraBody(process.env.SPARK_EXTRA_BODY),
      systemPrompt: resolveSystemPrompt(),
      requestTimeoutMs: parseNumber(process.env.SPARK_REQUEST_TIMEOUT_MS, 30000, 5000, 120000),
    }
  }

  if (sparkApiKey) {
    return {
      provider: 'spark',
      apiKey: sparkApiKey,
      endpoint: sparkEndpoint,
      model: process.env.SPARK_MODEL?.trim() || DEFAULT_SPARK_MODEL,
      temperature: parseNumber(process.env.SPARK_TEMPERATURE, 0.35),
      topP: parseNumber(process.env.SPARK_TOP_P, 0.9),
      maxTokens: parseNumber(process.env.SPARK_MAX_TOKENS, 1800, 256, 4096),
      reasoning: parseBoolean(process.env.SPARK_REASONING, true),
      extraBody: parseExtraBody(process.env.SPARK_EXTRA_BODY),
      systemPrompt: resolveSystemPrompt(),
      requestTimeoutMs: parseNumber(process.env.SPARK_REQUEST_TIMEOUT_MS, 30000, 5000, 120000),
    }
  }

  if (openaiApiKey) {
    return {
      provider: 'openai',
      apiKey: openaiApiKey,
      endpoint: openaiEndpoint,
      model: process.env.OPENAI_MODEL?.trim() || process.env.AI_MODEL?.trim() || DEFAULT_OPENAI_MODEL,
      temperature: parseNumber(process.env.OPENAI_TEMPERATURE, 0.55),
      topP: parseNumber(process.env.OPENAI_TOP_P, 0.95),
      maxTokens: parseNumber(process.env.OPENAI_MAX_TOKENS, 1200, 256, 4096),
      reasoning: false,
      extraBody: parseExtraBody(process.env.OPENAI_EXTRA_BODY),
      systemPrompt: resolveSystemPrompt(),
      requestTimeoutMs: parseNumber(process.env.OPENAI_REQUEST_TIMEOUT_MS, 30000, 5000, 120000),
    }
  }

  const anthropicKey = process.env.ANTHROPIC_API_KEY?.trim() ?? ''
  if (anthropicKey) {
    return {
      provider: 'anthropic',
      apiKey: anthropicKey,
      endpoint: 'https://api.anthropic.com/v1/messages',
      model: process.env.ANTHROPIC_MODEL?.trim() || DEFAULT_ANTHROPIC_MODEL,
      temperature: parseNumber(process.env.ANTHROPIC_TEMPERATURE, 0.4),
      topP: parseNumber(process.env.ANTHROPIC_TOP_P, 0.95),
      maxTokens: parseNumber(process.env.ANTHROPIC_MAX_TOKENS, 2048, 256, 8192),
      reasoning: false,
      extraBody: {},
      systemPrompt: resolveSystemPrompt(),
      requestTimeoutMs: parseNumber(process.env.ANTHROPIC_REQUEST_TIMEOUT_MS, 60000, 5000, 180000),
    }
  }

  return {
    provider: 'mock',
    apiKey: '',
    endpoint: '',
    model: DEFAULT_OPENAI_MODEL,
    ...commonFallback,
  }
}

function buildChatCompletionUrl(baseUrl: string): string {
  const normalized = baseUrl.trim().replace(/\/+$/, '')
  if (!normalized) return 'https://api.openai.com/v1/chat/completions'

  if (normalized.endsWith('/chat/completions')) return normalized
  if (normalized.endsWith('/v1')) return `${normalized}/chat/completions`
  return `${normalized}/v1/chat/completions`
}

function resolveSystemPrompt() {
  return (
    process.env.SPARK_SYSTEM_PROMPT ??
    `당신은 어린이집 입소 전략 AI "토리"입니다.

핵심 원칙:
- 존댓말로 간결하고 실용적으로 답변
- 과장된 보장이나 불확실한 수치 단정 금지
- 입소 확률은 근거형 지표(대기현황, 경쟁률, 정원 여유, 가점 요건) 중심으로 설명
- 시설 추천/비교 시 반드시 show_facility_cards 도구 사용
- 전략 제안 시 반드시 show_strategy_cards 도구 사용
- 확률 분석 시 show_probability_gauge 도구 사용
- 심층 조사 요청 시 start_research 도구 사용
- 위치/동네 기반 추천 시 show_map 도구 사용

응답 형식:
1. 먼저 텍스트로 간단히 설명
2. 적절한 도구로 구조화된 데이터 표시
3. 후속 질문이나 액션 제안`
  )
}

function normalizeHistory(rawHistory: ChatHistoryItem[] = []) {
  return rawHistory
    .map((item) => ({
      role: item.role === 'ai' ? 'assistant' : item.role,
      content: String(item.content ?? '').trim(),
    }))
    .filter((item) => Boolean(item.content))
    .slice(-14)
}

interface CardEvent {
  type: 'card'
  cardType: string
  data: unknown
}

interface ActionEvent {
  type: 'action'
  action: string
  data: unknown
}

type StreamEvent = CardEvent | ActionEvent

interface StreamCompletionOptions {
  input: string
  facilityId?: string
  config: AiProviderConfig
  onDelta: (chunk: string) => void
  onEvent?: (event: StreamEvent) => void
  history: ChatHistoryItem[]
}

async function streamChatCompletion({
  input,
  facilityId,
  config,
  onDelta,
  onEvent,
  history,
}: StreamCompletionOptions): Promise<string> {
  if (!config.apiKey) {
    throw new Error('AI API key is missing')
  }

  if (config.provider === 'anthropic') {
    return streamAnthropicCompletion({ input, facilityId, config, onDelta, onEvent, history })
  }

  const messages = [
    {
      role: 'system',
      content: config.systemPrompt,
    },
    ...history,
    {
      role: 'user',
      content: facilityId ? `[시설 참고: ${facilityId}] ${input}` : input,
    },
  ]

  const body: Record<string, unknown> = {
    model: config.model,
    stream: true,
    temperature: config.temperature,
    top_p: config.topP,
    max_tokens: config.maxTokens,
    messages,
    ...config.extraBody,
  }

  if (config.provider === 'spark' && config.reasoning) {
    body.reasoning = true
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => {
    controller.abort()
  }, config.requestTimeoutMs)

  let response: Response
  try {
    response = await fetch(config.endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timeout)
  }

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '')
    throw new Error(`AI API error ${response.status} ${response.statusText}: ${errorBody}`)
  }

  if (!response.body) {
    throw new Error('AI API에서 응답 body가 없습니다.')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let fullText = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const events = buffer.split('\n\n')
    buffer = events.pop() || ''

    for (const event of events) {
      const dataLines = event
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.startsWith('data:'))
      if (dataLines.length === 0) continue

      for (const dataLine of dataLines) {
        const payload = dataLine.replace(/^data:\s*/, '').trim()
        if (!payload || payload === '[DONE]') continue

        try {
          const parsed = JSON.parse(payload) as ChatCompletionChunk
          const delta = parsed.choices?.[0]?.delta?.content
          if (delta) {
            fullText += delta
            onDelta(delta)
          }
        } catch {}
      }
    }
  }

  return fullText
}

const ANTHROPIC_TOOLS = [
  {
    name: 'show_facility_cards',
    description: '어린이집 시설 카드를 사용자에게 보여줍니다. 추천 결과나 검색 결과를 표시할 때 사용합니다.',
    input_schema: {
      type: 'object' as const,
      properties: {
        facilities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              probability: { type: 'number', description: '입소 확률 0-100' },
              grade: { type: 'string', enum: ['A', 'B', 'C', 'D'] },
              distance: { type: 'string' },
              ageGroup: { type: 'string' },
            },
            required: ['name', 'probability', 'grade'],
          },
        },
      },
      required: ['facilities'],
    },
  },
  {
    name: 'show_strategy_cards',
    description: '입소 확률을 높이는 전략 카드를 보여줍니다.',
    input_schema: {
      type: 'object' as const,
      properties: {
        strategies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              impact: { type: 'number', description: '확률 변동 예상치 %' },
              description: { type: 'string' },
            },
            required: ['title', 'impact', 'description'],
          },
        },
      },
      required: ['strategies'],
    },
  },
  {
    name: 'show_probability_gauge',
    description: '현재 입소 확률 게이지를 보여줍니다.',
    input_schema: {
      type: 'object' as const,
      properties: {
        value: { type: 'number', description: '현재 확률 0-100' },
        delta: { type: 'number', description: '이전 대비 변동' },
      },
      required: ['value'],
    },
  },
  {
    name: 'start_research',
    description: '심층 리서치를 시작합니다. 사용자가 자세한 분석이나 조사를 요청할 때 사용합니다.',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string', description: '리서치 질의' },
      },
      required: ['query'],
    },
  },
  {
    name: 'show_map',
    description: '지도에 시설 위치를 표시합니다.',
    input_schema: {
      type: 'object' as const,
      properties: {
        pins: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              lat: { type: 'number' },
              lng: { type: 'number' },
              label: { type: 'string' },
              subtitle: { type: 'string' },
            },
            required: ['id', 'lat', 'lng', 'label'],
          },
        },
      },
      required: ['pins'],
    },
  },
]

function mapToolResultToEvent(toolName: string, result: Record<string, unknown>): StreamEvent | null {
  switch (toolName) {
    case 'show_facility_cards':
      return { type: 'card', cardType: 'facility', data: result.facilities }
    case 'show_strategy_cards':
      return { type: 'card', cardType: 'strategy', data: result.strategies }
    case 'show_probability_gauge':
      return { type: 'card', cardType: 'gauge', data: result }
    case 'start_research':
      return { type: 'action', action: 'start_research', data: result }
    case 'show_map':
      return { type: 'action', action: 'show_map', data: result }
    default:
      return null
  }
}

async function streamAnthropicCompletion({
  input,
  facilityId,
  config,
  onDelta,
  onEvent,
  history,
}: StreamCompletionOptions): Promise<string> {
  const messages = [
    ...history.map((h) => ({
      role: h.role === 'system' ? ('user' as const) : (h.role as 'user' | 'assistant'),
      content: h.content,
    })),
    {
      role: 'user' as const,
      content: facilityId ? `[시설 참고: ${facilityId}] ${input}` : input,
    },
  ]

  const body = {
    model: config.model,
    max_tokens: config.maxTokens,
    temperature: config.temperature,
    top_p: config.topP,
    system: [{ type: 'text', text: config.systemPrompt, cache_control: { type: 'ephemeral' } }],
    messages,
    tools: ANTHROPIC_TOOLS,
    stream: true,
  }

  const abortCtrl = new AbortController()
  const timeout = setTimeout(() => abortCtrl.abort(), config.requestTimeoutMs)

  let response: Response
  try {
    response = await fetch(config.endpoint, {
      method: 'POST',
      headers: {
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'prompt-caching-2024-07-31',
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
      },
      body: JSON.stringify(body),
      signal: abortCtrl.signal,
    })
  } finally {
    clearTimeout(timeout)
  }

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '')
    throw new Error(`Anthropic API error ${response.status}: ${errorBody}`)
  }

  if (!response.body) {
    throw new Error('Anthropic API에서 응답 body가 없습니다.')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let fullText = ''

  // Tool use tracking
  let currentToolName = ''
  let currentToolInputJson = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const events = buffer.split('\n\n')
    buffer = events.pop() || ''

    for (const event of events) {
      const lines = event.split('\n').map((l) => l.trim())
      const eventType = lines
        .find((l) => l.startsWith('event:'))
        ?.replace('event:', '')
        .trim()
      const dataLine = lines.find((l) => l.startsWith('data:'))
      if (!dataLine) continue

      const payload = dataLine.replace(/^data:\s*/, '').trim()
      if (!payload) continue

      try {
        const parsed = JSON.parse(payload)

        if (eventType === 'content_block_start' && parsed.content_block?.type === 'tool_use') {
          currentToolName = parsed.content_block.name ?? ''
          currentToolInputJson = ''
        }

        if (eventType === 'content_block_delta' && parsed.delta?.type === 'text_delta') {
          const text = parsed.delta.text
          if (text) {
            fullText += text
            onDelta(text)
          }
        }

        if (eventType === 'content_block_delta' && parsed.delta?.type === 'input_json_delta') {
          currentToolInputJson += parsed.delta.partial_json ?? ''
        }

        if (eventType === 'content_block_stop' && currentToolName) {
          try {
            const toolInput = JSON.parse(currentToolInputJson) as Record<string, unknown>
            const streamEvent = mapToolResultToEvent(currentToolName, toolInput)
            if (streamEvent && onEvent) {
              onEvent(streamEvent)
            }
          } catch {
            // ignore malformed tool JSON
          }
          currentToolName = ''
          currentToolInputJson = ''
        }
      } catch {}
    }
  }

  console.log(`[Chat API] Anthropic stream complete: ~${Math.ceil(fullText.length / 4)} output tokens`)

  return fullText
}

function parseBoolean(rawValue: string | undefined, fallback: boolean) {
  if (!rawValue) return fallback
  if (/^(true|1|y|yes)$/i.test(rawValue.trim())) return true
  if (/^(false|0|n|no)$/i.test(rawValue.trim())) return false
  return fallback
}

function parseNumber(rawValue: string | undefined, fallback: number, min = 0, max = Number.MAX_SAFE_INTEGER) {
  const value = Number(rawValue)
  if (!Number.isFinite(value)) return fallback
  return Math.min(Math.max(value, min), max)
}

function parseExtraBody(rawValue: string | undefined) {
  if (!rawValue?.trim()) return {}
  try {
    const parsed = JSON.parse(rawValue)
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>
    }
  } catch {
    console.warn('[Chat API] SPARK_EXTRA_BODY parsing failed')
  }
  return {}
}

function generateAIResponse(message: string): { chunks: string[]; cards: RichCard[]; actions: MockAction[] } {
  const responses: Record<string, { chunks: string[]; cards: RichCard[]; actions: MockAction[] }> = {
    default: {
      chunks: [
        '안녕하세요! ',
        '도토리 ',
        'AI 에이전트 토리입니다. ',
        '어린이집 입소에 ',
        '대해 궁금하신 점을 ',
        '말씀해 주세요.',
      ],
      cards: [],
      actions: [],
    },
    확률: {
      chunks: ['현재 선택하신 ', '시설의 입소 확률을 ', '분석했어요. ', '3개 관심 시설의 ', '결과를 확인해보세요.'],
      cards: [
        {
          cardType: 'facility',
          data: [
            { name: '햇살 어린이집', probability: 88, grade: 'A', distance: '650m', ageGroup: '0세반' },
            { name: '해맑은 어린이집', probability: 72, grade: 'B', distance: '820m', ageGroup: '0세반' },
            { name: '무지개 어린이집', probability: 45, grade: 'C', distance: '1.2km', ageGroup: '0세반' },
          ],
        },
        { cardType: 'gauge', data: { value: 72, delta: 5 } },
      ],
      actions: [],
    },
    전략: {
      chunks: ['입소 확률을 높이는 ', '핵심 전략 ', '3가지를 ', '추천드려요.'],
      cards: [
        {
          cardType: 'strategy',
          data: [
            { title: '2지망 추가 신청', impact: 12, description: '가장 효과가 큰 전략' },
            { title: '가점 항목 확인', impact: 8, description: '다자녀/맞벌이 가점' },
            { title: '연장보육 신청', impact: 5, description: '간단하게 적용 가능' },
          ],
        },
      ],
      actions: [],
    },
    비교: {
      chunks: ['관심 시설 3곳을 ', '비교 분석했어요. ', '비용 대비 효과는 ', '해맑은이 가장 균형적이에요.'],
      cards: [
        {
          cardType: 'compare',
          data: [
            { name: '햇살 어린이집', probability: 88, cost: '45만', distance: '650m' },
            { name: '해맑은 어린이집', probability: 72, cost: '35만', distance: '820m' },
            { name: '무지개 어린이집', probability: 45, cost: '25만', distance: '1.2km' },
          ],
        },
      ],
      actions: [],
    },
    리서치: {
      chunks: ['심층 리서치를 시작할게요. ', '출처를 모으고 근거를 타임라인으로 정리해드릴게요.'],
      cards: [],
      actions: [
        {
          action: 'start_research',
          data: { query: message.trim() || '입소 전략 리서치' },
        },
      ],
    },
    지도: {
      chunks: ['후보 시설을 지도에 표시했어요. ', '위치와 거리 기준으로 바로 비교해보세요.'],
      cards: [],
      actions: [
        {
          action: 'show_map',
          data: {
            pins: [
              { id: 'dc_demo_1', lat: 37.502, lng: 127.011, label: '해맑은 어린이집', subtitle: '서초구 반포동' },
              { id: 'dc_demo_2', lat: 37.497, lng: 127.017, label: '햇살 어린이집', subtitle: '서초구 서초동' },
              { id: 'dc_demo_3', lat: 37.508, lng: 127.004, label: '무지개 어린이집', subtitle: '서초구 잠원동' },
            ],
          },
        },
      ],
    },
  }

  if (message.includes('리서치') || message.includes('조사')) return responses.리서치
  if (message.includes('지도') || message.includes('위치')) return responses.지도
  if (message.includes('확률')) return responses.확률
  if (message.includes('전략') || message.includes('높이')) return responses.전략
  if (message.includes('비교')) return responses.비교
  return responses.default
}
