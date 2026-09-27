
# Architecture

Browser
  ↓
Next.js frontend :3000
  ↓
FastAPI :8001 host / :8000 container
  ├── PostgreSQL + pgvector
  ├── Redis
  └── Worker

PostgreSQL is exposed on host :5433 to avoid conflicts with an existing local PostgreSQL.
The backend still connects to postgres:5432 inside the Docker network.


## Knowledge Engine
The current demo implements a source-first retrieval pipeline inside FastAPI:
- query normalization
- indexed document retrieval
- chunking
- lexical relevance ranking
- extractive answer selection
- explicit source IDs and retrieved passages

This is deliberately deterministic. A production LLM/RAG provider can be inserted after retrieval without changing the frontend contract.


## Source ingestion
`POST /api/documents/upload` accepts PDF, DOCX, TXT and Markdown sources. The backend stores the file, extracts text, creates deterministic chunks, inserts the document into PostgreSQL and creates `document_chunks` records. This is the ingestion layer that can later feed embedding generation and hybrid/vector retrieval.
