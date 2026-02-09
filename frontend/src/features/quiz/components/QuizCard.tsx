import { useState } from 'react'
import { Box, Typography, Paper, Button, Chip } from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'

interface Props {
  question: string
  options: string[]
  correctLetter: string
  topic?: string
  onAnswer?: (selectedLetter: string, isCorrect: boolean) => void
}

const LETTERS = ['A', 'B', 'C', 'D']

export default function QuizCard({ question, options, correctLetter, topic, onAnswer }: Props) {
  const [selected, setSelected] = useState<string | null>(null)
  const answered = selected !== null

  const handleSelect = (letter: string) => {
    if (answered) return
    setSelected(letter)
    const isCorrect = letter === correctLetter
    onAnswer?.(letter, isCorrect)
  }

  return (
    <Paper
      elevation={0}
      sx={{ border: '1px solid #e2e8f0', borderRadius: '14px', overflow: 'hidden' }}
    >
      <Box className="px-5 py-4" sx={{ bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
        {topic && (
          <Chip size="small" label={topic} sx={{ mb: 1.5, height: 22, fontSize: '0.65rem', bgcolor: '#eff6ff', color: '#2563eb', fontWeight: 600, border: '1px solid #bfdbfe' }} />
        )}
        <Typography variant="body1" sx={{ fontWeight: 600, color: '#0f172a', lineHeight: 1.5 }}>
          {question}
        </Typography>
      </Box>

      <Box className="p-4 space-y-2">
        {options.map((opt, i) => {
          const letter = LETTERS[i]
          const isCorrect = letter === correctLetter
          const isSelected = letter === selected

          let borderColor = '#e2e8f0'
          let bgColor = 'white'
          if (answered && isCorrect) { borderColor = '#16a34a'; bgColor = '#f0fdf4' }
          else if (answered && isSelected && !isCorrect) { borderColor = '#dc2626'; bgColor = '#fef2f2' }

          return (
            <Box
              key={i}
              onClick={() => handleSelect(letter)}
              sx={{
                display: 'flex', alignItems: 'center', gap: 2,
                p: 1.5, borderRadius: '10px', border: `1.5px solid ${borderColor}`, bgcolor: bgColor,
                cursor: answered ? 'default' : 'pointer',
                transition: 'all 0.2s',
                ...(!answered && { '&:hover': { borderColor: '#93c5fd', transform: 'translateX(4px)', boxShadow: '0 2px 8px rgba(59,130,246,0.12)' } }),
              }}
            >
              <Typography sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.85rem', width: 20 }}>{letter}</Typography>
              <Typography sx={{ fontSize: '0.875rem', color: '#334155', flex: 1 }}>{opt}</Typography>
              {answered && isCorrect && <CheckCircleIcon sx={{ fontSize: 20, color: '#16a34a' }} />}
              {answered && isSelected && !isCorrect && <CancelIcon sx={{ fontSize: 20, color: '#dc2626' }} />}
            </Box>
          )
        })}
      </Box>

      {answered && (
        <Box className="px-5 py-3" sx={{ bgcolor: selected === correctLetter ? '#f0fdf4' : '#fef2f2', borderTop: '1px solid #e2e8f0' }}>
          <Typography variant="body2" sx={{ fontWeight: 600, color: selected === correctLetter ? '#16a34a' : '#dc2626' }}>
            {selected === correctLetter ? 'Correct!' : `Incorrect — the answer is ${correctLetter}`}
          </Typography>
        </Box>
      )}
    </Paper>
  )
}
