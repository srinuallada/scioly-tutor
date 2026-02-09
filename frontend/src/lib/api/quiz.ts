import { http } from '../http/client'
import type { QuizSubmission, QuizResult, QuizGenerateRequest, QuizGenerateResponse } from '../../shared/types'

export function submitQuiz(data: QuizSubmission): Promise<QuizResult> {
  return http.post<QuizResult>('/quiz/submit', data)
}

export function generateQuiz(data: QuizGenerateRequest): Promise<QuizGenerateResponse> {
  return http.post<QuizGenerateResponse>('/quiz/generate', data)
}
