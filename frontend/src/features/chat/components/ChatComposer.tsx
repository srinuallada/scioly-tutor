import { useRef, useState } from 'react'
import { Box, TextField, IconButton, Typography, useMediaQuery, Fade } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'

interface Props {
  value: string
  onChange: (val: string) => void
  onSend: () => void
  disabled: boolean
}

export default function ChatComposer({ value, onChange, onSend, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [focused, setFocused] = useState(false)
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSend()
    }
  }

  return (
    <Box
      className="px-4 py-3"
      sx={{
        borderTop: 'none',
        bgcolor: 'transparent',
        px: isMobile ? 2 : 4,
        py: isMobile ? 2 : 3,
        pb: `calc(${isMobile ? '8px' : '12px'} + env(safe-area-inset-bottom, 0px))`,
        position: 'sticky',
        bottom: 0,
        zIndex: 2,
      }}
    >
      <Box
        className="flex items-end gap-2 max-w-3xl mx-auto"
        sx={{
          width: '100%',
          bgcolor: 'white',
          borderRadius: '18px',
          px: 2,
          py: 1.5,
          boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)',
          border: '1px solid rgba(226,232,240,0.9)',
        }}
      >
        <TextField
          inputRef={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Ask a question, request a quiz, or explore topics..."
          multiline
          minRows={isMobile ? 3 : 1}
          maxRows={isMobile ? 3 : 4}
          fullWidth
          variant="outlined"
          size="small"
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '14px',
              bgcolor: '#f8fafc',
              fontSize: '0.9rem',
              lineHeight: 1.5,
              '& fieldset': { borderColor: 'transparent' },
              '&:hover fieldset': { borderColor: '#dbeafe' },
              '&.Mui-focused fieldset': { borderColor: '#93c5fd', borderWidth: 1 },
            },
          }}
        />
        <IconButton
          onClick={onSend}
          disabled={!value.trim() || disabled}
          sx={{
            bgcolor: value.trim() ? '#2563eb' : '#e2e8f0',
            color: 'white',
            width: 40,
            height: 40,
            flexShrink: 0,
            '&:hover': { bgcolor: '#1d4ed8' },
            '&.Mui-disabled': { bgcolor: '#e2e8f0', color: '#94a3b8' },
            transition: 'all 0.2s',
          }}
        >
          <ArrowUpwardIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>
      <Fade in={focused}>
        <Typography
          variant="caption"
          sx={{ display: 'block', textAlign: 'center', mt: 1, color: '#94a3b8', fontSize: '0.65rem' }}
        >
          Enter to send, Shift+Enter for new line
        </Typography>
      </Fade>
    </Box>
  )
}
