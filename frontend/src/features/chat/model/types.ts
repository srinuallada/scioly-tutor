import type { ChatMessage } from '../../../shared/types'

export interface ChatState {
  messages: ChatMessage[]
  loading: boolean
  error: string | null
}

export interface QuickPrompt {
  text: string
  icon: React.ReactNode
  color: string
}
