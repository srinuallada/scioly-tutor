import { http } from '../http/client'
import type { ProgressResponse, StudyPlanResponse } from '../../shared/types'

export function getProgress(): Promise<ProgressResponse> {
  return http.get<ProgressResponse>('/progress')
}

export function getStudyPlan(): Promise<StudyPlanResponse> {
  return http.get<StudyPlanResponse>('/study-plan')
}
