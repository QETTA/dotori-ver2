import { auth } from '@/auth'
import { createApiErrorResponse } from '@/lib/api-error'
import { ensureChatQuota, resolveClientIp, rollbackChatUsage } from '@/lib/chat-quota'
import dbConnect from '@/lib/db'
import type { ChatIntent } from '@/lib/engine/intent-classifier'
import { classifyIntent } from '@/lib/engine/intent-classifier'
import { buildResponse, extractConversationContext } from '@/lib/engine/response-builder'
import { log } from '@/lib/logger'
import { strictLimiter } from '@/lib/rate-limit'
import { sanitizeString } from '@/lib/sanitize'
import { chatMessageSchema, parseBody } from '@/lib/validations'
import ChatHistory, { type IChatHistory } from '@/models/ChatHistory'
import type { ChatBlock } from '@/types/dotori'
import Anthropic from '@anthropic-ai/sdk'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { API_CONFIG } from '@/lib/config/api'

const { maxMessages: MAX_CHAT_MESSAGES, blocksRetainCount: BLOCKS_RETAIN_COUNT, maxConcurrentStreams: MAX_CONCURRENT_STREAMS, maxRetries: MAX_RETRIES, model: AI_MODEL, timeoutMs: AI_TIMEOUT_MS } = API_CONFIG.CHAT

// Per-user concurrent stream tracking
const activeStreams = new Map<string, number>()
const STREAM_SYSTEM_PROMPT = `당신은 "토리", 도토리 앱의 어린이집·유치원 AI 어시스턴트입니다.

## 정체성
- 한국 보육시설 전문가. 아이사랑포털(childcare.go.kr), 보건복지부 보육정책 기반 지식.
- 부모의 관점에서 따뜻하고 전문적인 반말체로 대화.
- 이름: 토리 (도토리의 마스코트)

## 응답 규칙
1. 간결성: 3~5문장 이내. 핵심만 전달.
2. 시설 데이터가 제공되면 수치(정원/현원/대기/평점)를 인용.
3. 항상 사용자가 할 수 있는 다음 단계를 1~2개 제안.
4. 이모지: 최소 사용.
5. 시설 이동(전원) = 다른 시설로 옮기는 것. 집 이사와 혼동 금지!

## 보육·교육시설 유형별 특징
- 국공립: 정부 운영, 보육료 저렴, 경쟁 치열. 맞벌이 가산점.
- 민간: 다양한 프로그램, 비용 다양. 평가인증 확인 중요.
- 가정: 소규모(20명 이하), 영아에게 유리.
- 직장: 직장 내 설치, 출퇴근 편의. 재직자 우선.

## 주요 상담 유형 대응
- 반편성 불만/이동 고민: 이유 파악 → 지역 내 대안 시설 탐색 → 전원 절차 안내
- 시설 추천: 지역·연령·유형 조건으로 DB 검색 결과 설명
- 입소 대기/현황: 대기 순번, 입소 가능 시기 안내

## 데이터가 없을 때
시설 데이터가 없으면 일반 보육 지식으로 답변하고 "탐색 페이지에서 직접 검색해보세요"라고 안내.`

const INTENT_GUIDANCE: Record<string, string> = {
  transfer:
    '[상담 맥락: 시설 이동/전원 상담 중. 반편성·교사·시설 불만 등 이동 이유를 공감하며 파악하고, 지역 내 대안 시설과 전원 절차를 안내하세요.]',
  recommend: '[상담 맥락: 시설 추천 요청. 지역·연령·유형 조건에 맞는 시설을 안내하세요.]',
  compare: '[상담 맥락: 시설 비교 요청. 제공된 시설 데이터를 기반으로 비교 분석해주세요.]',
  status: '[상담 맥락: 대기/입소 현황 문의. 제공된 현황 데이터를 해석하여 안내하세요.]',
  knowledge: '[상담 맥락: 보육 정책/입소 기준 문의. 정확한 보육 정보를 제공하세요.]',
  checklist: '[상담 맥락: 입소 준비 체크리스트 요청.]',
}
const QUICK_REPLIES_BY_INTENT: Record<string, string[]> = {
  transfer: ['근처 대안 시설 찾기', '전원 절차 안내', '서류 체크리스트'],
  recommend: ['더 보기', '지도에서 보기', '비교하기'],
  general: ['이동 고민', '빈자리 탐색', '입소 체크리스트'],
}

