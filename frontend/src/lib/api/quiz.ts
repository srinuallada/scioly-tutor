import { http } from '../http/client'
import type { QuizSubmission, QuizResult } from '../../shared/types'

export function submitQuiz(data: QuizSubmission): Promise<QuizResult> {
  return http.post<QuizResult>('/quiz/submit', data)
}
