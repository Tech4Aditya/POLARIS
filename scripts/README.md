# POLARIS Scripts

This directory contains repeatable utilities for preparing, evaluating, maintaining and resetting the POLARIS demonstration environment.

---

## Directory Structure

```text
scripts/
├── README.md
├── evaluation/
│   └── evaluate_rag.py
├── seed/
│   └── ...
├── ingestion/
│   └── ...
├── maintenance/
│   └── ...
└── demo/
    └── ...
```

---

## Script Categories

### Data & Knowledge Base

Scripts related to preparing and populating the POLARIS knowledge base.

- Seed initial Antarctic research data
- Ingest documents
- Extract and process source content
- Create searchable document chunks
- Prepare indexing data

### Evaluation

Scripts used to reproduce POLARIS evaluation results.

```text
scripts/
└── evaluation/
    └── evaluate_rag.py
```

Example:

```bash
python scripts/evaluation/evaluate_rag.py \
  --base http://localhost:8001
```

The evaluation currently uses a 50-question Antarctic research benchmark and reports:

- Source Recall@5
- Answer Keyword Coverage
- Per-question PASS/FAIL results

### Demo & Development

Utilities for preparing a clean demonstration environment.

Typical operations include:

- Seed demo records
- Reset demo state
- Rebuild searchable content
- Prepare local development data

### Backup & Maintenance

Utilities for preserving or maintaining local POLARIS data.

> **Warning:** These scripts should be run only when their purpose and effect are understood, especially when they modify the PostgreSQL database or uploaded source data.

---

## Recommended Workflow

### 1. Start the POLARIS environment

```bash
docker compose up --build
```

### 2. Prepare the demo data

```bash
# Run the relevant seed script
python scripts/<script-name>.py
```

### 3. Run the RAG evaluation

```bash
python scripts/evaluation/evaluate_rag.py \
  --base http://localhost:8001
```

---

## Design Principle

Scripts should be:

- Repeatable
- Explicit about their inputs and outputs
- Safe to run during development
- Independent of manual UI actions where possible
- Documented when they modify persistent data

The scripts exist to make the POLARIS demo and evaluation process reproducible rather than dependent on manual setup.