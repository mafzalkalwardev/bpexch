# BPExch Platform

Self-hosted BetPro-style betting exchange with PostgreSQL, five-tier RBAC, sports exchange, and live casino.

## Quick Start

### Prerequisites
- Node.js 20+
- Docker Desktop

### Setup

```bash
# Start PostgreSQL + Redis
npm run docker:up

# Install dependencies
npm install

# Configure environment
cp .env.example .env

# Database
npm run db:push
npm run db:seed

# Development (two terminals)
npm run dev -w @bpexch/api   # http://localhost:3001
npm run dev -w @bpexch/web   # http://localhost:3000
```

### Discovery Scraper (optional)

```bash
# Set credentials in .env: BPEXCH_USER, BPEXCH_PASS
npm run discovery
# Output: docs/discovery/
```

## Demo Accounts

| User | Password | Role |
|------|----------|------|
| demo | User@123 | User |
| agent | Agent@123 | Agent |
| admin | Admin@123 | Admin |

## Project Structure

```
apps/api/          NestJS backend
apps/web/          Next.js frontend
packages/db/       Prisma schema + seed
packages/shared/   Shared types + RBAC
tools/discovery/   Playwright reference scraper
docs/              PRD, MVP spec, discovery artifacts
```
## Architecture summary

flowchart LR
  Web[Next.js :3000] --> API[NestJS :3001]
  API --> PG[(PostgreSQL)]
  API --> WS[WebSocket odds]
  Casino[Casino iframe] --> API



## Documentation

- [PRD](docs/PRD.md)
- [MVP Spec](docs/MVP-SPEC.md)
