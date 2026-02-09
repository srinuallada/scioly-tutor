import { config } from '../../app/config/env'

export interface StreamMeta {
  intent: string
  sources_used: number
  topics_referenced: string[]
}

export interface StreamCallbacks {
  onMeta: (meta: StreamMeta) => void
  onToken: (text: string) => void
  onDone: (quizData: { options: string[]; correct_letter: string } | null) => void
  onError: (error: string) => void
}

export async function sendMessageStream(
  message: string,
  studentName: string,
  conversationHistory: { role: string; content: string }[],
  callbacks: StreamCallbacks,
): Promise<void> {
  const url = `${config.apiBaseUrl}/chat/stream`

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      student_name: studentName,
      conversation_history: conversationHistory,
    }),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: `Request failed (${res.status})` }))
    callbacks.onError(body.detail || `HTTP ${res.status}`)
    return
  }

  const reader = res.body?.getReader()
  if (!reader) {
    callbacks.onError('Streaming not supported')
    return
  }

  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })

    // Parse SSE events from buffer
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? '' // keep incomplete line in buffer

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      try {
        const event = JSON.parse(line.slice(6))
        if (event.type === 'meta') {
          callbacks.onMeta(event)
        } else if (event.type === 'token') {
          callbacks.onToken(event.text)
        } else if (event.type === 'done') {
          callbacks.onDone(event.quiz_data)
        }
      } catch {
        // ignore malformed events
      }
    }
  }
}
