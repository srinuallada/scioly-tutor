import { http } from '../http/client'
import type { TopicsResponse } from '../../shared/types'

export function getTopics(): Promise<TopicsResponse> {
  return http.get<TopicsResponse>('/topics')
}
