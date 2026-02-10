import { Box, Avatar, Typography } from '@mui/material'
import ScienceIcon from '@mui/icons-material/Science'

export default function TypingIndicator() {
  return (
    <Box className="flex items-start gap-3 px-4 py-3">
      <Avatar sx={{ bgcolor: '#2563eb', width: 32, height: 32 }}>
        <ScienceIcon sx={{ fontSize: 18 }} />
      </Avatar>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          bgcolor: 'white',
          border: '1px solid #e2e8f0',
          borderRadius: '18px 18px 18px 4px',
          px: 2.5,
          py: 1.5,
        }}
      >
        <Box className="flex items-center gap-1.5">
          <span className="typing-dot" />
          <span className="typing-dot" />
          <span className="typing-dot" />
        </Box>
        <Typography sx={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500 }}>
          Thinking...
        </Typography>
      </Box>
    </Box>
  )
}
