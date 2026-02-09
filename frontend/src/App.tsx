import { useState, useEffect } from 'react'
import {
  Box, Tabs, Tab, Typography, Avatar, TextField, IconButton, Tooltip,
} from '@mui/material'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import FolderOpenIcon from '@mui/icons-material/FolderOpen'
import QuizIcon from '@mui/icons-material/Quiz'
import InsightsOutlinedIcon from '@mui/icons-material/InsightsOutlined'
import ScienceIcon from '@mui/icons-material/Science'
import PersonOutlineIcon from '@mui/icons-material/PersonOutline'
import EditIcon from '@mui/icons-material/Edit'
import CheckIcon from '@mui/icons-material/Check'
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

const STUDENT_KEY = 'scioly-student-name'

function loadStudentName(): string {
  return localStorage.getItem(STUDENT_KEY) || 'default'
}

export default function App() {
  const [tab, setTab] = useState(0)
  const [materialCount, setMaterialCount] = useState(0)
  const [studentName, setStudentName] = useState(loadStudentName)
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState(studentName)

  const refreshMaterials = () => {
    getTopics()
      .then((t) => setMaterialCount(t.stats.total_chunks))
      .catch(() => {})
  }

  useEffect(() => {
    refreshMaterials()
  }, [])

  const saveName = () => {
    const name = nameInput.trim().replace(/[^a-zA-Z0-9_-]/g, '') || 'default'
    setStudentName(name)
    setNameInput(name)
    localStorage.setItem(STUDENT_KEY, name)
    setEditingName(false)
  }

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

        {/* Spacer */}
        <Box className="flex-1" />

        {/* Student name */}
        <Box className="px-4 py-3" sx={{ borderTop: '1px solid #e2e8f0' }}>
          <Box className="flex items-center gap-1 mb-1">
            <PersonOutlineIcon sx={{ fontSize: 16, color: '#94a3b8' }} />
            <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Student
            </Typography>
          </Box>
          {editingName ? (
            <Box className="flex items-center gap-1">
              <TextField
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setEditingName(false) }}
                size="small"
                autoFocus
                variant="outlined"
                sx={{
                  flex: 1,
                  '& .MuiOutlinedInput-root': { height: 32, fontSize: '0.8rem', borderRadius: '8px' },
                }}
              />
              <IconButton size="small" onClick={saveName} sx={{ color: '#16a34a' }}>
                <CheckIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Box>
          ) : (
            <Box className="flex items-center justify-between">
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', fontSize: '0.85rem' }}>
                {studentName === 'default' ? 'Default' : studentName}
              </Typography>
              <Tooltip title="Change student">
                <IconButton size="small" onClick={() => { setNameInput(studentName); setEditingName(true) }}>
                  <EditIcon sx={{ fontSize: 14, color: '#94a3b8' }} />
                </IconButton>
              </Tooltip>
            </Box>
          )}
        </Box>
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
