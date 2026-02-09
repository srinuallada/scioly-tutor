# Architecture

## Overview

SciOly Tutor is a local-first Science Olympiad study assistant with a React frontend and FastAPI backend. It processes uploaded study materials, indexes them with BM25, and provides AI-powered tutoring via Google Gemini's free tier.

## Request Flow

```
Browser → Vite dev proxy (/api/*) → FastAPI

POST /api/chat:
  1. classify_intent(message)     — rule-based, no LLM (free, instant)
  2. search_engine.search(query)  — BM25 keyword search (free, instant)
  3. build_prompt(intent, context) — assemble system prompt
  4. gemini_chat(messages, prompt) — single LLM call
  5. format_response(text, intent) — extract quiz data if applicable
  6. save to chat_history          — SQLite
```

## Layer Responsibilities

| Layer | Directory | Imports Allowed |
|-------|-----------|-----------------|
| **api/** | HTTP + validation | services, schemas |
| **services/** | Orchestration | domain, agent, retrieval, llm, storage |
| **domain/** | Business types | stdlib only |
| **agent/** | Pipeline logic | domain |
| **retrieval/** | Document processing + search | domain |
| **llm/** | Gemini API | settings |
| **storage/** | SQLite CRUD | settings |

## Key Design Decisions

See `docs/adr/` for architecture decision records.

- **BM25 over embeddings**: Scientific terminology (cochlea, mitosis) matches well with keyword search. Zero cost.
- **Rule-based classifier**: Pattern matching for intent detection. No LLM call wasted on routing.
- **Single LLM call per request**: Only Gemini is called, and only once, at the final step.
- **SQLite for everything**: Quiz results, chat history, study progress. Single portable file.
- **Gemini 2.5 Flash free tier**: 1,000 req/day, no credit card. Sufficient for personal study.
