import { Box, Typography, Chip } from '@mui/material'

interface Props {
  topics: string[]
  sourcesUsed: number
}

export default function SourcesPanel({ topics, sourcesUsed }: Props) {
  if (!topics.length && !sourcesUsed) return null

  return (
    <Box className="px-4 py-2 flex items-center gap-2 flex-wrap" sx={{ borderTop: '1px solid #f1f5f9' }}>
      {sourcesUsed > 0 && (
        <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.65rem' }}>
          {sourcesUsed} sources referenced
        </Typography>
      )}
      {topics.map((t, i) => (
        <Chip
          key={i}
          label={t}
          size="small"
          sx={{ height: 20, fontSize: '0.6rem', bgcolor: '#f1f5f9', color: '#64748b' }}
        />
      ))}
    </Box>
  )
}
