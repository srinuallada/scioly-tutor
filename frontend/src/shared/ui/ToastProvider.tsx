import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { Snackbar, Alert } from '@mui/material'

export type ToastSeverity = 'success' | 'info' | 'warning' | 'error'

export interface ToastOptions {
  message: string
  severity?: ToastSeverity
  duration?: number
}

interface ToastState {
  open: boolean
  message: string
  severity: ToastSeverity
  duration: number
}

type ToastFn = (options: ToastOptions) => void

const ToastContext = createContext<ToastFn>(() => {})

export function useToast(): ToastFn {
  return useContext(ToastContext)
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState>({
    open: false,
    message: '',
    severity: 'info',
    duration: 3000,
  })

  const showToast = useCallback((options: ToastOptions) => {
    setToast({
      open: true,
      message: options.message,
      severity: options.severity ?? 'info',
      duration: options.duration ?? 3000,
    })
  }, [])

  const handleClose = () => setToast((prev) => ({ ...prev, open: false }))

  const ctx = useMemo(() => showToast, [showToast])

  return (
    <ToastContext.Provider value={ctx}>
      {children}
      <Snackbar
        open={toast.open}
        autoHideDuration={toast.duration}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{ mb: 'calc(56px + env(safe-area-inset-bottom, 0px))' }}
      >
        <Alert onClose={handleClose} severity={toast.severity} sx={{ borderRadius: '10px' }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </ToastContext.Provider>
  )
}
