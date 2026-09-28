# POLARIS Deployment Guide

This document describes the development and deployment architecture used to
run POLARIS as a collection of cooperating services.

---

## 1. Deployment Architecture

POLARIS is designed around a containerized architecture.

```text
                         USER
                           │
                           ▼
                    ┌─────────────┐
                    │  Frontend   │
                    └──────┬──────┘
                           │
                           ▼
                    ┌─────────────┐
                    │   Backend   │
                    └──────┬──────┘
                           │
                ┌──────────┼──────────┐
                ▼          ▼          ▼
           PostgreSQL    Redis      Worker
                │          │          │
                └──────────┼──────────┘
                           ▼
                    Research Data
```

Docker Compose is used to coordinate the services during development and
deployment.

---

## 2. Services

The POLARIS environment can contain:

```text
polaris_frontend
polaris_backend
polaris_postgres
polaris_redis
polaris_worker
```

| Service | Responsibility |
|---|---|
| Frontend | User interface |
| Backend | API and application logic |
| PostgreSQL | Persistent structured data |
| Redis | Caching / task coordination |
| Worker | Background processing |

The exact service names should match the current `docker-compose.yml`.

---

## 3. Prerequisites

Recommended prerequisites:

- Git
- Docker
- Docker Compose
- Node.js for direct frontend development
- Python for direct backend development

Verify Docker:

```bash
docker --version
docker compose version
```

---

## 4. Clone the Repository

```bash
git clone <repository-url>
cd POLARIS
```

---

## 5. Environment Configuration

Create the local environment file:

```bash
cp .env.example .env
```

Review all variables before starting the system.

Typical configuration may include:

```env
DATABASE_URL=
REDIS_URL=
API_PORT=
CORS_ORIGINS=
```

Never commit the actual `.env` file.

---

## 6. Start the Complete Environment

From the project root:

```bash
docker compose up --build
```

Verify the services:

```bash
docker compose ps
```

---

## 7. Run in Detached Mode

```bash
docker compose up -d --build
```

View all logs:

```bash
docker compose logs
```

View logs for one service:

```bash
docker compose logs backend
```

---

## 8. Stop the Environment

```bash
docker compose down
```

Named volumes are normally preserved unless explicitly removed.

---

## 9. Rebuild a Service

For an individual service:

```bash
docker compose build backend
docker compose up backend
```

or:

```bash
docker compose build frontend
docker compose up frontend
```

For major dependency or Dockerfile changes, rebuild the complete environment.

---

## 10. Database

PostgreSQL provides persistent structured storage.

The backend communicates with PostgreSQL through the Docker network.

```text
Backend
   │
   ▼
PostgreSQL
   │
   ▼
Persistent Storage
```

The database should not be unnecessarily exposed to the public internet.

---

## 11. Redis

Redis is used as supporting infrastructure for caching and background task
coordination.

```text
Backend
   │
   ▼
 Redis
   │
   ▼
 Worker
```

Redis should normally remain inside the internal application network.

---

## 12. Worker

The worker handles processing that should not block normal API requests.

```text
Frontend
   ↓
Backend
   ↓
Redis / Queue
   ↓
Worker
   ↓
Processing
   ↓
Database / Storage
```

---

## 13. Frontend Development

For direct frontend development:

```bash
cd frontend
npm install
npm run dev
```

Configure the frontend with the correct backend API URL.

---

## 14. Backend Development

For direct backend development:

```bash
cd backend
pip install -r requirements.txt
```

Then start the API using the application module defined by the current backend
structure.

Example:

```bash
uvicorn app:app --reload
```

---

## 15. Docker Networking

Host and container networking behave differently.

From the browser:

```text
localhost:<frontend-port>
```

Inside Docker:

```text
frontend container
       │
       ▼
backend:<internal-port>
```

Containers should communicate using Docker service names rather than assuming
that `localhost` refers to another container.

---

## 16. Port Configuration

Port mappings should be treated as deployment configuration.

The authoritative port mapping is the current `docker-compose.yml`.

Internal services such as PostgreSQL and Redis do not need public host ports
unless there is a specific operational requirement.

---

## 17. Production Considerations

The development Compose environment should not automatically be treated as a
hardened production deployment.

Before production:

- configure production secrets
- restrict CORS
- enable HTTPS
- avoid exposing internal services
- disable debug behavior
- review container permissions
- configure persistent storage
- configure backups
- review dependencies
- configure monitoring and logging
- add authentication and authorization where required

---

## 18. Data Persistence

Persistent data should use Docker volumes or managed external storage where
appropriate.

```text
PostgreSQL
    │
    ▼
Persistent Volume
```

Before deleting volumes, verify whether they contain required project data.

---

## 19. Health Verification

After deployment, verify the system layer by layer:

```text
1. Containers running
        ↓
2. Backend responding
        ↓
3. Database reachable
        ↓
4. Redis reachable
        ↓
5. Worker functioning
        ↓
6. Frontend loading
        ↓
7. Frontend API requests succeeding
```

Useful commands:

```bash
docker compose ps
docker compose logs
```

---

## 20. Troubleshooting

### Frontend loads but API requests fail

Check:

```text
API base URL
CORS
Backend port
Backend logs
Docker networking
```

### Backend cannot connect to PostgreSQL

Check:

```text
DATABASE_URL
PostgreSQL container status
Database credentials
Docker network
Database startup logs
```

### Backend cannot connect to Redis

Check:

```text
REDIS_URL
Redis container status
Docker service name
Redis logs
```

### Worker is not processing jobs

Check:

```text
Redis connection
Worker container status
Worker logs
Queue configuration
```

### Changes are not appearing

Rebuild the affected service:

```bash
docker compose build <service>
docker compose up <service>
```

---

## 21. Deployment Checklist

- [ ] `.env` configured
- [ ] No secrets committed
- [ ] Docker images build successfully
- [ ] Required containers start
- [ ] PostgreSQL is reachable
- [ ] Redis is reachable
- [ ] Worker starts correctly
- [ ] Backend API responds
- [ ] Frontend loads
- [ ] Frontend can reach backend
- [ ] CORS configured correctly
- [ ] Persistent storage configured
- [ ] Internal services are not unnecessarily exposed
- [ ] Production HTTPS configured
- [ ] Logs reviewed
- [ ] Backup strategy configured

---

## 22. Deployment Philosophy

The objective of the POLARIS deployment architecture is reproducibility.

Instead of requiring developers to manually configure every dependency, the
project packages the major services into a coordinated environment:

```text
                  Docker Compose
                       │
       ┌───────────────┼────────────────┐
       ▼               ▼                ▼
   Frontend         Backend          Worker
                       │                │
                       ▼                ▼
                   PostgreSQL         Redis
```

This makes the development environment easier to reproduce and provides a
clear path toward more production-oriented deployment infrastructure.
