import { Box, Paper, Typography, Chip, Divider, LinearProgress } from '@mui/material'
import EventRepeatIcon from '@mui/icons-material/EventRepeat'
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment'
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'
import ScheduleIcon from '@mui/icons-material/Schedule'
import StatCard from '../../../shared/ui/StatCard'
import type { StudyPlanResponse } from '../../../shared/types'

interface Props {
  plan: StudyPlanResponse
}

function daysUntil(dateStr: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(dateStr)
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

export default function StudyPlan({ plan }: Props) {
  const { due_for_review: due, upcoming, mastered_count: mastered, study_days_30d: studyDays } = plan

  return (
    <Box className="space-y-4">
      {/* Stats */}
      <Box className="flex flex-wrap gap-4">
        <StatCard
          icon={<LocalFireDepartmentIcon sx={{ fontSize: 18, color: '#f97316' }} />}
          label="Study Days (30d)"
          value={studyDays}
          subtitle={studyDays >= 7 ? 'Great consistency!' : 'Keep practicing!'}
          color="#f97316"
        />
        <StatCard
          icon={<EmojiEventsIcon sx={{ fontSize: 18, color: '#8b5cf6' }} />}
          label="Mastered Topics"
          value={mastered}
          subtitle="14+ day interval"
          color="#8b5cf6"
        />
        <StatCard
          icon={<EventRepeatIcon sx={{ fontSize: 18, color: '#dc2626' }} />}
          label="Due for Review"
          value={due.length}
          subtitle={due.length > 0 ? 'Practice these now!' : 'All caught up!'}
          color="#dc2626"
        />
      </Box>

      {/* Due for review */}
      {due.length > 0 && (
        <Paper elevation={0} sx={{ border: '1px solid #fecaca', borderRadius: '12px', overflow: 'hidden' }}>
          <Box className="px-4 py-3 flex items-center gap-2" sx={{ bgcolor: '#fef2f2' }}>
            <EventRepeatIcon sx={{ fontSize: 18, color: '#dc2626' }} />
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#991b1b' }}>Due for Review ({due.length})</Typography>
          </Box>
          <Divider />
          {due.map((item, i) => {
            const overdue = -daysUntil(item.next_review)
            return (
              <Box key={i} className="flex items-center gap-3 px-4 py-2.5" sx={{ borderBottom: '1px solid #fef2f2' }}>
                <Box className="flex-1 min-w-0">
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', fontSize: '0.85rem' }}>{item.topic}</Typography>
                  <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.7rem' }}>
                    {overdue > 0 ? `${overdue} day${overdue > 1 ? 's' : ''} overdue` : 'Due today'}
                    {item.last_reviewed ? ` · Last: ${item.last_reviewed}` : ''}
                  </Typography>
                </Box>
                <Chip
                  size="small"
                  label={`${item.repetitions} rep${item.repetitions !== 1 ? 's' : ''}`}
                  sx={{ height: 22, fontSize: '0.65rem', bgcolor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}
                />
              </Box>
            )
          })}
        </Paper>
      )}

      {/* Upcoming reviews */}
      {upcoming.length > 0 && (
        <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
          <Box className="px-4 py-3 flex items-center gap-2" sx={{ bgcolor: '#f8fafc' }}>
            <ScheduleIcon sx={{ fontSize: 18, color: '#64748b' }} />
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>Upcoming Reviews</Typography>
          </Box>
          <Divider />
          {upcoming.map((item, i) => {
            const days = daysUntil(item.next_review)
            const maxDays = 30
            const progress = Math.min(100, ((maxDays - days) / maxDays) * 100)
            return (
              <Box key={i} className="flex items-center gap-3 px-4 py-2.5" sx={{ borderBottom: '1px solid #f1f5f9' }}>
                <Box className="flex-1 min-w-0">
                  <Typography variant="body2" sx={{ fontWeight: 500, color: '#334155', fontSize: '0.85rem' }}>{item.topic}</Typography>
                  <LinearProgress
                    variant="determinate"
                    value={progress}
                    sx={{ height: 4, borderRadius: 2, mt: 0.5, bgcolor: '#f1f5f9', '& .MuiLinearProgress-bar': { bgcolor: '#93c5fd', borderRadius: 2 } }}
                  />
                </Box>
                <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.7rem', flexShrink: 0 }}>
                  in {days}d
                </Typography>
              </Box>
            )
          })}
        </Paper>
      )}

      {due.length === 0 && upcoming.length === 0 && (
        <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: '12px', p: 4, textAlign: 'center' }}>
          <ScheduleIcon sx={{ fontSize: 36, color: '#cbd5e1', mb: 1 }} />
          <Typography variant="body2" sx={{ color: '#94a3b8' }}>
            Take some quizzes to build your review schedule!
          </Typography>
        </Paper>
      )}
    </Box>
  )
}
