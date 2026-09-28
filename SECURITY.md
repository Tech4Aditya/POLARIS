# Security Policy

## POLARIS

POLARIS is a research-oriented knowledge and discovery platform designed to
work with polar datasets, publications, documents and multimedia resources.

Security is treated as part of the development process rather than as a
feature added after deployment.

---

## 1. Scope

This security policy applies to the POLARIS codebase and its major components:

- Frontend
- Backend API
- Database
- Redis
- Background worker
- Data ingestion and processing scripts
- Docker / Docker Compose configuration
- Environment configuration
- Documentation and deployment configuration

---

## 2. Security Principles

POLARIS follows a few basic security principles during development:

### No secrets in source control

Credentials, API keys, database passwords and other sensitive configuration
should never be committed directly to the repository.

Environment-specific configuration should be stored through environment
variables.

Example:

```env
DATABASE_URL=
REDIS_URL=
API_KEY=