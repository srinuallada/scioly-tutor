export const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '/api',
  appName: 'SciOly Tutor',
  defaultStudentName: 'default',
} as const
