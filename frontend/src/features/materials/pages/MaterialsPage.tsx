import { useState, useEffect } from 'react'
import { Box, Typography, Chip, Paper, Alert, Divider } from '@mui/material'
import FolderOpenIcon from '@mui/icons-material/FolderOpen'
import CategoryIcon from '@mui/icons-material/Category'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import UploadPanel from '../components/UploadPanel'
import SearchPanel from '../components/SearchPanel'
import { uploadFiles } from '../../../lib/api/upload'
import { getTopics } from '../../../lib/api/topics'
import type { TopicsResponse, UploadResult } from '../../../shared/types'

interface Props {
  onUploadComplete?: () => void
}

export default function MaterialsPage({ onUploadComplete }: Props) {
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<UploadResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [topics, setTopics] = useState<TopicsResponse | null>(null)

  useEffect(() => {
    getTopics().then(setTopics).catch(() => {})
  }, [result])

  const handleUpload = async (files: File[]) => {
    setUploading(true)
    setError(null)
    setResult(null)
    try {
      const res = await uploadFiles(files)
      setResult(res)
      onUploadComplete?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <Box className="flex flex-col h-full">
      <Box className="flex items-center justify-between px-6 py-3" sx={{ borderBottom: '1px solid #e2e8f0', bgcolor: 'white' }}>
        <Box className="flex items-center gap-2">
          <FolderOpenIcon sx={{ color: '#2563eb', fontSize: 20 }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#0f172a' }}>Study Materials</Typography>
        </Box>
        {topics?.stats && (
          <Chip size="small" label={`${topics.stats.total_files} files / ${topics.stats.total_chunks} chunks`} variant="outlined" sx={{ fontSize: '0.7rem', height: 26, borderColor: '#cbd5e1' }} />
        )}
      </Box>

      <Box className="flex-1 overflow-y-auto p-6">
        <Box className="max-w-2xl mx-auto space-y-6">
          <SearchPanel />
          <UploadPanel onUpload={handleUpload} uploading={uploading} />

          {result && (
            <Alert severity="success" icon={<CheckCircleIcon />} sx={{ borderRadius: '12px' }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>Processed {result.files_processed?.length ?? 0} file(s)</Typography>
              <Typography variant="caption" sx={{ color: '#166534' }}>{result.total_chunks} chunks created and indexed</Typography>
            </Alert>
          )}
          {error && <Alert severity="error" sx={{ borderRadius: '12px' }}>{error}</Alert>}

          {(topics?.topics?.length ?? 0) > 0 && (
            <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
              <Box className="px-4 py-3 flex items-center gap-2" sx={{ bgcolor: '#f8fafc' }}>
                <CategoryIcon sx={{ fontSize: 18, color: '#64748b' }} />
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>Indexed Topics ({topics!.topics.length})</Typography>
              </Box>
              <Divider />
              <Box className="p-4 flex flex-wrap gap-2">
                {topics!.topics.map((t, i) => (
                  <Chip key={i} label={t} size="small" sx={{ bgcolor: '#eff6ff', color: '#1e40af', fontWeight: 500, fontSize: '0.75rem', border: '1px solid #bfdbfe' }} />
                ))}
              </Box>
            </Paper>
          )}
        </Box>
      </Box>
    </Box>
  )
}
