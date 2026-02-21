/** Retry with exponential backoff */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: { maxRetries?: number; baseDelayMs?: number; onRetry?: (error: unknown, attempt: number) => void } = {},
): Promise<T> {
  const { maxRetries = 3, baseDelayMs = 500, onRetry } = options

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      if (attempt === maxRetries) throw error
      onRetry?.(error, attempt + 1)
      await new Promise((r) => setTimeout(r, baseDelayMs * 2 ** attempt))
    }
  }

  throw new Error('withRetry: unreachable')
}
