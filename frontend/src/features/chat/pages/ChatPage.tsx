import { useState, useEffect, useRef } from 'react'
import {
  Box, Typography, Avatar, Paper, Tooltip, Button, Dialog, DialogTitle,
  DialogContent, DialogContentText, DialogActions, ButtonBase,
} from '@mui/material'
import ScienceIcon from '@mui/icons-material/Science'
import QuizIcon from '@mui/icons-material/Quiz'
import SummarizeIcon from '@mui/icons-material/Summarize'
import PsychologyIcon from '@mui/icons-material/Psychology'
import SchoolIcon from '@mui/icons-material/School'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
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
  userEmail?: string
}

const STORAGE_KEY_PREFIX = 'scioly-chat-'

function chatStorageKey(userEmail?: string): string {
  return STORAGE_KEY_PREFIX + (userEmail || 'default')
}

function loadMessages(userEmail?: string): ChatMessage[] {
  try {
    const raw = localStorage.getItem(chatStorageKey(userEmail))
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export default function ChatPage({ studentName, materialCount, userEmail }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => loadMessages(userEmail))
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [clearOpen, setClearOpen] = useState(false)
  const streamTextRef = useRef('')
  const streamBufferRef = useRef('')
  const flushTimerRef = useRef<number | null>(null)

  // Reload messages when user changes
  useEffect(() => {
    setMessages(loadMessages(userEmail))
  }, [userEmail])

  useEffect(() => {
    localStorage.setItem(chatStorageKey(userEmail), JSON.stringify(messages))
  }, [messages, userEmail])

  useEffect(() => {
    const handler = (event: Event) => {
      const custom = event as CustomEvent<{ userEmail?: string }>
      if (custom.detail?.userEmail && custom.detail.userEmail !== userEmail) return
      setMessages([])
    }
    window.addEventListener('scioly-clear-chat', handler as EventListener)
    return () => window.removeEventListener('scioly-clear-chat', handler as EventListener)
  }, [userEmail])

  const send = async (text?: string) => {
    const msg = text || input.trim()
    if (!msg || loading) return

    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: msg }])
    setLoading(true)
    streamTextRef.current = ''
    streamBufferRef.current = ''
    if (flushTimerRef.current) {
      window.clearTimeout(flushTimerRef.current)
      flushTimerRef.current = null
    }

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
              source_details: meta.source_details,
            }
            return updated
          })
        },
        onToken: (token) => {
          streamTextRef.current += token
          streamBufferRef.current += token
          if (flushTimerRef.current) return
          flushTimerRef.current = window.setTimeout(() => {
            const currentText = streamTextRef.current
            setMessages((prev) => {
              const updated = [...prev]
              updated[updated.length - 1] = {
                ...updated[updated.length - 1],
                content: currentText,
              }
              return updated
            })
            streamBufferRef.current = ''
            flushTimerRef.current = null
          }, 80)
        },
        onDone: (quizData) => {
          if (flushTimerRef.current) {
            window.clearTimeout(flushTimerRef.current)
            flushTimerRef.current = null
          }
          if (streamBufferRef.current) {
            const currentText = streamTextRef.current
            setMessages((prev) => {
              const updated = [...prev]
              updated[updated.length - 1] = {
                ...updated[updated.length - 1],
                content: currentText,
              }
              return updated
            })
            streamBufferRef.current = ''
          }
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
          const authError = error.toLowerCase().includes('unauthorized') || error.includes('401')
          const message = authError
            ? 'Your session expired. Please sign in again.'
            : `Sorry, I ran into an error: ${error}. If this keeps happening, check your connection or the backend.`
          setMessages((prev) => {
            const updated = [...prev]
            updated[updated.length - 1] = {
              role: 'assistant',
              content: message,
              intent: 'error',
            }
            return updated
          })
        },
      })
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Unknown error'
      const authError = errMsg.toLowerCase().includes('unauthorized') || errMsg.includes('401')
      const message = authError
        ? 'Your session expired. Please sign in again.'
        : `Sorry, I ran into an error: ${errMsg}. If this keeps happening, check your connection or the backend.`
      setMessages((prev) => {
        const updated = [...prev]
        updated[updated.length - 1] = {
          role: 'assistant',
          content: message,
          intent: 'error',
        }
        return updated
      })
    } finally {
      if (flushTimerRef.current) {
        window.clearTimeout(flushTimerRef.current)
        flushTimerRef.current = null
      }
      streamBufferRef.current = ''
      setLoading(false)
    }
  }

  const clearChat = () => {
    setMessages([])
    localStorage.removeItem(chatStorageKey(userEmail))
  }

  const isEmpty = messages.length === 0

  return (
    <Box className="flex flex-col h-full" sx={{ minHeight: 0 }}>
      {/* Header */}
      <Box className="flex items-center justify-between px-6 py-3" sx={{ bgcolor: 'white' }}>
        <Box className="flex items-center gap-2">
          <AutoAwesomeIcon sx={{ color: '#2563eb', fontSize: 20 }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#0f172a' }}>Study Chat</Typography>
        </Box>
        <Tooltip title="Clear chat history">
          <Button
            size="small"
            variant="outlined"
            startIcon={<DeleteOutlineIcon />}
            onClick={() => setClearOpen(true)}
            sx={{ fontSize: '0.7rem', height: 28, borderColor: '#cbd5e1', textTransform: 'none' }}
          >
            Clear ({messages.length})
          </Button>
        </Tooltip>
      </Box>

      {/* Messages */}
      <Box
        className="flex-1 overflow-hidden"
        sx={{
          bgcolor: 'transparent',
          minHeight: 0,
          background: 'radial-gradient(circle at 30% 20%, #f8fafc 0%, #ffffff 55%)',
        }}
      >
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
                <ButtonBase
                  key={i}
                  onClick={() => send(p.text)}
                  component={Paper}
                  elevation={0}
                  role="button"
                  sx={{
                    p: 2, cursor: 'pointer', border: '1px solid #e2e8f0', borderRadius: '12px',
                    borderLeft: `3px solid ${p.color}`,
                    transition: 'all 0.2s',
                    display: 'flex', alignItems: 'center', gap: 1.5, textAlign: 'left',
                    boxShadow: '0 1px 3px rgba(15,23,42,0.04)',
                    '&:hover': { borderColor: p.color, transform: 'translateY(-2px)', boxShadow: `0 4px 12px ${p.color}20` },
                    '&:hover .arrow-icon': { opacity: 1, transform: 'translateX(0)' },
                  }}
                >
                  <Box sx={{ color: p.color, flexShrink: 0 }}>{p.icon}</Box>
                  <Typography variant="body2" sx={{ color: '#334155', fontSize: '0.825rem', fontWeight: 500, flex: 1 }}>{p.text}</Typography>
                  <ArrowForwardIcon className="arrow-icon" sx={{ fontSize: 16, color: p.color, opacity: 0, transform: 'translateX(-4px)', transition: 'all 0.2s' }} />
                </ButtonBase>
              ))}
            </Box>
          </Box>
        ) : (
          <ChatThread messages={messages} loading={loading} studentName={studentName} />
        )}
      </Box>

      {/* Composer */}
      <ChatComposer value={input} onChange={setInput} onSend={() => send()} disabled={loading} />

      <Dialog open={clearOpen} onClose={() => setClearOpen(false)}>
        <DialogTitle>Clear chat history?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will remove all messages for this student. This cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClearOpen(false)} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button
            onClick={() => { clearChat(); setClearOpen(false) }}
            variant="contained"
            color="error"
            sx={{ textTransform: 'none' }}
          >
            Clear Chat
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
