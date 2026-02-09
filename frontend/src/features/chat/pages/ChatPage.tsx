import { useState } from 'react'
import { Box, Typography, Avatar, Chip, Paper, Tooltip } from '@mui/material'
import ScienceIcon from '@mui/icons-material/Science'
import QuizIcon from '@mui/icons-material/Quiz'
import SummarizeIcon from '@mui/icons-material/Summarize'
import PsychologyIcon from '@mui/icons-material/Psychology'
import SchoolIcon from '@mui/icons-material/School'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import ChatThread from '../components/ChatThread'
import ChatComposer from '../components/ChatComposer'
import { sendMessage } from '../../../lib/api/chat'
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

export default function ChatPage({ studentName, materialCount }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const send = async (text?: string) => {
    const msg = text || input.trim()
    if (!msg || loading) return

    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: msg }])
    setLoading(true)

    try {
      const history = messages.map(({ role, content }) => ({ role, content }))
      const res = await sendMessage(msg, studentName, history)
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: res.response,
          intent: res.intent,
          sources_used: res.sources_used,
          topics_referenced: res.topics_referenced,
          quiz_data: res.quiz_data,
        },
      ])
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Unknown error'
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Sorry, I ran into an error: ${errMsg}. Make sure the backend is running on port 8000.`, intent: 'error' },
      ])
    } finally {
      setLoading(false)
    }
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
            onClick={() => setMessages([])}
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
          <ChatThread messages={messages} loading={loading} />
        )}
      </Box>

      {/* Composer */}
      <ChatComposer value={input} onChange={setInput} onSend={() => send()} disabled={loading} />
    </Box>
  )
}
