import { http } from '../http/client'
import type { ProgressResponse } from '../../shared/types'

export function getProgress(studentName = 'default'): Promise<ProgressResponse> {
  return http.get<ProgressResponse>(`/progress/${encodeURIComponent(studentName)}`)
}
