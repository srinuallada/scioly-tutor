import { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react'
import {
  Box, Tabs, Tab, Typography, Avatar, TextField, IconButton, Tooltip,
  AppBar, Toolbar, Drawer, useMediaQuery, BottomNavigation, BottomNavigationAction,
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Fade, Badge,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import FolderOpenIcon from '@mui/icons-material/FolderOpen'
import QuizIcon from '@mui/icons-material/Quiz'
import InsightsOutlinedIcon from '@mui/icons-material/InsightsOutlined'
import ScienceIcon from '@mui/icons-material/Science'
import GoogleIcon from '@mui/icons-material/Google'
import PersonOutlineIcon from '@mui/icons-material/PersonOutline'
import SciOlyLogo from './shared/ui/SciOlyLogo'
import EditIcon from '@mui/icons-material/Edit'
import MenuIcon from '@mui/icons-material/Menu'
import ChatPage from './features/chat/pages/ChatPage'
const MaterialsPage = lazy(() => import('./features/materials/pages/MaterialsPage'))
const QuizPage = lazy(() => import('./features/quiz/pages/QuizPage'))
const ProgressPage = lazy(() => import('./features/progress/pages/ProgressPage'))
import { getTopics } from './lib/api/topics'
import { config } from './app/config/env'
import { useToast } from './shared/ui/ToastProvider'

const TABS = [
  { label: 'Chat', icon: <AutoAwesomeIcon fontSize="small" /> },
  { label: 'Materials', icon: <FolderOpenIcon fontSize="small" /> },
  { label: 'Quiz', icon: <QuizIcon fontSize="small" /> },
  { label: 'Progress', icon: <InsightsOutlinedIcon fontSize="small" /> },
]

const STUDENT_KEY = 'scioly-student-name'
const TAB_KEY = 'scioly-active-tab'
const CHAT_STORAGE_PREFIX = 'scioly-chat-'

function studentKeyFor(email?: string | null): string {
  return email ? `${STUDENT_KEY}:${email}` : STUDENT_KEY
}

function loadStudentName(email?: string | null): string {
  return localStorage.getItem(studentKeyFor(email)) || 'default'
}

function decodeJwt(token: string): { email?: string; exp?: number } | null {
  try {
    const payload = token.split('.')[1]
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(json)
  } catch {
    return null
  }
}

function isTokenValid(token: string | null): boolean {
  if (!token) return false
  const decoded = decodeJwt(token)
  if (!decoded?.exp) return false
  const nowSeconds = Math.floor(Date.now() / 1000)
  return decoded.exp > nowSeconds
}

export default function App() {
  const [tab, setTab] = useState(() => {
    const stored = localStorage.getItem(TAB_KEY)
    const parsed = stored ? Number.parseInt(stored, 10) : 0
    return Number.isFinite(parsed) && parsed >= 0 && parsed < TABS.length ? parsed : 0
  })
  const [materialCount, setMaterialCount] = useState(0)
  const [studentName, setStudentName] = useState(loadStudentName)
  const [nameInput, setNameInput] = useState(studentName)
  const [authEmail, setAuthEmail] = useState<string | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [clearChatOpen, setClearChatOpen] = useState(false)
  const [googleBtnLoaded, setGoogleBtnLoaded] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const isAuthed = Boolean(authEmail)
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const toast = useToast()

  const refreshMaterials = () => {
    if (!localStorage.getItem('google_id_token')) return
    getTopics()
      .then((t) => setMaterialCount(t.stats.total_chunks))
      .catch(() => {})
  }

  useEffect(() => {
    refreshMaterials()
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('google_id_token')
    if (!isTokenValid(token)) {
      localStorage.removeItem('google_id_token')
      setAuthEmail(null)
      return
    }

    // Set email immediately from local JWT so UI doesn't flash
    const decoded = token ? decodeJwt(token) : null
    setAuthEmail(decoded?.email || null)

    // Then verify with backend — only block on explicit 403
    fetch(`${config.apiBaseUrl}/auth/verify`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (res.status === 403) {
          localStorage.removeItem('google_id_token')
          setAuthEmail(null)
          setAuthError('Access denied. Your account is not authorized to use this app.')
          if (window.google?.accounts?.id) {
            window.google.accounts.id.disableAutoSelect()
          }
        }
        // Any other error (500, network) — stay logged in, backend will enforce on API calls
      })
      .catch(() => {
        // Network error — stay logged in
      })
  }, [])

  useEffect(() => {
    if (authEmail) {
      const name = loadStudentName(authEmail)
      setStudentName(name)
      setNameInput(name)
    }
  }, [authEmail])

  useEffect(() => {
    if (!config.googleClientId) return

    const initGoogle = () => {
      if (!window.google?.accounts?.id) return false

      window.google.accounts.id.initialize({
        client_id: config.googleClientId,
        callback: async (response: { credential: string }) => {
          localStorage.setItem('google_id_token', response.credential)
          if (!isTokenValid(response.credential)) {
            localStorage.removeItem('google_id_token')
            setAuthEmail(null)
            return
          }

          // Verify with backend that this user is authorized
          try {
            const res = await fetch(`${config.apiBaseUrl}/auth/verify`, {
              headers: { Authorization: `Bearer ${response.credential}` },
            })
            if (res.status === 403) {
              localStorage.removeItem('google_id_token')
              setAuthEmail(null)
              setAuthError('Access denied. Your account is not authorized to use this app.')
              if (window.google?.accounts?.id) {
                window.google.accounts.id.disableAutoSelect()
              }
              return
            }
            if (!res.ok) {
              localStorage.removeItem('google_id_token')
              setAuthEmail(null)
              setAuthError('Authentication failed. Please try again.')
              return
            }
          } catch {
            // Network error — allow through (backend will still enforce on API calls)
          }

          const decoded = decodeJwt(response.credential)
          setAuthEmail(decoded?.email || null)
          setAuthError(null)
          refreshMaterials()
        },
      })

      const target = document.getElementById('google-signin-btn')
      if (target) {
        target.innerHTML = ''
        const isLoginPage = !localStorage.getItem('google_id_token')
        window.google.accounts.id.renderButton(target, {
          theme: isLoginPage ? 'filled_blue' : 'outline',
          size: isLoginPage ? 'large' : 'medium',
          width: isLoginPage ? 280 : 180,
        })
        setGoogleBtnLoaded(true)
      }
      return true
    }

    if (initGoogle()) return

    const timer = window.setInterval(() => {
      if (initGoogle()) {
        window.clearInterval(timer)
      }
    }, 200)

    return () => window.clearInterval(timer)
  }, [authEmail])

  useEffect(() => {
    const timer = window.setInterval(() => {
      const token = localStorage.getItem('google_id_token')
      if (!isTokenValid(token)) {
        localStorage.removeItem('google_id_token')
        setAuthEmail(null)
      }
    }, 60000)

    return () => window.clearInterval(timer)
  }, [])

  const signOut = () => {
    localStorage.removeItem('google_id_token')
    setAuthEmail(null)
    setGoogleBtnLoaded(false)
    if (window.google?.accounts?.id) {
      window.google.accounts.id.disableAutoSelect()
    }
  }

  const saveName = useCallback(() => {
    const sanitized = nameInput.trim().replace(/[^a-zA-Z0-9 _-]/g, '').replace(/\s+/g, ' ')
    const name = sanitized || 'default'
    setStudentName(name)
    setNameInput(name)
    localStorage.setItem(studentKeyFor(authEmail), name)
    if (sanitized !== nameInput.trim()) {
      toast({ severity: 'info', message: 'Student name updated. Only letters, numbers, spaces, "_" and "-" are kept.' })
    }
    if (!sanitized) {
      toast({ severity: 'warning', message: 'Student name was empty, so it was set to Default.' })
    }
  }, [authEmail, nameInput, toast])

  const handleTabChange = useCallback((next: number) => {
    setTab(next)
    localStorage.setItem(TAB_KEY, String(next))
  }, [])

  const clearChatHistory = useCallback(() => {
    localStorage.removeItem(CHAT_STORAGE_PREFIX + studentName)
    window.dispatchEvent(new CustomEvent('scioly-clear-chat', { detail: { userEmail: authEmail || undefined } }))
    toast({ severity: 'success', message: 'Chat history cleared.' })
  }, [authEmail, studentName, toast])

  const sidebar = useMemo(() => (
    <Box
      className="flex flex-col h-full"
      sx={{
        width: 220,
        bgcolor: 'white',
        borderRight: 'none',
        boxShadow: '1px 0 18px rgba(15, 23, 42, 0.06)',
      }}
    >
      {/* Logo */}
      <Box className="flex items-center gap-2 px-5 py-4" sx={{ borderBottom: '1px solid #e2e8f0' }}>
        <SciOlyLogo size={34} />
        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '1rem' }}>
          SciOly Tutor
        </Typography>
      </Box>

      {/* Nav tabs */}
      <Tabs
        orientation="vertical"
        value={tab}
        onChange={(_, v) => {
          handleTabChange(v)
          if (isMobile) setMobileOpen(false)
        }}
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
            '&.Mui-selected': { color: '#2563eb', fontWeight: 600, bgcolor: '#eff6ff' },
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
          <Tab
            key={i}
            label={t.label}
            icon={i === 1 && materialCount > 0
              ? <Badge badgeContent={materialCount} color="primary" max={9999} sx={{ '& .MuiBadge-badge': { fontSize: '0.6rem', height: 16, minWidth: 16 } }}>{t.icon}</Badge>
              : t.icon}
            iconPosition="start"
          />
        ))}
      </Tabs>

      {/* Spacer */}
      <Box className="flex-1" />

      {/* Auth — pinned to bottom */}
      <Box className="px-4 py-3" sx={{ borderTop: '1px solid #e2e8f0' }}>
        {authEmail ? (
          <Box className="flex items-center gap-2">
            <Avatar sx={{ bgcolor: '#2563eb', width: 30, height: 30, fontSize: '0.75rem', fontWeight: 700 }}>
              {(studentName === 'default' ? 'D' : studentName[0] || 'D').toUpperCase()}
            </Avatar>
            <Box className="flex-1 min-w-0">
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', fontSize: '0.8rem', lineHeight: 1.2 }} noWrap>
                {studentName === 'default' ? 'Default' : studentName}
              </Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.65rem', lineHeight: 1.2 }} noWrap>
                {authEmail}
              </Typography>
            </Box>
            <Tooltip title="Settings">
              <IconButton
                size="small"
                onClick={() => {
                  setNameInput(studentName)
                  setProfileOpen(true)
                }}
              >
                <EditIcon sx={{ fontSize: 14, color: '#94a3b8' }} />
              </IconButton>
            </Tooltip>
          </Box>
        ) : (
          <Box id="google-signin-btn" />
        )}
      </Box>

      <Dialog open={profileOpen} onClose={() => setProfileOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Profile</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <Box>
            <Typography variant="caption" sx={{ color: '#94a3b8' }}>Signed in as</Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#0f172a' }}>{authEmail}</Typography>
          </Box>
          <TextField
            label="Display name"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder="e.g. Vishnu"
            size="small"
            fullWidth
          />
          <Button
            variant="outlined"
            color="error"
            onClick={() => setClearChatOpen(true)}
            sx={{ textTransform: 'none', alignSelf: 'flex-start' }}
          >
            Clear chat history
          </Button>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setProfileOpen(false)} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            variant="outlined"
            color="error"
            onClick={() => { signOut(); setProfileOpen(false) }}
            sx={{ textTransform: 'none' }}
          >
            Sign out
          </Button>
          <Button
            variant="contained"
            onClick={() => { saveName(); setProfileOpen(false) }}
            sx={{ textTransform: 'none' }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={clearChatOpen} onClose={() => setClearChatOpen(false)}>
        <DialogTitle>Clear chat history?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            This removes all chat messages for your current profile. This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setClearChatOpen(false)} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              clearChatHistory()
              setClearChatOpen(false)
              setProfileOpen(false)
            }}
            sx={{ textTransform: 'none' }}
          >
            Clear
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  ), [authEmail, clearChatHistory, clearChatOpen, handleTabChange, isMobile, nameInput, profileOpen, saveName, signOut, studentName, tab])

  if (!isAuthed) {
    return (
      <Box
        className="flex h-screen items-center justify-center"
        sx={{
          background: 'linear-gradient(135deg, #eff6ff 0%, #f8fafc 40%, #faf5ff 100%)',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: '-50%',
            right: '-20%',
            width: '600px',
            height: '600px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(37,99,235,0.06) 0%, transparent 70%)',
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: '-30%',
            left: '-10%',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(139,92,246,0.05) 0%, transparent 70%)',
          },
        }}
      >
        <Box
          className="flex flex-col items-center"
          sx={{
            bgcolor: 'rgba(255,255,255,0.85)',
            backdropFilter: 'blur(20px)',
            px: { xs: 4, sm: 6 },
            py: { xs: 5, sm: 6 },
            borderRadius: 4,
            border: '1px solid rgba(226,232,240,0.8)',
            boxShadow: '0 20px 60px rgba(15, 23, 42, 0.08), 0 4px 16px rgba(15, 23, 42, 0.04)',
            maxWidth: 420,
            width: '90%',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {/* Logo */}
          <Box sx={{ mb: 3, filter: 'drop-shadow(0 8px 24px rgba(37,99,235,0.3))' }}>
            <SciOlyLogo size={90} />
          </Box>

          {/* App name */}
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              background: 'linear-gradient(135deg, #0f172a 0%, #1e40af 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 0.5,
              fontSize: { xs: '1.6rem', sm: '2rem' },
            }}
          >
            SciOly Tutor
          </Typography>

          {/* Tagline */}
          <Typography
            variant="body1"
            sx={{
              color: '#64748b',
              textAlign: 'center',
              mb: 4,
              fontSize: '0.95rem',
              lineHeight: 1.5,
              maxWidth: 280,
            }}
          >
            Your AI-powered study companion for Science Olympiad
          </Typography>

          {/* Auth error message */}
          {authError && (
            <Box
              sx={{
                bgcolor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: 2,
                px: 3,
                py: 1.5,
                mb: 2,
                maxWidth: 320,
                width: '100%',
              }}
            >
              <Typography variant="body2" sx={{ color: '#dc2626', fontSize: '0.85rem', textAlign: 'center' }}>
                {authError}
              </Typography>
            </Box>
          )}

          {/* Google SDK button (hidden if SDK doesn't load) */}
          <Box id="google-signin-btn" />

          {/* Fallback button when Google SDK isn't available */}
          {!googleBtnLoaded && (
            <Box
              component="button"
              onClick={() => {
                if (config.googleClientId) {
                  // SDK not loaded yet — try reloading
                  window.location.reload()
                } else {
                  // No client ID — skip auth for local dev
                  localStorage.setItem('google_id_token', 'dev-mode')
                  setAuthEmail('local-dev@scioly-tutor')
                  refreshMaterials()
                }
              }}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                px: 4,
                py: 1.5,
                border: '1px solid #dadce0',
                borderRadius: '8px',
                bgcolor: 'white',
                cursor: 'pointer',
                fontSize: '0.95rem',
                fontWeight: 500,
                color: '#3c4043',
                fontFamily: 'inherit',
                transition: 'all 0.2s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                '&:hover': {
                  bgcolor: '#f8f9fa',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                },
              }}
            >
              <GoogleIcon sx={{ fontSize: 20, color: '#4285f4' }} />
              {config.googleClientId ? 'Sign in with Google' : 'Continue without sign-in'}
            </Box>
          )}

          {/* Footer */}
          <Typography
            variant="caption"
            sx={{
              color: '#94a3b8',
              mt: 4,
              fontSize: '0.7rem',
              textAlign: 'center',
            }}
          >
            {config.googleClientId
              ? 'Sign in with your Google account to get started'
              : 'Google Client ID not configured — running in local mode'}
          </Typography>
        </Box>
      </Box>
    )
  }

  return (
    <Box className="flex" sx={{ minHeight: '100dvh' }}>
      {isMobile ? (
        <>
          <AppBar position="fixed" elevation={0} sx={{ bgcolor: 'white', borderBottom: '1px solid #e2e8f0' }}>
            <Toolbar sx={{ minHeight: 56, px: 2 }}>
              <IconButton edge="start" onClick={() => setMobileOpen(true)} aria-label="Open navigation">
                <MenuIcon sx={{ color: '#0f172a' }} />
              </IconButton>
              <Box className="flex items-center gap-2 flex-1">
                <SciOlyLogo size={28} />
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                  {TABS[tab]?.label ?? 'SciOly Tutor'}
                </Typography>
              </Box>
              {authEmail && (
                <Avatar sx={{ bgcolor: '#2563eb', width: 28, height: 28, fontSize: '0.7rem', fontWeight: 700 }}>
                  {(studentName === 'default' ? 'D' : studentName[0] || 'D').toUpperCase()}
                </Avatar>
              )}
            </Toolbar>
          </AppBar>
          <Drawer
            anchor="left"
            open={mobileOpen}
            onClose={() => setMobileOpen(false)}
            ModalProps={{ keepMounted: true }}
          >
            {sidebar}
          </Drawer>
        </>
      ) : (
        <Box className="flex flex-col shrink-0">
          {sidebar}
        </Box>
      )}

      {/* Main content */}
      <Box
        className="flex-1 flex flex-col overflow-hidden"
        sx={{
          pt: isMobile ? '56px' : 0,
          pb: isMobile ? 'calc(56px + env(safe-area-inset-bottom, 0px))' : 0,
          minHeight: 0,
        }}
      >
        <Fade in={tab === 0} timeout={200} unmountOnExit mountOnEnter>
          <Box className="flex-1 flex flex-col" sx={{ minHeight: 0, display: tab === 0 ? 'flex' : 'none' }}>
            <ChatPage studentName={studentName} materialCount={materialCount} userEmail={authEmail || undefined} />
          </Box>
        </Fade>
        {tab !== 0 && (
          <Suspense
            fallback={(
              <Box className="flex items-center justify-center h-full" sx={{ color: '#94a3b8' }}>
                Loading...
              </Box>
            )}
          >
            <Fade in={tab === 1} timeout={200} unmountOnExit mountOnEnter>
              <Box className="flex-1 flex flex-col" sx={{ minHeight: 0, display: tab === 1 ? 'flex' : 'none' }}>
                <MaterialsPage onUploadComplete={refreshMaterials} />
              </Box>
            </Fade>
            <Fade in={tab === 2} timeout={200} unmountOnExit mountOnEnter>
              <Box className="flex-1 flex flex-col" sx={{ minHeight: 0, display: tab === 2 ? 'flex' : 'none' }}>
                <QuizPage studentName={studentName} />
              </Box>
            </Fade>
            <Fade in={tab === 3} timeout={200} unmountOnExit mountOnEnter>
              <Box className="flex-1 flex flex-col" sx={{ minHeight: 0, display: tab === 3 ? 'flex' : 'none' }}>
                <ProgressPage studentName={studentName} />
              </Box>
            </Fade>
          </Suspense>
        )}
      </Box>

      {isMobile && (
        <BottomNavigation
          value={tab}
          onChange={(_, v) => handleTabChange(v)}
          showLabels
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            borderTop: '1px solid #e2e8f0',
            bgcolor: 'white',
            zIndex: theme.zIndex.appBar,
            pb: 'env(safe-area-inset-bottom, 0px)',
          }}
        >
          {TABS.map((t, i) => (
            <BottomNavigationAction key={i} label={t.label} icon={t.icon} />
          ))}
        </BottomNavigation>
      )}
    </Box>
  )
}
