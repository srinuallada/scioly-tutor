import { useMemo, useState } from 'react'
import {
  Box, TextField, Typography, Paper, Chip, InputAdornment, CircularProgress, Link, IconButton,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import { searchMaterials } from '../../../lib/api/search'

interface SearchResult {
  source_file: string
  section_title: string
  content: string
  relevance_score: number
  source_type: string
  page_or_slide?: number
  source_url?: string
}

export default function SearchPanel() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [searched, setSearched] = useState(false)

  const queryTokens = useMemo(
    () => query.trim().split(/\s+/).filter(Boolean),
    [query],
  )

  const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

  const highlight = (text: string) => {
    if (queryTokens.length === 0) return text
    const pattern = queryTokens.map(escapeRegExp).join('|')
    const regex = new RegExp(`(${pattern})`, 'gi')
    const parts = text.split(regex)
    return parts.map((part, idx) => (
      idx % 2 === 1
        ? <mark key={idx} style={{ background: '#fef3c7', padding: '0 2px' }}>{part}</mark>
        : part
    ))
  }

  const scoreLabel = (score: number) => {
    if (score >= 0.75) return 'Best match'
    if (score >= 0.45) return 'Good match'
    return 'Weak match'
  }

  const handleSearch = async () => {
    const q = query.trim()
    if (!q) return
    setSearching(true)
    setSearched(true)
    try {
      const res = await searchMaterials(q)
      setResults(res.results as SearchResult[])
    } catch {
      setResults([])
    } finally {
      setSearching(false)
    }
  }

  return (
    <Box>
      <TextField
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') handleSearch() }}
        placeholder="Search your study materials..."
        size="small"
        fullWidth
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ fontSize: 20, color: '#94a3b8' }} />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                {searching ? (
                  <CircularProgress size={18} />
                ) : (
                  <IconButton
                    size="small"
                    onClick={handleSearch}
                    aria-label="Search"
                    sx={{ color: '#2563eb' }}
                  >
                    <SearchIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                )}
              </InputAdornment>
            ),
          },
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: '12px', bgcolor: 'white', fontSize: '0.875rem',
            '& fieldset': { borderColor: '#e2e8f0' },
            '&:hover fieldset': { borderColor: '#93c5fd' },
            '&.Mui-focused fieldset': { borderColor: '#2563eb', borderWidth: 1.5 },
          },
        }}
      />

      {searched && !searching && results.length === 0 && (
        <Typography variant="body2" sx={{ color: '#94a3b8', textAlign: 'center', mt: 3, fontSize: '0.85rem' }}>
          No results found for "{query}"
        </Typography>
      )}

      {results.length > 0 && (
        <Box className="space-y-3 mt-4">
          <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600 }}>
            {results.length} result{results.length > 1 ? 's' : ''} found
          </Typography>
          {results.map((r, i) => (
            <Paper key={i} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
              <Box className="px-4 py-2 flex items-center gap-2 flex-wrap" sx={{ bgcolor: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                <Chip size="small" label={r.source_file} sx={{ height: 22, fontSize: '0.65rem', bgcolor: '#eff6ff', color: '#2563eb', fontWeight: 600, border: '1px solid #bfdbfe' }} />
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.7rem' }}>{r.section_title}</Typography>
                {r.page_or_slide && (
                  <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.65rem' }}>
                    {r.source_type === 'pptx' ? 'Slide' : 'Page'} {r.page_or_slide}
                  </Typography>
                )}
                {r.source_url && (
                  <Link
                    href={r.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    underline="hover"
                    onClick={(e) => e.stopPropagation()}
                    sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.3, fontSize: '0.65rem', color: '#2563eb' }}
                  >
                    <OpenInNewIcon sx={{ fontSize: 11 }} />
                    View
                  </Link>
                )}
                <Chip
                  size="small"
                  label={scoreLabel(r.relevance_score)}
                  sx={{
                    ml: 'auto', height: 20, fontSize: '0.6rem', fontWeight: 600,
                    ...(r.relevance_score >= 0.75
                      ? { bgcolor: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }
                      : r.relevance_score >= 0.45
                        ? { bgcolor: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' }
                        : { bgcolor: '#f1f5f9', color: '#64748b' }),
                  }}
                />
              </Box>
              <Box className="px-4 py-3">
                <Typography variant="body2" sx={{ fontSize: '0.825rem', color: '#334155', lineHeight: 1.65 }}>
                  {highlight(r.content.length > 400 ? r.content.slice(0, 400) + '...' : r.content)}
                </Typography>
              </Box>
            </Paper>
          ))}
        </Box>
      )}
    </Box>
  )
}
