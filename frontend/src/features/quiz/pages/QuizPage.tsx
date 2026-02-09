import { Box, Typography, Avatar } from '@mui/material'
import QuizIcon from '@mui/icons-material/Quiz'

export default function QuizPage() {
  return (
    <Box className="flex flex-col h-full">
      <Box className="flex items-center gap-2 px-6 py-3" sx={{ borderBottom: '1px solid #e2e8f0', bgcolor: 'white' }}>
        <QuizIcon sx={{ color: '#2563eb', fontSize: 20 }} />
        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#0f172a' }}>Quiz Mode</Typography>
      </Box>

      <Box className="flex-1 flex flex-col items-center justify-center px-6">
        <Avatar sx={{ bgcolor: '#eff6ff', width: 64, height: 64, mb: 3 }}>
          <QuizIcon sx={{ fontSize: 32, color: '#2563eb' }} />
        </Avatar>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a', mb: 1 }}>Quiz Mode</Typography>
        <Typography variant="body2" sx={{ color: '#64748b', textAlign: 'center', maxWidth: 400 }}>
          Ask for a quiz in the Chat tab and interactive quiz cards will appear here.
          Try typing "Quiz me on the key concepts!" in the chat.
        </Typography>
      </Box>
    </Box>
  )
}