type ChatRequest = {
  message: string
  previousMessages?: Array<{
    role: 'user' | 'assistant'
    content: string
  }>
}

function sanitizePreviousMessages(messages: ChatRequest['previousMessages'] = []): {
  role: 'user' | 'assistant'
  content: string
}[] {
  return messages
    .map((msg) => ({
      role: msg.role,
      content: sanitizeString(msg.content),
    }))
    .filter((msg) => msg.content.length > 0)
    .slice(-10)
}

function getQuickReplies(intent: ChatIntent): string[] {
  return QUICK_REPLIES_BY_INTENT[intent] ?? []
}

type StartEvent = {
  type: 'start'
  intent: ChatIntent
}

type BlockEvent = {
  type: 'block'
  block: ChatBlock
}

type TextEvent = {
  type: 'text'
  text: string
}

type DoneEvent = {
  type: 'done'
  timestamp: string
  quick_replies?: string[]
}

type ErrorEvent = {
  type: 'error'
  error: {
    code: string
    message: string
    requestId: string
  }
}

type StreamEvent = StartEvent | BlockEvent | TextEvent | DoneEvent | ErrorEvent

function emitEvent(
  controller: ReadableStreamDefaultController<Uint8Array>,
  encoder: TextEncoder,
  event: StreamEvent,
) {
  controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
}

function withRequestId(response: NextResponse, requestId: string): NextResponse {
  response.headers.set('X-Request-Id', requestId)
  return response
}

function isAuthUserId(userId: unknown): userId is string {
  return typeof userId === 'string' && userId.length > 0
}

function getAnthropicClient(): Anthropic | null {
  const apiKey = process.env.ANTHROPIC_API_KEY || ''
  if (!apiKey) {
    log.warn('ANTHROPIC_API_KEY가 설정되지 않았습니다')
    return null
  }

  return new Anthropic({
    apiKey,
    timeout: AI_TIMEOUT_MS,
  })
}

function buildFacilityContext(blocks: ChatBlock[]): string {
  const seenNames = new Set<string>()
  const lines: string[] = []

  for (const block of blocks) {
    if (block.type === 'facility_list' || block.type === 'compare') {
      for (const facility of block.facilities) {
        if (seenNames.has(facility.name)) continue
        seenNames.add(facility.name)

        const waitLabel =
          facility.status === 'available'
            ? `여석 ${facility.capacity.total - facility.capacity.current}명`
            : facility.status === 'waiting'
              ? `대기 ${facility.capacity.waiting}명`
              : '정원 마감'

        lines.push(
          `- ${facility.name} (${facility.type}, ${facility.status}, 정원 ${facility.capacity.total}명/현원 ${facility.capacity.current}명, ${waitLabel}, 평점 ${facility.rating.toFixed(1)})`,
        )
        lines.push(`  주소: ${facility.address}`)
        if (facility.evaluationGrade) {
          lines.push(`  평가인증 ${facility.evaluationGrade}등급`)
        }
        if (facility.features.length > 0) {
          lines.push(`  특징: ${facility.features.join(', ')}`)
        }
      }
    }
  }

  if (lines.length === 0) return ''
  return `[검색된 시설 데이터]\n${lines.join('\n')}`
}

