import { http } from '../http/client'
import type { ProgressResponse, StudyPlanResponse } from '../../shared/types'

export function getProgress(studentName = 'default'): Promise<ProgressResponse> {
  return http.get<ProgressResponse>(`/progress/${encodeURIComponent(studentName)}`)
}

export function getStudyPlan(studentName = 'default'): Promise<StudyPlanResponse> {
  return http.get<StudyPlanResponse>(`/study-plan/${encodeURIComponent(studentName)}`)
}
