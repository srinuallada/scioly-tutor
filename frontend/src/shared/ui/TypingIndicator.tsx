import { Box, Avatar } from '@mui/material'
import ScienceIcon from '@mui/icons-material/Science'

export default function TypingIndicator() {
  return (
    <Box className="flex items-start gap-3 px-4 py-3">
      <Avatar sx={{ bgcolor: '#2563eb', width: 32, height: 32 }}>
        <ScienceIcon sx={{ fontSize: 18 }} />
      </Avatar>
      <Box className="flex items-center gap-1.5 pt-2">
        <span className="typing-dot" />
        <span className="typing-dot" />
        <span className="typing-dot" />
      </Box>
    </Box>
  )
}
