import { useState, useEffect, useRef } from 'react'
import { Box, Typography, Avatar, Chip, Paper, Tooltip } from '@mui/material'
import ScienceIcon from '@mui/icons-material/Science'
import QuizIcon from '@mui/icons-material/Quiz'
import SummarizeIcon from '@mui/icons-material/Summarize'
import PsychologyIcon from '@mui/icons-material/Psychology'
import SchoolIcon from '@mui/icons-material/School'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import ChatThread from '../components/ChatThread'
import ChatComposer from '../components/ChatComposer'
import { sendMessageStream } from '../../../lib/api/chatStream'
import type { ChatMessage } from '../../../shared/types'

const QUICK_PROMPTS = [
  { text: 'Quiz me on the key concepts!', icon: <QuizIcon fontSize="small" />, color: '#7c3aed' },
  { text: 'Summarize the main topics', icon: <SummarizeIcon fontSize="small" />, color: '#2563eb' },
  { text: 'What are the hardest parts to remember?', icon: <PsychologyIcon fontSize="small" />, color: '#d97706' },
  { text: "Explain this like I'm a beginner", icon: <SchoolIcon fontSize="small" />, color: '#16a34a' },
]

interface Props {
  studentName: string
  materialCount: number
}

const STORAGE_KEY_PREFIX = 'scioly-chat-'

function loadMessages(studentName: string): ChatMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PREFIX + studentName)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export default function ChatPage({ studentName, materialCount }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => loadMessages(studentName))
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const streamTextRef = useRef('')

  // Reload messages when student changes
  useEffect(() => {
    setMessages(loadMessages(studentName))
  }, [studentName])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PREFIX + studentName, JSON.stringify(messages))
  }, [messages, studentName])

  const send = async (text?: string) => {
    const msg = text || input.trim()
    if (!msg || loading) return

    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: msg }])
    setLoading(true)
    streamTextRef.current = ''

    // Add placeholder assistant message for streaming
    const placeholderMsg: ChatMessage = { role: 'assistant', content: '' }
    setMessages((prev) => [...prev, placeholderMsg])

    try {
      const history = messages.map(({ role, content }) => ({ role, content }))
      let streamIntent = ''
      let streamSources = 0
      let streamTopics: string[] = []

      await sendMessageStream(msg, studentName, history, {
        onMeta: (meta) => {
          streamIntent = meta.intent
          streamSources = meta.sources_used
          streamTopics = meta.topics_referenced
          // Update the placeholder with metadata
          setMessages((prev) => {
            const updated = [...prev]
            updated[updated.length - 1] = {
              ...updated[updated.length - 1],
              intent: meta.intent,
              sources_used: meta.sources_used,
              topics_referenced: meta.topics_referenced,
            }
            return updated
          })
        },
        onToken: (token) => {
          streamTextRef.current += token
          const currentText = streamTextRef.current
          setMessages((prev) => {
            const updated = [...prev]
            updated[updated.length - 1] = {
              ...updated[updated.length - 1],
              content: currentText,
            }
            return updated
          })
        },
        onDone: (quizData) => {
          setMessages((prev) => {
            const updated = [...prev]
            updated[updated.length - 1] = {
              ...updated[updated.length - 1],
              quiz_data: quizData,
            }
            return updated
          })
        },
        onError: (error) => {
          setMessages((prev) => {
            const updated = [...prev]
            updated[updated.length - 1] = {
              role: 'assistant',
              content: `Sorry, I ran into an error: ${error}. Make sure the backend is running on port 8000.`,
              intent: 'error',
            }
            return updated
          })
        },
      })
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Unknown error'
      setMessages((prev) => {
        const updated = [...prev]
        updated[updated.length - 1] = {
          role: 'assistant',
          content: `Sorry, I ran into an error: ${errMsg}. Make sure the backend is running on port 8000.`,
          intent: 'error',
        }
        return updated
      })
    } finally {
      setLoading(false)
    }
  }

  const clearChat = () => {
    setMessages([])
    localStorage.removeItem(STORAGE_KEY_PREFIX + studentName)
  }

  const isEmpty = messages.length === 0

  return (
    <Box className="flex flex-col h-full">
      {/* Header */}
      <Box className="flex items-center justify-between px-6 py-3" sx={{ borderBottom: '1px solid #e2e8f0', bgcolor: 'white' }}>
        <Box className="flex items-center gap-2">
          <AutoAwesomeIcon sx={{ color: '#2563eb', fontSize: 20 }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#0f172a' }}>Study Chat</Typography>
        </Box>
        <Tooltip title="Clear chat">
          <Chip
            size="small"
            label={`${messages.length} messages`}
            variant="outlined"
            onClick={clearChat}
            sx={{ fontSize: '0.7rem', height: 26, cursor: 'pointer', borderColor: '#cbd5e1' }}
          />
        </Tooltip>
      </Box>

      {/* Messages */}
      <Box className="flex-1 overflow-y-auto" sx={{ bgcolor: '#f8fafc' }}>
        {isEmpty ? (
          <Box className="flex flex-col items-center justify-center h-full px-6">
            <Avatar sx={{ bgcolor: '#eff6ff', width: 64, height: 64, mb: 3 }}>
              <ScienceIcon sx={{ fontSize: 32, color: '#2563eb' }} />
            </Avatar>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a', mb: 1 }}>Ready to study!</Typography>
            <Typography variant="body2" sx={{ color: '#64748b', mb: 4, textAlign: 'center', maxWidth: 400 }}>
              {materialCount > 0
                ? `I have ${materialCount} chunks of study material loaded. Ask me anything!`
                : 'Upload some study materials first, or just ask me science questions.'}
            </Typography>
            <Box className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
              {QUICK_PROMPTS.map((p, i) => (
                <Paper
                  key={i}
                  onClick={() => send(p.text)}
                  elevation={0}
                  sx={{
                    p: 2, cursor: 'pointer', border: '1px solid #e2e8f0', borderRadius: '12px',
                    transition: 'all 0.2s',
                    '&:hover': { borderColor: p.color, transform: 'translateY(-2px)', boxShadow: `0 4px 12px ${p.color}20` },
                  }}
                >
                  <Box className="flex items-center gap-2 mb-1">
                    <Box sx={{ color: p.color }}>{p.icon}</Box>
                  </Box>
                  <Typography variant="body2" sx={{ color: '#334155', fontSize: '0.825rem', fontWeight: 500 }}>{p.text}</Typography>
                </Paper>
              ))}
            </Box>
          </Box>
        ) : (
          <ChatThread messages={messages} loading={loading} studentName={studentName} />
        )}
      </Box>

      {/* Composer */}
      <ChatComposer value={input} onChange={setInput} onSend={() => send()} disabled={loading} />
    </Box>
  )
}
