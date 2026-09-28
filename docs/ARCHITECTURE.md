# POLARIS Architecture

POLARIS is a source-grounded Antarctic research knowledge platform that converts heterogeneous research assets into searchable, traceable and reviewable knowledge.

The system follows a pipeline:

```text
Research Assets
      ↓
Ingestion & Processing
      ↓
Knowledge Repository
      ↓
Hybrid Retrieval & Ranking
      ↓
Grounded Knowledge Engine
      ↓
Applications & Content Studio
      ↓
Human Review
      ↓
Verified Knowledge & Outreach
```

---

## System Architecture

```text
                         ┌──────────────────────────┐
                         │        Browser           │
                         │  Researcher / Educator   │
                         └────────────┬─────────────┘
                                      │
                                      ▼
                         ┌──────────────────────────┐
                         │    Next.js Frontend      │
                         │        :3000             │
                         │                          │
                         │ • Archive / Search       │
                         │ • Knowledge Engine       │
                         │ • Polar Explorer         │
                         │ • Dataset Registry       │
                         │ • Content Studio         │
                         │ • Review & Publishing    │
                         └────────────┬─────────────┘
                                      │ REST API
                                      ▼
                         ┌──────────────────────────┐
                         │      FastAPI Backend     │
                         │     :8001 host           │
                         │     :8000 container      │
                         └────────────┬─────────────┘
                                      │
                 ┌────────────────────┼────────────────────┐
                 │                    │                    │
                 ▼                    ▼                    ▼
        ┌────────────────┐   ┌────────────────┐   ┌────────────────┐
        │   PostgreSQL   │   │     Redis      │   │     Worker     │
        │   + pgvector   │   │                │   │                │
        │                │   │ • Caching      │   │ • Background   │
        │ • Documents    │   │ • Queues       │   │   processing   │
        │ • Chunks       │   │                │   │                │
        │ • Metadata     │   └────────────────┘   └────────────────┘
        │ • Review data  │
        │ • Sources      │
        └────────────────┘
```

---

## Docker Network

The complete development environment runs through Docker Compose.

| Service    | Container Port | Host Port |
|------------|----------------|-----------|
| Frontend   | 3000           | 3000      |
| Backend    | 8000           | 8001      |
| PostgreSQL | 5432           | 5433      |
| Redis      | 6379           | 6379      |

PostgreSQL is exposed on host port `5433` to avoid conflicts with an existing local PostgreSQL installation.

Inside the Docker network, the backend connects to PostgreSQL using:

```text
postgres:5432
```

The host-side `5433` mapping is only for local access and debugging.

---

## Knowledge Pipeline

POLARIS processes research material through the following stages:

```text
┌───────────────────────┐
│  Research Assets      │
│                       │
│ Reports               │
│ Publications          │
│ Datasets              │
│ Images / Videos       │
│ Archives              │
└───────────┬───────────┘
            │
            ▼
┌───────────────────────┐
│ Ingestion & Processing│
│                       │
│ OCR / Text Extraction │
│ Metadata Extraction   │
│ Document Cleaning     │
│ Chunking              │
│ Media Transcription   │
└───────────┬───────────┘
            │
            ▼
┌───────────────────────┐
│ Knowledge Repository  │
│                       │
│ Documents             │
│ Chunks                │
│ Metadata              │
│ Sources               │
│ Research Entities     │
└───────────┬───────────┘
            │
            ▼
┌───────────────────────┐
│ Knowledge Engine      │
│                       │
│ Query Normalization   │
│ Term Expansion        │
│ Document Retrieval    │
│ Hybrid / Lexical Rank │
│ Evidence Selection    │
└───────────┬───────────┘
            │
            ▼
┌───────────────────────┐
│ Grounded Answer       │
│                       │
│ Answer                │
│ Source IDs            │
│ Retrieved Passages    │
│ Evidence Trail        │
└───────────┬───────────┘
            │
            ▼
┌───────────────────────┐
│ Applications          │
│                       │
│ Search                │
│ Polar Explorer        │
│ Dataset Registry      │
│ Content Studio        │
│ Education             │
└───────────┬───────────┘
            │
            ▼
┌───────────────────────┐
│ Human Review          │
│                       │
│ Draft → Review        │
│ → Changes Requested   │
│ → Approved → Published│
└───────────────────────┘
```

