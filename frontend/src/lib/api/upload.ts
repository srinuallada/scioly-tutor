import { http } from '../http/client'
import type { UploadResult } from '../../shared/types'

export function uploadFiles(files: File[]): Promise<UploadResult> {
  const formData = new FormData()
  for (const file of files) {
    formData.append('files', file)
  }
  return http.post<UploadResult>('/upload', formData)
}
