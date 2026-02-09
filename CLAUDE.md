# SciOly Tutor — AI Study Agent for Science Olympiad

## Project Overview

A free, local-first Science Olympiad study assistant that processes learning materials (Word, PowerPoint, PDF, Excel, text files), indexes them for search, and provides an AI-powered tutoring chat using Google Gemini's free API tier.

Built for a parent helping kids prepare for varsity Science Olympiad competitions.

## Architecture

```
frontend/ (React dev server :5173)
    │
    │  REST API calls
    ▼
backend/app.py (FastAPI :8000)
    │
    ├── agent/classifier.py      ← Rule-based intent detection (no LLM call)
    ├── agent/prompt_builder.py  ← Assembles prompt with context + instructions
    ├── agent/post_processor.py  ← Formats response, extracts quiz data
    │
    ├── retrieval/processor.py   ← Extracts text from .docx/.pptx/.pdf/.xlsx/.txt/.md
    ├── retrieval/search.py      ← BM25 keyword search over chunks
    │
    ├── llm/gemini_client.py     ← Google Gemini API (free tier, 1000 req/day)
    │
    ├── storage/progress.py      ← SQLite for quiz scores & study tracking
    │
    └── data/
        ├── uploads/             ← Original uploaded files
        ├── chunks.json          ← Processed search index
        └── study_progress.db    ← SQLite database
```

## Key Design Decisions

1. **LLM called only once per request** — Intent classification and search are pure Python (free, instant). Gemini is only called at the final step to generate the response.
2. **BM25 over embeddings** — For scientific terminology (cochlea, mitosis, retina), keyword search works great and costs nothing. Upgrade path: ChromaDB.
3. **Rule-based intent classifier** — Pattern matching for quiz/explain/summarize/check_answer intents. No LLM call wasted on routing.
4. **SQLite for everything** — Quiz results, chat history, study progress. Single portable file.
5. **Gemini 2.5 Flash free tier** — 1,000 requests/day, no credit card needed. More than enough for personal study sessions.

## Tech Stack

- **Backend**: Python 3.11+, FastAPI, Uvicorn
- **Frontend**: React (Vite), plain CSS (no Tailwind build step needed)
- **LLM**: Google Gemini 2.5 Flash (free tier via google-genai SDK)
- **Search**: rank-bm25 (BM25Okapi algorithm)
- **Document Processing**: python-docx, python-pptx, pdfplumber, openpyxl
- **Database**: SQLite3 (stdlib)
- **File Storage**: Local filesystem

## Setup Instructions

### 1. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Get Gemini API Key (Free)
1. Go to https://aistudio.google.com/apikey
2. Create a free API key (no credit card required)
3. Copy `.env.example` to `.env` and paste your key:
   ```
   GEMINI_API_KEY=your_key_here
   ```

### 3. Process Study Materials
```bash
# Place .docx, .pptx, .pdf, .xlsx, .txt, .md files in data/uploads/
python -m retrieval.processor data/uploads/
```

### 4. Start Backend
```bash
uvicorn app:app --reload --port 8000
```

### 5. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 6. Open App
Visit http://localhost:5173

## Running Tests
```bash
cd backend
python -m pytest tests/ -v
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /chat | Main chat — send message, get AI response |
| POST | /upload | Upload study material files |
| GET | /search?query=... | Search materials directly |
| GET | /topics | List all indexed topics |
| POST | /quiz/submit | Record a quiz answer |
| GET | /progress/{student} | Get study analytics |
| GET | /health | System status check |

## Request/Response Formats

### POST /chat
```json
// Request
{
  "message": "Explain how the inner ear works",
  "student_name": "alex",
  "conversation_history": [
    {"role": "user", "content": "previous message"},
    {"role": "assistant", "content": "previous response"}
  ]
}

// Response
{
  "response": "The inner ear has two main parts...",
  "intent": "explain",
  "sources_used": 3,
  "topics_referenced": ["Inner Ear", "Cochlea", "Vestibular System"]
}
```

### POST /upload
Multipart form with `files` field. Accepts .docx, .pptx, .pdf, .xlsx, .txt, .md

## Current Status

**✅ Implemented (Starter)**
- Document processor for all file types (.docx, .pptx, .pdf, .xlsx, .txt, .md)
- BM25 search engine with tokenization
- Intent classifier (rule-based)
- Prompt builder with intent-specific instructions
- Gemini API client (free tier)
- SQLite progress tracking (schema + basic CRUD)
- FastAPI app with all endpoints wired together
- React frontend with chat UI, material upload, and progress view
- CORS configured for local development

**🔲 Next Steps (Priority Order)**
1. Add streaming responses (SSE from FastAPI → React)
2. Add quiz mode UI — structured Q&A with answer submission
3. Add spaced repetition logic to progress tracker
4. Improve chunk splitting — smarter boundaries for large documents
5. Add conversation memory/context window management
6. Add topic-based study planner (suggest what to study next based on weak areas)
7. Add document preview in materials tab
8. Add export study notes feature
9. Docker setup for easy deployment
10. Oracle Cloud deployment scripts

## File Descriptions

- `backend/app.py` — FastAPI application, all route handlers
- `backend/agent/classifier.py` — Intent classification (quiz, explain, summarize, etc.)
- `backend/agent/prompt_builder.py` — Builds LLM prompts with search context
- `backend/agent/post_processor.py` — Parses and formats LLM responses
- `backend/retrieval/processor.py` — Document extraction and chunking
- `backend/retrieval/search.py` — BM25 search engine
- `backend/llm/gemini_client.py` — Gemini API wrapper
- `backend/storage/progress.py` — SQLite operations for tracking
- `frontend/src/App.jsx` — Main React app with routing
- `frontend/src/components/Chat.jsx` — Chat interface component
- `frontend/src/components/Upload.jsx` — Material upload component
- `frontend/src/components/Progress.jsx` — Study progress dashboard

## Code Conventions

- Python: type hints on all functions, docstrings on all public functions
- No classes where a function will do — keep it simple
- Error handling: try/except at API boundary, let errors propagate internally
- Frontend: functional components with hooks, no class components
- API responses always include appropriate HTTP status codes
