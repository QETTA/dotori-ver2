export type ResearchStep = {
  id: string
  type: 'search' | 'open' | 'extract' | 'compare' | 'decide' | 'restricted'
  status: 'running' | 'done' | 'failed' | 'restricted'
  title: string
  detail?: string
  ts: string
}

export type EvidenceItem = {
  id: string
  sourceType: 'official' | 'media' | 'youtube' | 'blog' | 'user_provided'
  trustLabel: string
  url?: string
  title: string
  snippet: string
  ts: string
}

export type ResearchStreamEvent =
  | { type: 'stepAdded'; step: ResearchStep }
  | { type: 'evidenceAdded'; evidence: EvidenceItem }
  | { type: 'done' }
