import { useState, useEffect } from 'react'
import { Box, Tabs, Tab, Typography, Avatar } from '@mui/material'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import FolderOpenIcon from '@mui/icons-material/FolderOpen'
import QuizIcon from '@mui/icons-material/Quiz'
import InsightsOutlinedIcon from '@mui/icons-material/InsightsOutlined'
import ScienceIcon from '@mui/icons-material/Science'
import ChatPage from './features/chat/pages/ChatPage'
import MaterialsPage from './features/materials/pages/MaterialsPage'
import QuizPage from './features/quiz/pages/QuizPage'
import ProgressPage from './features/progress/pages/ProgressPage'
import { getTopics } from './lib/api/topics'

const TABS = [
  { label: 'Chat', icon: <AutoAwesomeIcon fontSize="small" /> },
  { label: 'Materials', icon: <FolderOpenIcon fontSize="small" /> },
  { label: 'Quiz', icon: <QuizIcon fontSize="small" /> },
  { label: 'Progress', icon: <InsightsOutlinedIcon fontSize="small" /> },
]

export default function App() {
  const [tab, setTab] = useState(0)
  const [materialCount, setMaterialCount] = useState(0)
  const studentName = 'default'

  const refreshMaterials = () => {
    getTopics()
      .then((t) => setMaterialCount(t.stats.total_chunks))
      .catch(() => {})
  }

  useEffect(() => {
    refreshMaterials()
  }, [])

  return (
    <Box className="flex h-screen">
      {/* Sidebar */}
      <Box
        className="flex flex-col shrink-0"
        sx={{
          width: 220,
          bgcolor: 'white',
          borderRight: '1px solid #e2e8f0',
        }}
      >
        {/* Logo */}
        <Box className="flex items-center gap-2 px-5 py-4" sx={{ borderBottom: '1px solid #e2e8f0' }}>
          <Avatar sx={{ bgcolor: '#eff6ff', width: 36, height: 36 }}>
            <ScienceIcon sx={{ fontSize: 20, color: '#2563eb' }} />
          </Avatar>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '1rem' }}>
            SciOly Tutor
          </Typography>
        </Box>

        {/* Nav tabs */}
        <Tabs
          orientation="vertical"
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{
            mt: 1,
            '& .MuiTab-root': {
              justifyContent: 'flex-start',
              textTransform: 'none',
              minHeight: 44,
              px: 3,
              fontSize: '0.875rem',
              fontWeight: 500,
              color: '#64748b',
              '&.Mui-selected': { color: '#2563eb', fontWeight: 600 },
            },
            '& .MuiTabs-indicator': {
              left: 0,
              right: 'auto',
              width: 3,
              borderRadius: '0 3px 3px 0',
            },
          }}
        >
          {TABS.map((t, i) => (
            <Tab key={i} label={t.label} icon={t.icon} iconPosition="start" />
          ))}
        </Tabs>
      </Box>

      {/* Main content */}
      <Box className="flex-1 flex flex-col overflow-hidden">
        {tab === 0 && <ChatPage studentName={studentName} materialCount={materialCount} />}
        {tab === 1 && <MaterialsPage onUploadComplete={refreshMaterials} />}
        {tab === 2 && <QuizPage />}
        {tab === 3 && <ProgressPage studentName={studentName} />}
      </Box>
    </Box>
  )
}
