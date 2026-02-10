export const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '/api',
  googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
  appName: 'SciOly Tutor',
  defaultStudentName: 'default',
} as const
