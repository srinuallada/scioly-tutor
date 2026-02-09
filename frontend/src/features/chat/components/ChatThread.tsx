import { useRef, useEffect } from 'react'
import { Box } from '@mui/material'
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

export default function ChatThread({ messages, loading, studentName = 'default' }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

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

  return (
    <Box className="py-3">
      {messages.map((msg, i) => (
        <Box key={i}>
          <MessageBubble message={msg} />
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
      ))}
      {loading && <TypingIndicator />}
      <div ref={bottomRef} />
    </Box>
  )
}
