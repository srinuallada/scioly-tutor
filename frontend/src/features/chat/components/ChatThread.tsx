import { useRef, useEffect, memo } from 'react'
import { Box } from '@mui/material'
import { useVirtualizer } from '@tanstack/react-virtual'
import MessageBubble from '../../../shared/ui/MessageBubble'
import TypingIndicator from '../../../shared/ui/TypingIndicator'
import QuizCard from '../../quiz/components/QuizCard'
import { submitQuiz } from '../../../lib/api/quiz'
import type { ChatMessage } from '../../../shared/types'

interface Props {
  messages: ChatMessage[]
  loading: boolean
  studentName?: string
}

function extractQuestion(content: string): string {
  // Grab text before the first option line (A) / A. / A:)
  const match = content.match(/^([\s\S]*?)(?=\n\s*A[).:\s])/m)
  if (match?.[1]?.trim()) return match[1].trim()
  // Fallback: first non-empty line
  const firstLine = content.split('\n').find((l) => l.trim())
  return firstLine?.replace(/^[#*]+\s*/, '').trim() || 'Select your answer:'
}

function ChatThread({ messages, loading, studentName = 'default' }: Props) {
  const parentRef = useRef<HTMLDivElement>(null)
  const itemCount = messages.length + (loading ? 1 : 0)

  const rowVirtualizer = useVirtualizer({
    count: itemCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 120,
    overscan: 6,
  })

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (itemCount > 0) {
      rowVirtualizer.scrollToIndex(itemCount - 1, { align: 'end' })
    }
  }, [itemCount, rowVirtualizer])

  // Keep scrolled to bottom during streaming as content grows
  const lastMsg = messages[messages.length - 1]
  const streamingContent = lastMsg?.role === 'assistant' && loading ? lastMsg.content.length : 0
  useEffect(() => {
    if (streamingContent > 0) {
      // Re-measure the last item then scroll to it
      rowVirtualizer.scrollToIndex(itemCount - 1, { align: 'end' })
    }
  }, [streamingContent, itemCount, rowVirtualizer])

  const handleQuizAnswer = (msg: ChatMessage, selectedLetter: string, isCorrect: boolean) => {
    const topic = msg.topics_referenced?.[0] || 'General'
    submitQuiz({
      question: extractQuestion(msg.content),
      student_answer: selectedLetter,
      correct_answer: msg.quiz_data!.correct_letter,
      topic,
      student_name: studentName,
    }).catch(() => {})
  }

  const items = rowVirtualizer.getVirtualItems()

  return (
    <Box ref={parentRef} className="h-full overflow-y-auto" sx={{ pb: 2 }}>
      <Box
        sx={{
          height: rowVirtualizer.getTotalSize(),
          width: '100%',
          position: 'relative',
        }}
      >
        {items.map((virtualRow) => {
          const index = virtualRow.index
          const isTypingRow = loading && index === messages.length
          const msg = messages[index]
          return (
            <Box
              key={virtualRow.key}
              data-index={index}
              ref={rowVirtualizer.measureElement}
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              {isTypingRow && <TypingIndicator />}
              {msg && (
                <Box>
                  <MessageBubble message={msg} isStreaming={loading && index === messages.length - 1 && msg.role === 'assistant' && msg.content.length > 0} />
                  {msg.quiz_data && msg.quiz_data.options.length > 0 && (
                    <Box className="px-4 pb-3 max-w-[75%]" sx={{ ml: '44px' }}>
                      <QuizCard
                        question={extractQuestion(msg.content)}
                        options={msg.quiz_data.options}
                        correctLetter={msg.quiz_data.correct_letter}
                        topic={msg.topics_referenced?.[0]}
                        onAnswer={(letter, correct) => handleQuizAnswer(msg, letter, correct)}
                      />
                    </Box>
                  )}
                </Box>
              )}
            </Box>
          )
        })}
      </Box>
    </Box>
  )
}

export default memo(ChatThread)
