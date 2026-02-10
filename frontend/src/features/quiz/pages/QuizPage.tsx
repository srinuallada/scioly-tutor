import { useState, useEffect } from 'react'
import {
  Box, Typography, Button, Select, MenuItem, FormControl, InputLabel,
  CircularProgress, Alert, Paper, Chip, Divider, LinearProgress,
} from '@mui/material'
import QuizIcon from '@mui/icons-material/Quiz'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import SkipNextIcon from '@mui/icons-material/SkipNext'
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'
import QuizCard from '../components/QuizCard'
import { generateQuiz, submitQuiz } from '../../../lib/api/quiz'
import { getTopics } from '../../../lib/api/topics'
import type { QuizGenerateResponse } from '../../../shared/types'

interface Props {
  studentName?: string
}

interface SessionStats {
  total: number
  correct: number
  streak: number
}

export default function QuizPage({ studentName = 'default' }: Props) {
  const [topics, setTopics] = useState<string[]>([])
  const [selectedParent, setSelectedParent] = useState('')
  const [selectedChild, setSelectedChild] = useState('')
  const [quiz, setQuiz] = useState<QuizGenerateResponse | null>(null)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [answered, setAnswered] = useState(false)
  const [session, setSession] = useState<SessionStats>({ total: 0, correct: 0, streak: 0 })
  const [showStreak, setShowStreak] = useState(false)

  useEffect(() => {
    getTopics().then((res) => {
      const uniqueTopics = [...new Set(res.topics)].sort()
      setTopics(uniqueTopics as string[])
    }).catch(() => {})
  }, [])

  const parents = Array.from(new Set(
    topics.map((t) => t.split(' → ')[0])
  )).sort()

  const children = selectedParent
    ? topics
      .filter((t) => t.startsWith(`${selectedParent} → `))
      .map((t) => t.split(' → ')[1])
      .filter(Boolean)
      .sort()
    : []

  const handleGenerate = async () => {
    const topic = selectedChild
      ? `${selectedParent} → ${selectedChild}`
      : selectedParent || 'random science topic'
    setGenerating(true)
    setError(null)
    setQuiz(null)
    setAnswered(false)
    try {
      const result = await generateQuiz({ topic, student_name: studentName })
      if (!result.options || result.options.length === 0) {
        setError('Could not generate a quiz question. Try a different topic.')
      } else {
        setQuiz(result)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate quiz')
    } finally {
      setGenerating(false)
    }
  }

  const handleAnswer = (letter: string, isCorrect: boolean) => {
    setAnswered(true)
    const newStreak = isCorrect ? session.streak + 1 : 0
    setSession((s) => ({ total: s.total + 1, correct: s.correct + (isCorrect ? 1 : 0), streak: newStreak }))
    if (isCorrect && newStreak > 0 && newStreak % 3 === 0) {
      setShowStreak(true)
      setTimeout(() => setShowStreak(false), 2500)
    }
    if (quiz) {
      submitQuiz({
        question: quiz.question,
        student_answer: letter,
        correct_answer: quiz.correct_letter,
        topic: quiz.topic,
        student_name: studentName,
      }).catch(() => {})
    }
  }

  const accuracy = session.total > 0 ? Math.round((session.correct / session.total) * 100) : 0

  return (
    <Box className="flex flex-col h-full">
      <Box className="flex items-center justify-between px-6 py-3" sx={{ borderBottom: '1px solid #e2e8f0', bgcolor: 'white' }}>
        <Box className="flex items-center gap-2">
          <QuizIcon sx={{ color: '#2563eb', fontSize: 20 }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#0f172a' }}>Quiz Mode</Typography>
        </Box>
        {session.total > 0 && (
          <Box className="flex items-center gap-3">
            <Chip size="small" label={`${session.correct}/${session.total} correct`} sx={{ bgcolor: '#f0fdf4', color: '#16a34a', fontWeight: 600, fontSize: '0.7rem', border: '1px solid #bbf7d0' }} />
            <Chip size="small" label={`${accuracy}%`} sx={{ bgcolor: accuracy >= 70 ? '#f0fdf4' : '#fef2f2', color: accuracy >= 70 ? '#16a34a' : '#dc2626', fontWeight: 700, fontSize: '0.7rem', border: `1px solid ${accuracy >= 70 ? '#bbf7d0' : '#fecaca'}` }} />
          </Box>
        )}
      </Box>
      {session.total > 0 && (
        <LinearProgress
          variant="determinate"
          value={accuracy}
          sx={{
            height: 4,
            bgcolor: '#f1f5f9',
            '& .MuiLinearProgress-bar': {
              bgcolor: accuracy >= 70 ? '#16a34a' : accuracy >= 40 ? '#f59e0b' : '#dc2626',
              transition: 'width 0.5s ease',
            },
          }}
        />
      )}

      <Box className="flex-1 overflow-y-auto p-6">
        <Box className="max-w-2xl mx-auto space-y-5">
          {/* Topic selector + generate */}
          <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
            <Box className="px-4 py-3" sx={{ bgcolor: '#f8fafc' }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>Generate a Quiz Question</Typography>
            </Box>
            <Divider />
            <Box className="p-4 flex flex-col gap-3">
              <FormControl size="small" fullWidth>
                <InputLabel>Event</InputLabel>
                <Select
                  value={selectedParent}
                  label="Event"
                  onChange={(e) => {
                    setSelectedParent(e.target.value)
                    setSelectedChild('')
                  }}
                  sx={{ borderRadius: '10px', fontSize: '0.875rem' }}
                >
                  <MenuItem value="">
                    <em>Any event</em>
                  </MenuItem>
                  {parents.map((t) => (
                    <MenuItem key={t} value={t} sx={{ fontSize: '0.875rem' }}>{t}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" fullWidth disabled={!selectedParent}>
                <InputLabel>Subtopic</InputLabel>
                <Select
                  value={selectedChild}
                  label="Subtopic"
                  onChange={(e) => setSelectedChild(e.target.value)}
                  sx={{ borderRadius: '10px', fontSize: '0.875rem' }}
                >
                  <MenuItem value="">
                    <em>Any subtopic</em>
                  </MenuItem>
                  {children.map((t) => (
                    <MenuItem key={t} value={t} sx={{ fontSize: '0.875rem' }}>{t}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button
                variant="contained"
                startIcon={generating ? <CircularProgress size={16} color="inherit" /> : <PlayArrowIcon />}
                onClick={handleGenerate}
                disabled={generating}
                sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, alignSelf: 'flex-start' }}
              >
                {generating ? 'Generating...' : 'Generate Question'}
              </Button>
            </Box>
          </Paper>

          {showStreak && (
            <Box className="streak-celebrate" sx={{ textAlign: 'center', py: 2 }}>
              <Typography sx={{ fontSize: '1.5rem', fontWeight: 800, color: '#f59e0b' }}>
                {session.streak} in a row!
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>Keep it up!</Typography>
            </Box>
          )}

          {error && <Alert severity="error" sx={{ borderRadius: '12px' }}>{error}</Alert>}

          {/* Quiz card */}
          {quiz && (
            <Box className="space-y-4">
              <QuizCard
                question={quiz.question}
                options={quiz.options}
                correctLetter={quiz.correct_letter}
                topic={quiz.topic}
                onAnswer={handleAnswer}
              />
              {answered && quiz.explanation && (
                <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: '12px', p: 3, bgcolor: '#f8fafc' }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', mb: 1 }}>Explanation</Typography>
                  <Typography variant="body2" sx={{ color: '#64748b', lineHeight: 1.7 }}>{quiz.explanation}</Typography>
                </Paper>
              )}
              {answered && (
                <Button
                  variant="outlined"
                  startIcon={<SkipNextIcon />}
                  onClick={handleGenerate}
                  sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600 }}
                >
                  Next Question
                </Button>
              )}
            </Box>
          )}

          {/* Empty state */}
          {!quiz && !generating && !error && (
            <Box className="text-center py-8">
              <EmojiEventsIcon sx={{ fontSize: 48, color: '#cbd5e1', mb: 2 }} />
              <Typography variant="h6" sx={{ color: '#64748b', fontWeight: 600, mb: 1 }}>Ready to practice?</Typography>
              <Typography variant="body2" sx={{ color: '#94a3b8', maxWidth: 350, mx: 'auto' }}>
                Select a topic above and generate a question to start your quiz session.
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  )
}
