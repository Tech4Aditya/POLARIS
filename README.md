# POLARIS

> **AI-powered intelligent search, discovery, and connection platform.**

POLARIS is an AI-driven platform designed to transform scattered information into meaningful, searchable knowledge and actionable connections.

It combines a modern web interface, backend services, asynchronous workers, structured data storage, and an evaluation-driven RAG pipeline into a single modular system.

---

## ✦ Why POLARIS?

Modern information systems often suffer from three problems:

- Information is scattered across multiple sources.
- Traditional keyword search struggles with context and intent.
- Finding the right information often requires manually navigating through large amounts of data.

**POLARIS** addresses this through an intelligent retrieval and reasoning pipeline that allows users to interact with information naturally instead of relying only on traditional search.

### Core idea

```text
User Query
    ↓
Intent Understanding
    ↓
Retrieval / Search
    ↓
Relevant Context
    ↓
AI Processing
    ↓
Grounded Response
    ↓
   User
```

The system is designed around retrieval quality, grounded answers, modular architecture, and measurable evaluation.

---

## 🚀 Features

### 🤖 AI-Powered Search
Understand natural-language queries and retrieve information based on semantic relevance rather than relying purely on exact keyword matching.

### 🔎 Retrieval-Augmented Generation
POLARIS uses a retrieval pipeline to provide relevant context before generating responses. This helps reduce unsupported responses and keeps generated answers grounded in retrieved information.

### 🧠 Context-Aware Responses
Instead of treating every query as an isolated keyword search, the system works with retrieved context to produce more meaningful answers.

### ⚡ Asynchronous Processing
Background workers handle processing tasks separately from the main API, keeping the application architecture scalable and responsive.

### 🌐 Modern Web Interface
A responsive Next.js frontend provides the primary user-facing interface for interacting with POLARIS.

### 🗄️ Structured Data Layer
The project includes a dedicated database initialization layer for managing application data.

### 📊 Evaluation Pipeline
POLARIS includes an evaluation framework for measuring retrieval and answer quality instead of relying only on subjective testing.

Current evaluation artifacts are available in:
```
docs/evaluation/
```

### 🐳 Dockerized Architecture
Backend and worker services include Docker configurations, with a root-level `docker-compose.yml` for running the system as a multi-service application.

---

## 🏗️ Architecture

```
                    ┌──────────────────────┐
                    │       POLARIS        │
                    │    Web Interface     │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │      Backend API     │
                    │      FastAPI         │
                    └───────┬───────┬──────┘
                            │       │
                 ┌──────────┘       └──────────┐
                 ▼                             ▼
        ┌─────────────────┐          ┌─────────────────┐
        │    Database     │          │     Worker      │
        │    / Storage    │          │  Async Tasks    │
        └─────────────────┘          └────────┬────────┘
                                              │
                                              ▼
                                   ┌────────────────────┐
                                   │ AI / RAG Pipeline  │
                                   │ Retrieval + Answer │
                                   └────────────────────┘
```

## Documentation

