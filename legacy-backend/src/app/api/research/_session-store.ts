import type { EvidenceItem, ResearchStep, ResearchStreamEvent } from './model'

type ResearchStreamController = ReadableStreamDefaultController<Uint8Array>

export type ResearchSession = {
  query: string
  steps: ResearchStep[]
  evidences: EvidenceItem[]
  listeners: Set<ResearchStreamController>
  status: 'running' | 'done'
}

const globalWithResearchSessions = globalThis as typeof globalThis & {
  __researchSessions?: Map<string, ResearchSession>
}

if (!globalWithResearchSessions.__researchSessions) {
  globalWithResearchSessions.__researchSessions = new Map()
}

export const researchSessions = globalWithResearchSessions.__researchSessions

const textEncoder = new TextEncoder()

function encodeEvent(event: ResearchStreamEvent) {
  return textEncoder.encode(`data: ${JSON.stringify(event)}\n\n`)
}

export function pushEvent(controller: ResearchStreamController, event: ResearchStreamEvent) {
  controller.enqueue(encodeEvent(event))
}

export function broadcastEvent(session: ResearchSession, event: ResearchStreamEvent) {
  for (const listener of [...session.listeners]) {
    try {
      pushEvent(listener, event)
      if (event.type === 'done') {
        listener.close()
        session.listeners.delete(listener)
      }
    } catch {
      session.listeners.delete(listener)
    }
  }
}

export function closeListener(session: ResearchSession, listener: ResearchStreamController) {
  if (!session.listeners.has(listener)) return
  session.listeners.delete(listener)
  try {
    listener.close()
  } catch {
    // stream might be already closed
  }
}
