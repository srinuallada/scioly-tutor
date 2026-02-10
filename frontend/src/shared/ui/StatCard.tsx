import { Box, Typography, Paper } from '@mui/material'
import type { ReactNode } from 'react'

interface Props {
  icon: ReactNode
  label: string
  value: string | number
  subtitle?: string
  color?: string
}

export default function StatCard({ icon, label, value, subtitle, color = '#2563eb' }: Props) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5, border: '1px solid #e2e8f0', borderRadius: '12px', flex: 1, minWidth: 140,
        boxShadow: '0 1px 3px rgba(15,23,42,0.04)',
        transition: 'all 0.2s',
        '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 4px 12px rgba(15,23,42,0.08)' },
      }}
    >
      <Box className="flex items-center gap-2 mb-2">
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: '8px',
            bgcolor: `${color}12`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </Box>
      </Box>
      <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>
        {value}
      </Typography>
      <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 500 }}>
        {label}
      </Typography>
      {subtitle && (
        <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.7rem' }}>
          {subtitle}
        </Typography>
      )}
    </Paper>
  )
}