- **System Architecture** → [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- **Backend Development Journey** → [`backend/JOURNEY.md`](backend/JOURNEY.md)
- **Frontend Development Journey** → [`frontend/JOURNEY.md`](frontend/JOURNEY.md)

---

## 📁 Project Structure

```
POLARIS/
│
├── backend/
│   ├── Dockerfile
│   ├── app.py
│   └── requirements.txt
│
├── frontend/
│   ├── app/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── public/
│   ├── Dockerfile
│   ├── package.json
│   └── next.config.ts
│
├── worker/
│   ├── Dockerfile
│   ├── worker.py
│   └── requirements.txt
│
├── database/
│   └── init.sql
│
├── data/
│   └── uploads/
│
├── scripts/
│   └── evaluation/
│       ├── evaluate_rag.py
│       └── questions.json
│
├── docs/
│   ├── ARCHITECTURE.md
│   ├── PRODUCT.md
│   ├── PPT_MAPPING.md
│   └── evaluation/
│       ├── RAG_EVALUATION.md
│       └── latest_results.json
│
├── docker-compose.yml
├── .env.example
├── .gitignore
├── LICENSE
└── README.md
```

---

## 🛠️ Tech Stack

**Frontend**
- Next.js
- React
- TypeScript
- CSS

**Backend**
- Python
- FastAPI

**AI / Retrieval**
- Retrieval-Augmented Generation (RAG)
- Semantic retrieval
- Context-grounded response generation
- Automated evaluation pipeline

**Infrastructure**
- Docker
- Docker Compose
- Background worker architecture

**Database**
- SQL-based persistent storage

---

## ⚙️ Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/<YOUR_USERNAME>/POLARIS.git
cd POLARIS
```

### 2. Configure environment variables

Create your local environment file:
```bash
cp .env.example .env
```

On Windows PowerShell:
```powershell
Copy-Item .env.example .env
```

Add the required API keys and configuration values to `.env`.

> **Never commit `.env` to GitHub.**

---

## 🐳 Run with Docker

The recommended way to start the complete application is:
```bash
docker compose up --build
```

To run in detached mode:
```bash
docker compose up --build -d
```

To stop the services:
```bash
docker compose down
```

---

## 💻 Development

### Frontend
```bash
cd frontend
npm install
npm run dev
```
The frontend development server will start using the Next.js development environment.

### Backend

Create and activate a Python virtual environment:
```bash
python -m venv .venv
```

Windows:
```bash
.venv\Scripts\activate
```

Linux / macOS:
```bash
source .venv/bin/activate
```

Install dependencies:
```bash
pip install -r backend/requirements.txt
```

Start the API:
```bash
uvicorn backend.app:app --reload
```

---

## 📊 Evaluation

POLARIS includes a dedicated evaluation pipeline to measure the quality of the retrieval and answer-generation system.

Evaluation scripts are located in:
```
scripts/evaluation/
```

Run:
```bash
python scripts/evaluation/evaluate_rag.py
```

Evaluation results are stored under:
```
docs/evaluation/
```

The repository currently tracks metrics including:
- Retrieval recall
- Answer keyword coverage
- Retrieval quality
- Response grounding

This makes the system measurable rather than purely demonstrative.

---

## 🔬 Engineering Approach

POLARIS follows a few core principles:

1. **Retrieval before generation** — The system prioritizes retrieving useful context before generating an answer.
2. **Modular architecture** — Frontend, backend, worker, database, and evaluation components remain separated so individual components can evolve independently.
3. **Evaluation-driven development** — Changes to the retrieval pipeline can be measured against an evaluation set instead of relying only on manual testing.
4. **Reproducibility** — Configuration, evaluation scripts, architecture documentation, and deployment files are maintained inside the repository.
5. **Security by default** — Secrets and environment-specific configuration are excluded from version control through `.gitignore` and `.env` based configuration.

---

## 📚 Documentation

| Document | Description |
|---|---|
| [`ARCHITECTURE.md`](docs/ARCHITECTURE.md) | System architecture and component interaction |
| [`PRODUCT.md`](docs/PRODUCT.md) | Product concept and functionality |
| [`PPT_MAPPING.md`](docs/PPT_MAPPING.md) | Mapping between implementation and presentation |
| [`RAG_EVALUATION.md`](docs/evaluation/RAG_EVALUATION.md) | RAG evaluation methodology |
| [`latest_results.json`](docs/evaluation/latest_results.json) | Latest evaluation results |

---

## 🔐 Environment Variables

Use `.env.example` as the template for local configuration.

```
.env.example
    ↓
copy to
    ↓
.env
```

**Never commit API keys, credentials, database passwords, or other secrets.**

---

## 🧪 Development Status

POLARIS is an actively developed project.

**Current system components include:**

- [x] Web interface
- [x] Backend API
- [x] Database layer
- [x] Background worker
- [x] Docker configuration
- [x] RAG pipeline
- [x] Evaluation framework
- [x] Retrieval evaluation
- [x] Answer quality evaluation
- [ ] Further retrieval optimization
- [ ] Expanded evaluation datasets
- [ ] Production deployment hardening

---

## 🎯 Vision

POLARIS is built around a simple idea:

> Finding the right information should not require knowing exactly where it is.

The goal is to build an intelligent system that can understand what a user is looking for, retrieve the most relevant information, and turn that information into a useful, grounded response.

---

## 👥 Team

1) Ujwal Parasher
2) Namya Jain
3) Krrish Rawat
4) Shaurya Gupta
5) Aditya Pandey
6) Akriti Srivastava

Built with a focus on:

**AI • Retrieval • Software Engineering • Human-Centered Search**