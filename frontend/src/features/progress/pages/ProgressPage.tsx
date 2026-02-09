import { useState, useEffect } from 'react'
import { Box, Typography, CircularProgress, Alert, Tabs, Tab } from '@mui/material'
import InsightsOutlinedIcon from '@mui/icons-material/InsightsOutlined'
import EventRepeatIcon from '@mui/icons-material/EventRepeat'
import ProgressDashboard from '../components/ProgressDashboard'
import StudyPlan from '../components/StudyPlan'
import { getProgress } from '../../../lib/api/progress'
import { getStudyPlan } from '../../../lib/api/progress'
import type { ProgressResponse, StudyPlanResponse } from '../../../shared/types'

interface Props {
  studentName: string
}

export default function ProgressPage({ studentName }: Props) {
  const [data, setData] = useState<ProgressResponse | null>(null)
  const [plan, setPlan] = useState<StudyPlanResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState(0)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      getProgress(studentName),
      getStudyPlan(studentName),
    ])
      .then(([progress, studyPlan]) => {
        setData(progress)
        setPlan(studyPlan)
        setError(null)
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed'))
      .finally(() => setLoading(false))
  }, [studentName])

  if (loading) {
    return <Box className="flex items-center justify-center h-full"><CircularProgress /></Box>
  }

  const hasQuizData = data && data.overall.total_questions > 0
  const hasPlanData = plan && (plan.due_for_review.length > 0 || plan.upcoming.length > 0 || plan.mastered_count > 0 || plan.study_days_30d > 0)

  return (
    <Box className="flex flex-col h-full">
      <Box className="flex items-center gap-2 px-6 py-3" sx={{ borderBottom: '1px solid #e2e8f0', bgcolor: 'white' }}>
        <InsightsOutlinedIcon sx={{ color: '#2563eb', fontSize: 20 }} />
        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#0f172a' }}>Study Progress</Typography>
      </Box>

      {(hasQuizData || hasPlanData) && (
        <Box sx={{ borderBottom: '1px solid #e2e8f0', bgcolor: 'white', px: 3 }}>
          <Tabs
            value={activeTab}
            onChange={(_, v) => setActiveTab(v)}
            sx={{
              minHeight: 40,
              '& .MuiTab-root': { textTransform: 'none', minHeight: 40, fontWeight: 500, fontSize: '0.85rem' },
              '& .MuiTabs-indicator': { height: 2.5, borderRadius: '2px 2px 0 0' },
            }}
          >
            <Tab label="Performance" icon={<InsightsOutlinedIcon sx={{ fontSize: 16 }} />} iconPosition="start" />
            <Tab
              label={`Review Schedule${plan && plan.due_for_review.length > 0 ? ` (${plan.due_for_review.length})` : ''}`}
              icon={<EventRepeatIcon sx={{ fontSize: 16 }} />}
              iconPosition="start"
            />
          </Tabs>
        </Box>
      )}

      <Box className="flex-1 overflow-y-auto p-6">
        <Box className="max-w-3xl mx-auto">
          {error && <Alert severity="info" sx={{ borderRadius: '12px' }}>No progress data yet. Start a quiz to track your performance!</Alert>}

          {!hasQuizData && !hasPlanData && !error && (
            <Box className="text-center py-12">
              <InsightsOutlinedIcon sx={{ fontSize: 48, color: '#cbd5e1', mb: 2 }} />
              <Typography variant="h6" sx={{ color: '#64748b', fontWeight: 600, mb: 1 }}>No quiz data yet</Typography>
              <Typography variant="body2" sx={{ color: '#94a3b8' }}>Start a quiz in the Quiz tab to track your progress here.</Typography>
            </Box>
          )}

          {activeTab === 0 && hasQuizData && <ProgressDashboard data={data} />}
          {activeTab === 1 && plan && <StudyPlan plan={plan} />}
        </Box>
      </Box>
    </Box>
  )
}
