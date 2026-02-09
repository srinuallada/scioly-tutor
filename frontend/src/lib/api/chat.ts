import { http } from '../http/client'
import type { ChatResponse } from '../../shared/types'

export function sendMessage(
  message: string,
  studentName = 'default',
  conversationHistory: { role: string; content: string }[] = [],
): Promise<ChatResponse> {
  return http.post<ChatResponse>('/chat', {
    message,
    student_name: studentName,
    conversation_history: conversationHistory,
  })
}