export const POST = async (req: NextRequest) => {
  const requestId = crypto.randomUUID()
  const limited = strictLimiter.check(req, requestId)
  if (limited) return withRequestId(limited, requestId)

  let rawBody: unknown
  try {
    rawBody = await req.json()
  } catch {
    return withRequestId(
      createApiErrorResponse({
        status: 400,
        code: 'BAD_REQUEST',
        message: '유효하지 않은 JSON입니다',
        requestId,
      }),
      requestId,
    )
  }

  const parsed = parseBody(chatMessageSchema, rawBody, requestId)
  if (!parsed.success) return withRequestId(parsed.response, requestId)

  const requestData = parsed.data as ChatRequest
  const message = sanitizeString(requestData.message)
  const session = await auth()
  const userId = isAuthUserId(session?.user?.id) ? session.user.id : undefined
  const isPremiumPlan = session?.user?.plan === 'premium'
  const clientIp = resolveClientIp(req.headers)
  const quotaResponse = await ensureChatQuota({
    userId,
    isPremiumPlan,
    clientIp,
    requestId,
    consume: true,
  })
  if (quotaResponse) {
    return withRequestId(quotaResponse, requestId)
  }

  // Per-user concurrent stream limit
  const streamKey = userId || `guest:${clientIp}`
  const currentStreams = activeStreams.get(streamKey) ?? 0
  if (currentStreams >= MAX_CONCURRENT_STREAMS) {
    return withRequestId(
      createApiErrorResponse({
        status: 429,
        code: 'RATE_LIMITED',
        message: '동시에 여러 채팅을 진행할 수 없어요. 잠시 후 다시 시도해주세요.',
        requestId,
      }),
      requestId,
    )
  }
  activeStreams.set(streamKey, currentStreams + 1)

  let streamReleased = false
  let quotaCommitted = false
  const releaseStream = () => {
    if (streamReleased) return
    streamReleased = true
    const count = activeStreams.get(streamKey) ?? 1
    if (count <= 1) {
      activeStreams.delete(streamKey)
    } else {
      activeStreams.set(streamKey, count - 1)
    }
  }
  const rollbackQuotaUsage = async () => {
    if (quotaCommitted) return
    quotaCommitted = true
    try {
      await rollbackChatUsage({
        userId,
        isPremiumPlan,
        clientIp,
      })
    } catch (rollbackError) {
      log.error('Chat quota rollback 실패', {
        requestId,
        error: rollbackError instanceof Error ? rollbackError.message : String(rollbackError),
      })
    }
  }

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      let chatHistory: IChatHistory | null = null
      let assistantContent = ''
      let hasStreamingText = false

      try {
        await dbConnect()

        if (userId) {
          chatHistory = await ChatHistory.findOne({ userId }).sort({
            createdAt: -1,
          })
          if (!chatHistory) {
            chatHistory = await ChatHistory.create({
              userId,
              messages: [],
            })
          }
        }

        const recentMessages = chatHistory?.messages.slice(-10) ?? []
        const previousMessages = chatHistory
          ? sanitizePreviousMessages(
              recentMessages.map((m) => ({
                role: m.role,
                content: m.content,
              })),
            )
          : sanitizePreviousMessages(requestData.previousMessages)
        const conversationContext = extractConversationContext(
          recentMessages.map((m) => ({
            role: m.role,
            content: m.content,
            blocks: m.blocks,
          })),
        )
        conversationContext.previousMessages = previousMessages

        const intent = classifyIntent(message, {
          previousMessages: conversationContext.previousMessages,
        })
        const quickReplies = getQuickReplies(intent)

        emitEvent(controller, encoder, {
          type: 'start',
          intent,
        })

        const response = await buildResponse(intent, message, userId, conversationContext)

        for (const block of response.blocks) {
          emitEvent(controller, encoder, {
            type: 'block',
            block,
          })
        }

        const facilityContext = buildFacilityContext(response.blocks)
        const intentGuide = INTENT_GUIDANCE[intent as string] ?? ''
        const streamInput = [
          intentGuide,
          facilityContext,
          facilityContext || intentGuide ? `사용자 질문:\n${message}` : message,
        ]
          .filter(Boolean)
          .join('\n\n')
        const streamMessages: { role: 'user' | 'assistant'; content: string }[] = [
          ...previousMessages.map((m) => ({
            role: (m.role === 'assistant' ? 'assistant' : 'user') as 'user' | 'assistant',
            content: m.content,
          })),
          { role: 'user' as const, content: streamInput },
        ]

        let streamFailed = false
        const anthropicClient = getAnthropicClient()
        if (anthropicClient) {
          for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
            try {
              const responseStream = await anthropicClient.messages.stream({
                model: AI_MODEL,
                max_tokens: 1500,
                messages: streamMessages,
                system: STREAM_SYSTEM_PROMPT,
              })

              for await (const chunk of responseStream) {
                if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
                  hasStreamingText = true
                  assistantContent += chunk.delta.text
                  emitEvent(controller, encoder, {
                    type: 'text',
                    text: chunk.delta.text,
                  })
                }
              }
              await responseStream.finalMessage()
              break
            } catch (err) {
              const streamError = err instanceof Error ? err.message : 'unknown'
              const isRetryable =
                streamError.includes('500') ||
                streamError.includes('Internal server error') ||
                streamError.includes('overloaded') ||
                streamError.includes('529') ||
                streamError.includes('timeout') ||
                streamError.includes('ECONNRESET') ||
                streamError.includes('socket hang up')
              if (isRetryable && attempt < MAX_RETRIES && !hasStreamingText) {
                log.warn('Anthropic API 재시도', {
                  requestId,
                  attempt: attempt + 1,
                  error: streamError,
                })
                await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)))
                continue
              }
              streamFailed = true
              log.error('Anthropic 실시간 응답 처리 실패', {
                requestId,
                intent,
                error: streamError,
                attempts: attempt + 1,
              })
              assistantContent = ''
              hasStreamingText = false
              break
            }
          }
        }

        if (!hasStreamingText) {
          assistantContent = response.content
          emitEvent(controller, encoder, {
            type: 'text',
            text: response.content,
          })
        }

        if (!assistantContent) {
          assistantContent = '요청하신 응답을 생성하지 못했어요. 잠시 후 다시 시도해주세요.'
        }

        const assistantTimestamp = new Date()

        // Only persist message and record usage when stream completed successfully
        if (!streamFailed && chatHistory) {
          const userMessage = {
            role: 'user' as const,
            content: message,
            timestamp: assistantTimestamp,
          }
          const assistantMessage = {
            role: 'assistant' as const,
            content: assistantContent,
            timestamp: assistantTimestamp,
            blocks: response.blocks,
            metadata: {
              intent,
              quickReplies,
            },
          }
          chatHistory.messages.push(userMessage)
          chatHistory.messages.push(assistantMessage)
          if (chatHistory.messages.length > MAX_CHAT_MESSAGES) {
            chatHistory.messages = chatHistory.messages.slice(-MAX_CHAT_MESSAGES)
          }
          // Strip blocks from older messages to keep document size under 16MB
          const blocksThreshold = chatHistory.messages.length - BLOCKS_RETAIN_COUNT
          for (let i = 0; i < blocksThreshold; i++) {
            const msg = chatHistory.messages[i]
            if (msg && msg.blocks && msg.blocks.length > 0) {
              msg.blocks = undefined
            }
          }
          await chatHistory.save()
        }

        if (streamFailed) {
          await rollbackQuotaUsage()
        } else {
          quotaCommitted = true
        }

        emitEvent(controller, encoder, {
          type: 'done',
          timestamp: assistantTimestamp.toISOString(),
          quick_replies: quickReplies,
        })
        controller.close()
        releaseStream()
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : '요청 처리 중 문제가 발생했습니다.'
        log.error('Chat stream 처리 실패', { requestId, error: errorMessage })
        emitEvent(controller, encoder, {
          type: 'error',
          error: {
            code: 'INTERNAL_ERROR',
            message: '채팅을 생성하지 못했어요. 잠시 후 다시 시도해주세요.',
            requestId,
          },
        })
        emitEvent(controller, encoder, {
          type: 'done',
          timestamp: new Date().toISOString(),
        })
        await rollbackQuotaUsage()
        controller.close()
        releaseStream()
      }
    },
    cancel() {
      void rollbackQuotaUsage()
      releaseStream()
    },
  })

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
      'X-Request-Id': requestId,
    },
  })
}
