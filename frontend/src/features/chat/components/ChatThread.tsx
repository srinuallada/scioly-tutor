import { useRef, useEffect } from 'react'
import { Box } from '@mui/material'
import MessageBubble from '../../../shared/ui/MessageBubble'
import TypingIndicator from '../../../shared/ui/TypingIndicator'
import type { ChatMessage } from '../../../shared/types'

interface Props {
  messages: ChatMessage[]
  loading: boolean
}

export default function ChatThread({ messages, loading }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  return (
    <Box className="py-3">
      {messages.map((msg, i) => (
        <MessageBubble key={i} message={msg} />
      ))}
      {loading && <TypingIndicator />}
      <div ref={bottomRef} />
    </Box>
  )
}
