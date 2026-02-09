/**
 * EventSource helper for Server-Sent Events (future streaming support).
 */

import { config } from '../../app/config/env'

export interface SSECallbacks {
  onMessage: (data: string) => void
  onError?: (error: Event) => void
  onComplete?: () => void
}

export function createSSE(path: string, callbacks: SSECallbacks): EventSource {
  const url = `${config.apiBaseUrl}${path}`
  const source = new EventSource(url)

  source.onmessage = (event) => {
    if (event.data === '[DONE]') {
      source.close()
      callbacks.onComplete?.()
      return
    }
    callbacks.onMessage(event.data)
  }

  source.onerror = (event) => {
    source.close()
    callbacks.onError?.(event)
  }

  return source
}
