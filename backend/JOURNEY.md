# POLARIS Backend

The backend of **POLARIS** — a source-grounded knowledge and discovery platform for polar research data, documents, publications and multimedia.

The backend acts as the central orchestration layer between the frontend, database, retrieval/knowledge pipeline, background processing services and external data sources.

---

## 1. Why We Built the Backend

Polar research information is distributed across different datasets, reports, publications, media resources and scientific sources.

The problem was not simply storing this information.

The harder problem was building a system that could:

- ingest heterogeneous research resources
- organize them into a searchable knowledge layer
- retrieve relevant sources for a user query
- preserve source grounding
- expose structured information through APIs
- support multimedia discovery
- allow the frontend to consume everything through a unified interface
- remain deployable as a modular system

We therefore designed the backend as the core service responsible for connecting these components.

---

## 2. Backend Development Approach

We developed the backend incrementally instead of trying to build the entire system at once.

The development process roughly followed:

```text
Problem Definition
       ↓
Backend API Design
       ↓
Database Integration
       ↓
Data / Document Handling
       ↓
Knowledge Retrieval
       ↓
Background Processing
       ↓
Frontend Integration
       ↓
Dockerized Deployment
       ↓
Testing & Stabilization
```

Each stage introduced different engineering problems that had to be solved before moving forward.

---

## 3. Initial Architecture

The first version focused on establishing a working API layer.

The backend was responsible for:

- receiving requests from the frontend
- validating input
- communicating with the database
- processing uploaded resources
- exposing search/discovery functionality
- returning structured responses

The initial objective was deliberately simple:

> Build a stable backend contract first, then connect the knowledge and processing layers around it.

This prevented the frontend and backend from becoming tightly coupled to unfinished internal logic.

---

## 4. Core Backend Architecture

The final backend is designed around multiple cooperating services.

```text
                    ┌───────────────────┐
                    │     Frontend      │
                    │   Next.js / UI    │
                    └─────────┬─────────┘
                              │
                              ▼
                    ┌───────────────────┐
                    │    API Backend    │
                    │                   │
                    │ Request Handling  │
                    │ Search / Retrieval│
                    │ Source Grounding  │
                    │ Resource APIs     │
                    └───────┬─────┬─────┘
                            │     │
                 ┌──────────┘     └──────────┐
                 ▼                           ▼
        ┌─────────────────┐         ┌─────────────────┐
        │    PostgreSQL   │         │      Redis      │
        │                 │         │                 │
        │ Metadata        │         │ Cache / Queue   │
        │ Resources       │         │ Background Jobs │
        │ Research Data   │         │                 │
        └─────────────────┘         └────────┬────────┘
                                             │
                                             ▼
                                    ┌─────────────────┐
                                    │      Worker     │
                                    │                 │
                                    │ Data Processing │
                                    │ Ingestion       │
                                    │ Heavy Tasks     │
                                    └─────────────────┘
```

The architecture separates API serving from background processing so that expensive operations do not unnecessarily block user-facing requests.

---

## 5. Technologies

**Backend**
- Python
- FastAPI
- REST APIs
- PostgreSQL
- Redis
- Docker
- Docker Compose

**Supporting Components**
- Background worker
- Persistent data storage
- Upload/data processing pipeline
- Source-aware retrieval layer

---

## 6. Development Challenges

Building the backend exposed several practical problems that were not obvious during the initial architecture design.

### 6.1 Connecting Multiple Services

One of the first challenges was getting the backend, PostgreSQL, Redis, worker and frontend to communicate correctly.

Running individual services locally was easy. The difficult part was making the entire system work together.

We had to deal with:

- service-to-service networking
- container names vs `localhost`
- exposed ports
- environment variables
- startup order
- database connectivity
- Redis connectivity

Docker Compose was eventually used to make the complete development environment reproducible.

---

## 7. Docker Networking Problem

A recurring issue during development was the difference between accessing services from the host machine and accessing them from another Docker container.

For example:

```text
Browser
   │
   └── localhost:8001
          │
          ▼
      Backend
```

but inside Docker:

```text
Frontend Container
       │
       └── backend:8000
                    │
                    ▼
                 Backend
```

Using `localhost` inside a container does not refer to another container. It refers to the current container itself.

This required separating:

- browser-facing URLs
- container-to-container service URLs
- environment-specific configuration

This became an important part of stabilizing the development setup.

---

## 8. Frontend ↔ Backend Integration

Another major issue appeared when connecting the frontend to the API.

The UI could render correctly while API requests were still failing.

Typical causes included:

- incorrect API base URL
- incorrect exposed port
- CORS configuration
- backend startup failures
- mismatched endpoint paths
- environment variable configuration

Instead of hardcoding API URLs throughout the frontend, the architecture was moved toward environment-based configuration.

This made the application easier to run locally and inside Docker.

---

## 9. Database Integration

PostgreSQL was introduced as the persistent storage layer.

The database is intended to store structured information associated with the knowledge ecosystem, including metadata and research resources.

The important design principle was:

```text
Files / External Sources
          ↓
      Processing
          ↓
       Metadata
          ↓
      PostgreSQL
          ↓
       Retrieval
          ↓
        API
          ↓
      Frontend
```

This separates raw resources from the structured metadata required by the application.

