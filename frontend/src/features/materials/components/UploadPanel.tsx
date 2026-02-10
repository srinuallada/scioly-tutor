import { useState, useEffect } from 'react'
import {
  Box, Typography, Paper, Button, LinearProgress, IconButton,
  List, ListItem, ListItemIcon, ListItemText, ButtonBase,
} from '@mui/material'
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined'
import DescriptionIcon from '@mui/icons-material/Description'
import SlideshowIcon from '@mui/icons-material/Slideshow'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import TableChartIcon from '@mui/icons-material/TableChart'
import TextSnippetIcon from '@mui/icons-material/TextSnippet'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import type { ReactElement } from 'react'
import { useToast } from '../../../shared/ui/ToastProvider'

const FILE_ICONS: Record<string, ReactElement> = {
  docx: <DescriptionIcon sx={{ color: '#2563eb' }} />,
  doc: <DescriptionIcon sx={{ color: '#2563eb' }} />,
  pptx: <SlideshowIcon sx={{ color: '#d97706' }} />,
  pdf: <PictureAsPdfIcon sx={{ color: '#dc2626' }} />,
  xlsx: <TableChartIcon sx={{ color: '#16a34a' }} />,
  xls: <TableChartIcon sx={{ color: '#16a34a' }} />,
  csv: <TableChartIcon sx={{ color: '#16a34a' }} />,
  txt: <TextSnippetIcon sx={{ color: '#64748b' }} />,
  md: <TextSnippetIcon sx={{ color: '#64748b' }} />,
}

const ACCEPTED = '.docx,.pptx,.pdf,.xlsx,.xls,.txt,.md,.csv'
const fmtSize = (b: number) => b < 1024 ? `${b} B` : b < 1048576 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1048576).toFixed(1)} MB`
const fileIcon = (name: string) => FILE_ICONS[name.split('.').pop()?.toLowerCase() ?? ''] ?? <TextSnippetIcon sx={{ color: '#64748b' }} />

interface Props {
  onUpload: (files: File[]) => Promise<void>
  uploading: boolean
}

export default function UploadPanel({ onUpload, uploading }: Props) {
  const [files, setFiles] = useState<File[]>([])
  const [dragOver, setDragOver] = useState(false)
  const [rejectedCount, setRejectedCount] = useState(0)
  const toast = useToast()

  const isAccepted = (file: File) =>
    Object.keys(FILE_ICONS).includes(file.name.split('.').pop()?.toLowerCase() ?? '')

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const dropped = Array.from(e.dataTransfer.files)
    const accepted = dropped.filter(isAccepted)
    setRejectedCount(dropped.length - accepted.length)
    setFiles((prev) => [...prev, ...accepted])
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    const selected = Array.from(e.target.files)
    const accepted = selected.filter(isAccepted)
    setRejectedCount(selected.length - accepted.length)
    if (accepted.length > 0) setFiles((prev) => [...prev, ...accepted])
    e.target.value = ''
  }

  const handleUpload = async () => {
    if (!files.length) return
    await onUpload(files)
    setFiles([])
  }

  useEffect(() => {
    if (rejectedCount > 0) {
      toast({
        severity: 'warning',
        message: `${rejectedCount} file${rejectedCount > 1 ? 's were' : ' was'} skipped because the type isn’t supported.`,
      })
      setRejectedCount(0)
    }
  }, [rejectedCount, toast])

  return (
    <>
      <ButtonBase
        component={Paper}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        elevation={0}
        role="button"
        tabIndex={0}
        sx={{
          p: 5, textAlign: 'center', border: '2px dashed',
          borderColor: dragOver ? '#2563eb' : '#cbd5e1', borderRadius: '16px',
          bgcolor: dragOver ? '#eff6ff' : '#fafbfc', transition: 'all 0.2s', cursor: 'pointer',
          '&:hover': { borderColor: '#93c5fd', bgcolor: '#f8fafc' },
        }}
        onClick={() => document.getElementById('file-input')?.click()}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') document.getElementById('file-input')?.click() }}
      >
        <input id="file-input" type="file" multiple accept={ACCEPTED} onChange={handleFileSelect} style={{ display: 'none' }} />
        <CloudUploadOutlinedIcon sx={{ fontSize: 48, color: dragOver ? '#2563eb' : '#94a3b8', mb: 2 }} />
        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#334155', mb: 0.5 }}>Drop files here or click to browse</Typography>
        <Typography variant="body2" sx={{ color: '#94a3b8', fontSize: '0.8rem' }}>Supports Word, PowerPoint, PDF, Excel, Text, and Markdown</Typography>
      </ButtonBase>

      {/* toast handles rejected file feedback */}

      {files.length > 0 && (
        <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
          <Box className="px-4 py-3 flex items-center justify-between" sx={{ bgcolor: '#f8fafc' }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>{files.length} file{files.length > 1 ? 's' : ''} selected</Typography>
            <Button variant="contained" size="small" onClick={handleUpload} disabled={uploading} startIcon={<CloudUploadOutlinedIcon />} sx={{ fontSize: '0.8rem' }}>
              {uploading ? 'Processing...' : 'Upload & Process'}
            </Button>
          </Box>
          {uploading && <LinearProgress />}
          <List dense disablePadding>
            {files.map((f, i) => (
              <ListItem key={i} secondaryAction={<IconButton size="small" onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}><DeleteOutlineIcon fontSize="small" sx={{ color: '#94a3b8' }} /></IconButton>} sx={{ px: 3, py: 1 }}>
                <ListItemIcon sx={{ minWidth: 36 }}>{fileIcon(f.name)}</ListItemIcon>
                <ListItemText primary={f.name} secondary={fmtSize(f.size)} primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: 500 }} secondaryTypographyProps={{ fontSize: '0.7rem' }} />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}
    </>
  )
}
