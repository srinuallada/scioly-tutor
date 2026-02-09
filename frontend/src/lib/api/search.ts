import { http } from '../http/client'

export function searchMaterials(query: string, topK = 5) {
  return http.get<{ query: string; results: Record<string, unknown>[] }>(
    `/search?query=${encodeURIComponent(query)}&top_k=${topK}`,
  )
}
