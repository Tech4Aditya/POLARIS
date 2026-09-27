# POLARIS RAG Evaluation

## What is measured

This benchmark contains 50 Antarctic research questions tied to the preloaded POLARIS corpus. It measures two reproducible signals against the live `/api/knowledge/ask` endpoint:

1. **Source Recall@5** — whether at least one expected evidence source appears in the top five returned sources.
2. **Answer Keyword Coverage** — the fraction of curated factual keywords present in the returned answer.

These are **not equivalent to human-judged factual accuracy**. They are retrieval/grounding proxies and should not be presented as an overall AI accuracy percentage.

## Run

With POLARIS running:

```bash
python scripts/evaluation/evaluate_rag.py --base http://localhost:8001
```

The script writes `docs/evaluation/latest_results.json` and prints the aggregate metrics.

## Recommended PPT wording

Report the actual measured values as:

> **RAG benchmark (50 questions): Source Recall@5 = X%; Answer Keyword Coverage = Y%.**

Do not label either metric simply as “AI accuracy”. If human evaluation is added later, report that separately as answer correctness / citation correctness with the evaluation protocol and sample size.
