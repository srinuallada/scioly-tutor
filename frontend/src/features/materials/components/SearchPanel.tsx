import { useState } from 'react'
import { Box, TextField, Typography, Paper, Chip, InputAdornment, CircularProgress } from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import { searchMaterials } from '../../../lib/api/search'

interface SearchResult {
  source_file: string
  section_title: string
  content: string
  relevance_score: number
  source_type: string
  page_or_slide?: number
}

export default function SearchPanel() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [searched, setSearched] = useState(false)

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
            endAdornment: searching ? (
              <InputAdornment position="end">
                <CircularProgress size={18} />
              </InputAdornment>
            ) : undefined,
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
            <Paper key={i} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
              <Box className="px-4 py-2 flex items-center gap-2 flex-wrap" sx={{ bgcolor: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                <Chip size="small" label={r.source_file} sx={{ height: 22, fontSize: '0.65rem', bgcolor: '#eff6ff', color: '#2563eb', fontWeight: 600, border: '1px solid #bfdbfe' }} />
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.7rem' }}>{r.section_title}</Typography>
                {r.page_or_slide && (
                  <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.65rem' }}>
                    {r.source_type === 'pptx' ? 'Slide' : 'Page'} {r.page_or_slide}
                  </Typography>
                )}
                <Typography variant="caption" sx={{ ml: 'auto', color: '#94a3b8', fontSize: '0.6rem' }}>
                  score: {r.relevance_score}
                </Typography>
              </Box>
              <Box className="px-4 py-3">
                <Typography variant="body2" sx={{ fontSize: '0.825rem', color: '#334155', lineHeight: 1.65 }}>
                  {r.content.length > 400 ? r.content.slice(0, 400) + '...' : r.content}
                </Typography>
              </Box>
            </Paper>
          ))}
        </Box>
      )}
    </Box>
  )
}
