import { Box, Typography, Chip, Avatar, Fade } from '@mui/material'
import ScienceIcon from '@mui/icons-material/Science'
import ReactMarkdown from 'react-markdown'
import type { ChatMessage } from '../types'

interface Props {
  message: ChatMessage
}

export default function MessageBubble({ message }: Props) {
  const isUser = message.role === 'user'

  return (
    <Fade in timeout={300}>
      <Box className={`flex items-start gap-3 px-4 py-3 ${isUser ? 'flex-row-reverse' : ''}`}>
        {!isUser && (
          <Avatar sx={{ bgcolor: '#2563eb', width: 32, height: 32, mt: 0.5 }}>
            <ScienceIcon sx={{ fontSize: 18 }} />
          </Avatar>
        )}
        <Box
          className={`max-w-[75%] ${isUser ? 'ml-auto' : ''}`}
          sx={{
            ...(isUser
              ? {
                  bgcolor: '#2563eb',
                  color: 'white',
                  borderRadius: '18px 18px 4px 18px',
                  px: 2.5,
                  py: 1.5,
                }
              : {
                  bgcolor: 'white',
                  borderRadius: '18px 18px 18px 4px',
                  px: 2.5,
                  py: 1.5,
                  border: '1px solid #e2e8f0',
                }),
          }}
        >
          {isUser ? (
            <Typography sx={{ fontSize: '0.9rem', lineHeight: 1.6 }}>
              {message.content}
            </Typography>
          ) : (
            <Box className="markdown-content" sx={{ fontSize: '0.9rem' }}>
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </Box>
          )}
          {!isUser && message.intent && (
            <Box className="mt-2 flex items-center gap-2">
              <Chip
                size="small"
                label={message.intent}
                sx={{
                  height: 22,
                  fontSize: '0.65rem',
                  fontWeight: 600,
                  bgcolor: '#eff6ff',
                  color: '#2563eb',
                  border: '1px solid #bfdbfe',
                }}
              />
              {(message.sources_used ?? 0) > 0 && (
                <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.65rem' }}>
                  {message.sources_used} sources
                </Typography>
              )}
            </Box>
          )}
        </Box>
      </Box>
    </Fade>
  )
}
