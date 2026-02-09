import { Box, Paper, Chip, LinearProgress, Alert, Divider, Typography } from '@mui/material'
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import StatCard from '../../../shared/ui/StatCard'
import type { ProgressResponse, TopicScore } from '../../../shared/types'

function TopicRow({ topic, index }: { topic: TopicScore; index: number }) {
  const pct = topic.accuracy * 100
  const color = pct >= 80 ? '#16a34a' : pct >= 60 ? '#f59e0b' : '#dc2626'
  return (
    <Box className="flex items-center gap-4 py-3 px-4" sx={{ borderBottom: '1px solid #f1f5f9' }}>
      <Typography variant="caption" sx={{ color: '#94a3b8', width: 20, textAlign: 'center', fontWeight: 600 }}>{index + 1}</Typography>
      <Box className="flex-1 min-w-0">
        <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', fontSize: '0.85rem', mb: 0.5 }}>{topic.topic}</Typography>
        <LinearProgress variant="determinate" value={pct} sx={{ height: 6, borderRadius: 3, bgcolor: '#f1f5f9', '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 3 } }} />
      </Box>
      <Box className="text-right flex-shrink-0">
        <Typography variant="body2" sx={{ fontWeight: 700, color, fontSize: '0.9rem' }}>{pct.toFixed(0)}%</Typography>
        <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.65rem' }}>{topic.correct}/{topic.total}</Typography>
      </Box>
    </Box>
  )
}

interface Props {
  data: ProgressResponse
}

export default function ProgressDashboard({ data }: Props) {
  const { overall, by_topic: byTopic, weak_areas: weakAreas, recent_activity: recentActivity } = data
  const accuracy = overall.accuracy * 100
  const chartData = byTopic.map((t) => ({ name: t.topic.length > 15 ? t.topic.slice(0, 15) + '...' : t.topic, accuracy: Math.round(t.accuracy * 100) }))
  const barColors = chartData.map((d) => d.accuracy >= 80 ? '#16a34a' : d.accuracy >= 60 ? '#f59e0b' : '#dc2626')

  return (
    <Box className="space-y-6">
      {/* Stats row */}
      <Box className="flex flex-wrap gap-4">
        <StatCard icon={<EmojiEventsIcon sx={{ fontSize: 18, color: '#2563eb' }} />} label="Overall Accuracy" value={overall.total_questions > 0 ? `${accuracy.toFixed(0)}%` : '--'} subtitle={overall.total_questions > 0 ? `${overall.correct} of ${overall.total_questions} correct` : 'No quizzes yet'} color="#2563eb" />
        <StatCard icon={<TrendingUpIcon sx={{ fontSize: 18, color: '#16a34a' }} />} label="Questions Answered" value={overall.total_questions} subtitle={`Across ${byTopic.length} topics`} color="#16a34a" />
        <StatCard icon={<WarningAmberIcon sx={{ fontSize: 18, color: '#f59e0b' }} />} label="Weak Areas" value={weakAreas.length} subtitle={weakAreas.length > 0 ? 'Below 70% accuracy' : 'Great job!'} color="#f59e0b" />
      </Box>

      {weakAreas.length > 0 && (
        <Alert severity="warning" sx={{ borderRadius: '12px' }} icon={<WarningAmberIcon />}>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Focus on these topics:</Typography>
          <Box className="flex flex-wrap gap-1.5 mt-1">
            {weakAreas.map((a, i) => <Chip key={i} label={a} size="small" sx={{ bgcolor: '#fef3c7', color: '#92400e', fontWeight: 500, fontSize: '0.75rem', border: '1px solid #fde68a' }} />)}
          </Box>
        </Alert>
      )}

      {chartData.length > 0 && (
        <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
          <Box className="px-4 py-3" sx={{ bgcolor: '#f8fafc' }}><Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>Accuracy by Topic</Typography></Box>
          <Divider />
          <Box className="p-4" sx={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} tickFormatter={(v: number) => `${v}%`} />
                <Tooltip formatter={(v: number) => [`${v}%`, 'Accuracy']} contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.8rem' }} />
                <Bar dataKey="accuracy" radius={[6, 6, 0, 0]} barSize={32}>{chartData.map((_, i) => <Cell key={i} fill={barColors[i]} />)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Paper>
      )}

      {byTopic.length > 0 && (
        <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
          <Box className="px-4 py-3" sx={{ bgcolor: '#f8fafc' }}><Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>Topic Breakdown</Typography></Box>
          <Divider />
          {byTopic.map((t, i) => <TopicRow key={i} topic={t} index={i} />)}
        </Paper>
      )}

      {recentActivity.length > 0 && (
        <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
          <Box className="px-4 py-3" sx={{ bgcolor: '#f8fafc' }}><Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>Recent Activity</Typography></Box>
          <Divider />
          {recentActivity.slice(0, 10).map((item, i) => (
            <Box key={i} className="flex items-center gap-3 px-4 py-2.5" sx={{ borderBottom: '1px solid #f1f5f9' }}>
              {item.is_correct ? <CheckCircleOutlineIcon sx={{ fontSize: 18, color: '#16a34a' }} /> : <WarningAmberIcon sx={{ fontSize: 18, color: '#dc2626' }} />}
              <Box className="flex-1 min-w-0"><Typography variant="body2" sx={{ fontSize: '0.8rem', color: '#334155' }} noWrap>{item.question}</Typography></Box>
              <Chip size="small" label={item.topic} sx={{ height: 20, fontSize: '0.65rem', bgcolor: '#f1f5f9', color: '#64748b', flexShrink: 0 }} />
            </Box>
          ))}
        </Paper>
      )}
    </Box>
  )
}
