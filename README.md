
# POLARIS — SIH26063 Fixed Starter

A functional starter for the Integrated Polar Science Outreach, Knowledge Repository
and Media Dissemination Portal.

## Fixed in this version
- Light mode is the default/primary theme.
- Dark mode is available from the top-right theme control.
- Clean institutional visual language; no purple/AI-template styling.
- Sidebar navigation actually changes application views.
- Search actually calls the FastAPI backend.
- Expedition records load from PostgreSQL through the API.
- Backend health/database status is shown in the UI.
- Favicon is included, eliminating the `/favicon.ico` 404.
- Responsive/mobile navigation.
- Docker host ports: frontend 3000, API 8001, PostgreSQL 5433, Redis 6379.

## Run
```powershell
copy .env.example .env
docker compose down --remove-orphans
docker compose up --build
```

Open:
- http://localhost:3000
- http://localhost:8001/docs
- http://localhost:8001/health

Internal Docker ports remain PostgreSQL 5432 and backend 8000.

## v0.9.1 milestone
The Archive now has live database search, clickable source records, a document inspection view, source metadata, extracted text, and a direct handoff into the Knowledge Engine workspace.

## v0.9.1 milestone
Added the source-grounded Knowledge Engine: ask a question, retrieve ranked indexed passages, return a grounded extractive answer, expose the evidence trail, and open supporting source records.


## v0.9.1 — Interaction + Retrieval Fix
- Natural-language archive queries now match metadata, regions, document types and aliases.
- Knowledge Engine no longer fails just because the exact query words are absent from one chunk.
- Example questions now immediately execute the Knowledge Engine.
- Interactive controls use explicit button types and keyboard focus states.


## v0.9.1 — Self-healing data + live station map
Existing Docker volumes are automatically seeded with demo documents and stations. The Polar Map now loads station coordinates from the API and supports clickable station details.

## v0.9.1 — Source Ingestion + Polar Field Palette

- Added real PDF/DOCX/TXT/Markdown source ingestion.
- Added text extraction, chunk creation and PostgreSQL indexing.
- Added persistent `data/uploads` storage through Docker.
- Added Archive → Add Source workflow with processing and success states.
- Added source metadata fields for title, type, year and region.
- Added a snowy field-notebook visual palette using expedition orange + ice blue.
- Preserved the light-first/dark-mode system.

## v0.9.1 — Build + Map Stabilization
- Fixed missing `setContentDraft` state blocking Next.js production builds.
- Replaced the previous decorative map with a real OpenStreetMap base layer and API-backed station panel.
- Added persistent upload storage mapping.


## v0.12 Demo-complete layer
- Preloaded Antarctic research corpus and dataset metadata
- Real Leaflet/OpenStreetMap station map
- Media catalogue with provenance metadata
- Human-reviewed publication library
- Knowledge -> grounded draft -> review -> publish flow
