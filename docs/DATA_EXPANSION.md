# POLARIS Data Expansion

This build expands the seeded research catalogue without changing the database schema, API contracts, RAG workflow, map implementation, Content Studio, review workflow, or evaluation benchmark.

## Target catalogue footprint

| Resource | Count |
|---|---:|
| Indexed source/document records | 50 |
| Dataset metadata records | 25 |
| Media catalogue records | 24 |
| Expedition records | 12 |
| Research stations | 12 |
| RAG benchmark queries | 50 |

## Safety / compatibility

- Existing tables and API routes are preserved.
- Seed inserts are idempotent using existing name/title conflict checks.
- Existing station deduplication and unique station-name protection are unchanged.
- Existing document chunk backfill still runs for newly seeded indexed documents.
- Media entries remain catalogue metadata; external media files are not bundled.
- Dataset entries are metadata/catalogue records pointing to external research repositories; POLARIS does not claim local copies of those datasets.
- The benchmark remains unchanged at 50 questions.
- Existing measured evaluation values are not modified by this data expansion.

## Dataset provenance examples

The expanded dataset catalogue includes Antarctic products documented by NASA NSIDC, including BedMachine Antarctica, Antarctic grounding-line products, annual and multi-year ice-velocity maps, Antarctic boundaries, grounding zones, and related cryosphere products.

Primary catalogue source: https://nsidc.org/data/measures

## Build note

The expansion is implemented in the backend startup seed layer so an existing POLARIS database can receive the additional records on startup without requiring a destructive database reset.
