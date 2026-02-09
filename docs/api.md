# API Reference

Base URL: `http://localhost:8000/api`

## Endpoints

### POST /api/chat

Main chat endpoint — full agent pipeline.

**Request:**
```json
{
  "message": "Explain how the inner ear works",
  "student_name": "alex",
  "conversation_history": [
    {"role": "user", "content": "previous message"},
    {"role": "assistant", "content": "previous response"}
  ]
}
```

**Response:**
```json
{
  "response": "The inner ear has two main parts...",
  "intent": "explain",
  "sources_used": 3,
  "topics_referenced": ["Inner Ear", "Cochlea"],
  "quiz_data": null
}
```

### POST /api/upload

Upload study material files. Multipart form with `files` field.

Accepts: `.docx`, `.pptx`, `.pdf`, `.xlsx`, `.xls`, `.txt`, `.md`, `.csv`

**Response:**
```json
{
  "files_processed": [{"filename": "anatomy.docx", "status": "success", "chunks": 12}],
  "total_chunks": 42,
  "stats": {"total_chunks": 42, "total_files": 3, "total_words": 8500}
}
```

### GET /api/search?query=...&top_k=5

Search materials directly.

### GET /api/topics

List all indexed topics and stats.

### POST /api/quiz/submit

Record a quiz answer for progress tracking.

**Request:**
```json
{
  "question": "What structure converts sound to nerve signals?",
  "student_answer": "cochlea",
  "correct_answer": "cochlea",
  "topic": "Inner Ear",
  "student_name": "alex"
}
```

### GET /api/progress/{student_name}

Get study analytics: overall accuracy, per-topic breakdown, weak areas.

### GET /api/health

System status, Gemini config, material stats.
