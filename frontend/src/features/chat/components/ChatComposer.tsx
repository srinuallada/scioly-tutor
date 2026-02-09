import { useRef } from 'react'
import { Box, TextField, IconButton, Typography } from '@mui/material'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'

interface Props {
  value: string
  onChange: (val: string) => void
  onSend: () => void
  disabled: boolean
}

export default function ChatComposer({ value, onChange, onSend, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSend()
    }
  }

  return (
    <Box className="px-4 py-3" sx={{ borderTop: '1px solid #e2e8f0', bgcolor: 'white' }}>
      <Box className="flex items-end gap-2 max-w-3xl mx-auto">
        <TextField
          inputRef={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question, request a quiz, or explore topics..."
          multiline
          maxRows={4}
          fullWidth
          variant="outlined"
          size="small"
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '14px',
              bgcolor: '#f8fafc',
              fontSize: '0.9rem',
              '& fieldset': { borderColor: '#e2e8f0' },
              '&:hover fieldset': { borderColor: '#93c5fd' },
              '&.Mui-focused fieldset': { borderColor: '#2563eb', borderWidth: 1.5 },
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
      <Typography
        variant="caption"
        sx={{ display: 'block', textAlign: 'center', mt: 1, color: '#94a3b8', fontSize: '0.65rem' }}
      >
        Powered by Gemini 2.5 Flash &middot; Press Enter to send
      </Typography>
    </Box>
  )
}
