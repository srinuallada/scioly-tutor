import { useState, useEffect } from 'react'
import { Box, Typography, CircularProgress, Alert } from '@mui/material'
import InsightsOutlinedIcon from '@mui/icons-material/InsightsOutlined'
import ProgressDashboard from '../components/ProgressDashboard'
import { getProgress } from '../../../lib/api/progress'
import type { ProgressResponse } from '../../../shared/types'

interface Props {
  studentName: string
}

export default function ProgressPage({ studentName }: Props) {
  const [data, setData] = useState<ProgressResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    getProgress(studentName)
      .then((d) => { setData(d); setError(null) })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed'))
      .finally(() => setLoading(false))
  }, [studentName])

  if (loading) {
    return <Box className="flex items-center justify-center h-full"><CircularProgress /></Box>
  }

  return (
    <Box className="flex flex-col h-full">
      <Box className="flex items-center gap-2 px-6 py-3" sx={{ borderBottom: '1px solid #e2e8f0', bgcolor: 'white' }}>
        <InsightsOutlinedIcon sx={{ color: '#2563eb', fontSize: 20 }} />
        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#0f172a' }}>Study Progress</Typography>
      </Box>
      <Box className="flex-1 overflow-y-auto p-6">
        <Box className="max-w-3xl mx-auto">
          {error && <Alert severity="info" sx={{ borderRadius: '12px' }}>No progress data yet. Start a quiz to track your performance!</Alert>}
          {data && data.overall.total_questions === 0 && !error && (
            <Box className="text-center py-12">
              <InsightsOutlinedIcon sx={{ fontSize: 48, color: '#cbd5e1', mb: 2 }} />
              <Typography variant="h6" sx={{ color: '#64748b', fontWeight: 600, mb: 1 }}>No quiz data yet</Typography>
              <Typography variant="body2" sx={{ color: '#94a3b8' }}>Start a quiz in the Chat tab to track your progress here.</Typography>
            </Box>
          )}
          {data && data.overall.total_questions > 0 && <ProgressDashboard data={data} />}
        </Box>
      </Box>
    </Box>
  )
}