---

## 10. Redis and Background Processing

Not every operation should happen directly inside an API request.

Operations such as ingestion and heavier processing can take significantly longer than normal API requests.

Redis was therefore introduced as supporting infrastructure for caching and background task coordination.

The conceptual flow became:

```text
User Request
     ↓
   API
     ↓
Queue / Redis
     ↓
  Worker
     ↓
Processing
     ↓
Database / Storage
```

This allows the API layer to remain responsive while processing continues separately.

---

## 11. Knowledge Retrieval

One of the most important backend responsibilities is supporting source-grounded knowledge retrieval.

The intended pipeline is:

```text
User Query
    ↓
Query Processing
    ↓
Relevant Resource Retrieval
    ↓
Source Selection
    ↓
Context Construction
    ↓
Answer / Result Generation
    ↓
Source References
```

The central design principle is that generated information should remain connected to the underlying source material.

POLARIS therefore treats retrieval and source grounding as first-class backend responsibilities rather than treating the AI layer as an isolated chatbot.

---

## 12. Source Grounding

A major requirement was avoiding answers that could not be traced back to research material.

Instead of:

```text
Question
   ↓
LLM
   ↓
Answer
```

the backend is designed around:

```text
Question
   ↓
Retriever
   ↓
Relevant Sources
   ↓
Context
   ↓
Generation
   ↓
Grounded Response
   ↓
Source References
```

This architecture is particularly important for scientific and research-oriented information where traceability matters.

---

## 13. API Design

The API layer acts as the contract between the frontend and backend.

The endpoints are organized around application capabilities rather than exposing internal implementation details.

Conceptually:

```text
/api
 ├── search
 ├── resources
 ├── datasets
 ├── documents
 ├── media
 ├── knowledge
 └── content
```

The frontend interacts with these APIs rather than directly accessing the database or internal processing components.

This keeps the system modular.

---

## 14. Error Handling

During development, several failures were initially difficult to diagnose because an API error could originate from multiple layers.

For example:

```text
Frontend
   ↓
API
   ↓
Database
   ↓
Worker
   ↓
External Resource
```

A failure anywhere in this chain could appear as a generic frontend error.

We therefore separated responsibilities and added clearer logging and service-level debugging.

The goal was to make failures traceable to their actual layer instead of debugging blindly from the UI.

---

## 15. Configuration

Environment variables are used for configuration rather than committing credentials or machine-specific settings.

Example:

```env
DATABASE_URL=
REDIS_URL=
API_PORT=
CORS_ORIGINS=
```

A template environment file is provided so that developers can understand the required configuration without exposing secrets.

---

## 16. Dockerized Development

The backend is designed to run as part of the complete POLARIS Docker environment.

The service architecture includes:

- `polaris_backend`
- `polaris_postgres`
- `polaris_redis`
- `polaris_worker`
- `polaris_frontend`

The objective was to make the project reproducible instead of requiring every dependency to be manually installed and configured.

---

## 17. Running the Backend

Clone the repository:

```bash
git clone <repository-url>
cd POLARIS
```

Create the environment file:

```bash
cp .env.example .env
```

Then start the development environment:

```bash
docker compose up --build
```

The backend can then be accessed through the configured API port.

For local development without Docker, install the Python dependencies:

```bash
pip install -r backend/requirements.txt
```

and start the API server:

```bash
uvicorn backend.app:app --reload
```

---

## 18. Development Lessons

The biggest lesson from building the backend was that the difficult part was not writing individual API endpoints. The difficult part was making all the components behave as one system.

The major engineering lessons were:

### 1. Design the service boundaries early
Separating API, database, Redis and worker responsibilities prevented the backend from becoming one large monolithic process.

### 2. Environment configuration matters
A system that works only on the developer's machine is not a finished system.

### 3. Debug from the architecture, not just the UI
When something fails, trace:

```text
Frontend
 → API
 → Service
 → Database / Redis
 → Worker
 → External Source
```

instead of repeatedly modifying frontend code.

### 4. Retrieval must remain source-aware
For a scientific knowledge platform, producing an answer is not enough. The system also needs to identify where that information came from.

### 5. Build incrementally
The backend was developed in stages:

```text
API
 ↓
Database
 ↓
Services
 ↓
Retrieval
 ↓
Worker
 ↓
Frontend Integration
 ↓
Docker
 ↓
Stabilization
```

This made debugging significantly more manageable.

---

## 19. Current Role of the Backend

The backend is the central orchestration layer of POLARIS.

It connects:

```text
                 POLARIS
                    │
        ┌───────────┼───────────┐
        ▼           ▼           ▼
     Search      Research      Media
        │           │           │
        └───────────┼───────────┘
                    ▼
             Knowledge Layer
                    │
              Source Grounding
                    │
                    ▼
                  API
                    │
                    ▼
                Frontend
```

The architecture is designed to support future expansion without requiring the frontend or core API contract to be completely rewritten.

---

## 20. Future Improvements

Potential future improvements include:

- stronger retrieval ranking
- larger-scale ingestion
- additional scientific data sources
- asynchronous ingestion pipelines
- improved caching
- richer metadata extraction
- advanced multimodal retrieval
- authentication and role-based access
- monitoring and observability
- production-grade deployment infrastructure