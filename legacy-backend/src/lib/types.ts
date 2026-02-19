/* ─── Grade System ─── */
export type Grade = 'A' | 'B' | 'C' | 'D' | 'E' | 'F'

export const GRADE_THRESHOLDS = {
  A: 80,
  B: 60,
  C: 40,
  D: 25,
  E: 10,
} as const

/* ─── API Responses ─── */
export interface ApiResponse<T> {
  data: T
  success: boolean
  error?: string
  meta?: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

export interface ApiError {
  code: string
  message: string
  status: number
}