---

## Knowledge Engine

The Knowledge Engine is implemented as a source-first retrieval pipeline inside FastAPI.

The current implementation performs:

- Query normalization
- Query term and alias expansion
- Document and chunk retrieval
- Metadata-aware relevance scoring
- Evidence selection
- Grounded extractive answer construction
- Explicit source linking
- Retrieved-passage presentation

The API returns both the generated answer and the evidence used to construct it.

A simplified response structure is:

```text
User Query
    ↓
Query Normalization
    ↓
Term / Alias Expansion
    ↓
Document + Chunk Retrieval
    ↓
Relevance Ranking
    ↓
Evidence Selection
    ↓
Grounded Answer
    +
Sources
    +
Retrieved Passages
```

This source-first design keeps the knowledge layer traceable and reduces unsupported answers.

---

## Source Ingestion

POLARIS supports ingestion of:

- PDF
- DOCX
- TXT
- Markdown

The ingestion workflow is:

```text
Uploaded Source
      ↓
File Storage
      ↓
Text Extraction
      ↓
Metadata Extraction
      ↓
Document Cleaning
      ↓
Deterministic Chunking
      ↓
PostgreSQL
      ↓
document_chunks
      ↓
Knowledge Engine
```

Each ingested source can retain metadata such as:

- title
- source type
- publication / document year
- region
- original source
- extracted text
- document chunks
- provenance information

---

## Retrieval & Knowledge Representation

POLARIS uses PostgreSQL as the primary knowledge repository.

The architecture provides a foundation for:

- Full-text retrieval
- Lexical relevance ranking
- Fuzzy matching through `pg_trgm`
- Vector search through `pgvector`
- Document-level metadata filtering
- Chunk-level evidence retrieval
- Source provenance

The current demonstration primarily relies on deterministic, source-first retrieval and ranking. Vector/embedding retrieval can be extended within the existing PostgreSQL-based architecture without changing the frontend API contract.

---

## Content Studio & Human Review

Retrieved knowledge can be transformed into structured public-facing content through the Content Studio.

Supported content workflows include:

```text
Research Sources
      ↓
Grounded Draft
      ↓
Content Editing
      ↓
Human Review
      ├── Request Changes
      │       ↓
      │    Edit Draft
      │       ↓
      │    Review Again
      │
      └── Approve
              ↓
          Publish
              ↓
     Published Knowledge
```

This creates a human-in-the-loop workflow where generated content remains traceable to its underlying research sources.

---

## Polar Explorer

The Polar Explorer provides a spatial interface for Antarctic research information.

The map layer combines:

- Research stations
- Station coordinates
- Expedition information
- Geographic context
- Source-linked research information

Station information is served through the backend API rather than being limited to decorative/static map elements.

---

## Evaluation

POLARIS includes an internal Antarctic RAG benchmark containing:

- 50 research questions
- Expected evidence sources
- Expected factual keywords
- Per-question evaluation
- Aggregate retrieval and answer-coverage metrics

Current benchmark results:

| Metric                    | Result |
|---------------------------|--------|
| Source Recall@5           | 92%    |
| Answer Keyword Coverage   | 88%    |

> These metrics measure evidence retrieval and expected-keyword coverage; they should not be interpreted as independent factual-accuracy measurements.

---

## Deployment Architecture

The project is containerized using Docker Compose.

```text
                    Docker Compose
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
    Frontend          Backend          Services
    Next.js           FastAPI        PostgreSQL
    :3000              :8000           Redis
                                      Worker
```

The production deployment can replace or extend individual infrastructure components without changing the core frontend workflow or knowledge model.

---

## Design Principles

POLARIS follows five architectural principles:

### 1. Source First
Research sources remain the foundation of every knowledge operation.

### 2. Traceability
Answers and generated content retain links to their supporting sources and retrieved evidence.

### 3. Modular Processing
Ingestion, retrieval, ranking, generation and publishing are separated so individual components can evolve independently.

### 4. Human in the Loop
Public-facing generated content passes through an explicit review workflow.

### 5. Extensible Knowledge Layer
The PostgreSQL + retrieval architecture provides a foundation for future embedding models, larger corpora, additional modalities and external LLM/RAG providers.
