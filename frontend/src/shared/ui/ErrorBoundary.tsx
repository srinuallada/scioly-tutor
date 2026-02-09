import { Component, type ReactNode } from 'react'
import { Box, Typography, Button, Avatar } from '@mui/material'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'
import RefreshIcon from '@mui/icons-material/Refresh'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box className="flex flex-col items-center justify-center h-screen px-6" sx={{ bgcolor: '#f8fafc' }}>
          <Avatar sx={{ bgcolor: '#fef2f2', width: 64, height: 64, mb: 3 }}>
            <ErrorOutlineIcon sx={{ fontSize: 32, color: '#dc2626' }} />
          </Avatar>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a', mb: 1 }}>Something went wrong</Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mb: 3, textAlign: 'center', maxWidth: 400 }}>
            An unexpected error occurred. Try refreshing the page or click the button below.
          </Typography>
          {this.state.error && (
            <Typography variant="caption" sx={{ color: '#94a3b8', mb: 3, fontFamily: 'monospace', maxWidth: 500, textAlign: 'center' }}>
              {this.state.error.message}
            </Typography>
          )}
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={this.handleReset}
            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600 }}
          >
            Try Again
          </Button>
        </Box>
      )
    }

    return this.props.children
  }
}
