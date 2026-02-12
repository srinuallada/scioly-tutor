import { useState, useEffect, memo } from 'react'
import { Box, Typography, Chip, Avatar, Fade, Link } from '@mui/material'
import ScienceIcon from '@mui/icons-material/Science'
import BrokenImageIcon from '@mui/icons-material/BrokenImage'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import ReactMarkdown from 'react-markdown'
import type { ChatMessage } from '../types'

/** Fetches an image via JS (so we can attach auth headers) and returns an object URL. */
function AuthImage({ src, alt }: { src: string; alt: string }) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    let objectUrl: string | null = null
    const token = localStorage.getItem('google_id_token')
    fetch(src, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => {
        if (!res.ok) throw new Error(`${res.status}`)
        return res.blob()
      })
      .then((blob) => {
        if (!cancelled) {
          objectUrl = URL.createObjectURL(blob)
          setBlobUrl(objectUrl)
        }
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })
    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [src])

  if (error) {
    return (
      <Box sx={{ mt: 1, p: 2, bgcolor: '#fef2f2', borderRadius: '10px', border: '1px dashed #fecaca', display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <BrokenImageIcon sx={{ color: '#f87171', fontSize: 28 }} />
        <Box>
          <Typography variant="caption" sx={{ color: '#dc2626', fontWeight: 600, display: 'block' }}>Image could not be loaded</Typography>
          {alt && <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.65rem' }}>{alt}</Typography>}
        </Box>
      </Box>
    )
  }

  if (!blobUrl) {
    return (
      <Box sx={{ mt: 1, width: '100%', height: 120, bgcolor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="caption" sx={{ color: '#94a3b8' }}>Loading image...</Typography>
      </Box>
    )
  }

  return (
    <Box
      component="img"
      src={blobUrl}
      alt={alt}
      loading="lazy"
      sx={{ mt: 1, maxWidth: '100%', borderRadius: '10px', border: '1px solid #e2e8f0' }}
    />
  )
}

/** Encode spaces/special chars in /api/images/ URLs so ReactMarkdown can parse them. */
function encodeImageUrls(content: string): string {
  return content.replace(
    /!\[([^\]]*)\]\(\/api\/images\/([^)]+)\)/g,
    (_match, alt: string, filename: string) => {
      const encoded = encodeURIComponent(decodeURIComponent(filename.trim()))
      return `![${alt}](/api/images/${encoded})`
    },
  )
}

const INTENT_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  quiz: { bg: '#faf5ff', color: '#7c3aed', border: '#e9d5ff' },
  explain: { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' },
  summarize: { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
  general: { bg: '#f8fafc', color: '#64748b', border: '#e2e8f0' },
  error: { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
}

interface Props {
  message: ChatMessage
  isStreaming?: boolean
}

function MessageBubble({ message, isStreaming }: Props) {
  const isUser = message.role === 'user'
  const sourcesWithUrl = (message.source_details ?? []).filter((s) => s.source_url)

  return (
    <Fade in timeout={300}>
      <Box className={`flex items-start gap-3 px-4 py-3 ${isUser ? 'flex-row-reverse' : ''}`}>
        {!isUser && (
          <Avatar sx={{ bgcolor: '#2563eb', width: 32, height: 32, mt: 0.5 }}>
            <ScienceIcon sx={{ fontSize: 18 }} />
          </Avatar>
        )}
        <Box
          className={`${isUser ? 'max-w-[75%] ml-auto' : ''}`}
          sx={{
            ...(isUser ? { maxWidth: 640 } : {}),
            ...(isUser
              ? {
                  bgcolor: '#2563eb',
                  color: 'white',
                  borderRadius: '18px 18px 4px 18px',
                  px: 2.5,
                  py: 1.5,
                }
              : {
                  bgcolor: 'white',
                  borderRadius: '18px 18px 18px 4px',
                  px: 2.5,
                  py: 1.5,
                  border: '1px solid #e2e8f0',
                }),
          }}
        >
          {isUser ? (
            <Typography sx={{ fontSize: '0.9rem', lineHeight: 1.6 }}>
              {message.content}
            </Typography>
          ) : (
            <Box className={`markdown-content${isStreaming ? ' streaming-cursor' : ''}`} sx={{ fontSize: '0.9rem' }}>
              <ReactMarkdown
                components={{
                  img: ({ src, alt }) => {
                    const raw = src ?? ''
                    if (raw.startsWith('/api/images/')) {
                      // URL-encode filename for spaces/special chars
                      const filename = raw.slice('/api/images/'.length)
                      const encoded = '/api/images/' + encodeURIComponent(decodeURIComponent(filename))
                      return <AuthImage src={encoded} alt={alt ?? 'image'} />
                    }
                    return (
                      <Box
                        component="img"
                        src={raw}
                        alt={alt ?? 'image'}
                        loading="lazy"
                        sx={{ mt: 1, maxWidth: '100%', borderRadius: '10px', border: '1px solid #e2e8f0' }}
                      />
                    )
                  },
                }}
              >
                {encodeImageUrls(message.content)}
              </ReactMarkdown>
            </Box>
          )}
          {!isUser && message.intent && (
            <>
              <Box sx={{ borderTop: '1px solid #f1f5f9', mt: 2, pt: 1.5 }} className="flex items-center gap-2 flex-wrap">
                <Chip
                  size="small"
                  label={message.intent}
                  sx={{
                    height: 22,
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    bgcolor: (INTENT_COLORS[message.intent] ?? INTENT_COLORS.general).bg,
                    color: (INTENT_COLORS[message.intent] ?? INTENT_COLORS.general).color,
                    border: `1px solid ${(INTENT_COLORS[message.intent] ?? INTENT_COLORS.general).border}`,
                  }}
                />
                {(message.sources_used ?? 0) > 0 && (
                  <Chip
                    size="small"
                    label={`${message.sources_used} sources`}
                    sx={{ height: 20, fontSize: '0.65rem', bgcolor: '#f8fafc', color: '#94a3b8', border: '1px solid #e2e8f0' }}
                  />
                )}
              </Box>
            </>
          )}
          {!isUser && sourcesWithUrl.length > 0 && (
            <Box className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
              {sourcesWithUrl.map((s, i) => (
                <Link
                  key={i}
                  href={s.source_url!}
                  target="_blank"
                  rel="noopener noreferrer"
                  underline="hover"
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.5,
                    fontSize: '0.7rem',
                    color: '#2563eb',
                  }}
                >
                  <OpenInNewIcon sx={{ fontSize: 12 }} />
                  {s.source_file}
                  {s.page_or_slide && (
                    <Typography component="span" sx={{ fontSize: '0.65rem', color: '#94a3b8' }}>
                      ({s.source_type === 'pptx' ? 'Slide' : 'Page'} {s.page_or_slide})
                    </Typography>
                  )}
                </Link>
              ))}
            </Box>
          )}
        </Box>
      </Box>
    </Fade>
  )
}

export default memo(MessageBubble)
