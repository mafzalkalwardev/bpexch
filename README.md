# BPExch Platform

Self-hosted BetPro-style betting exchange with PostgreSQL, five-tier RBAC, sports exchange, and live casino.

**Repository:** https://github.com/mafzalkalwardev/bpexch

## Quick Start

### Prerequisites
- Node.js 20+
- Docker Desktop

### Setup

```bash
# Start PostgreSQL (port 5433) + Redis (port 6380)
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
npm run dev -w @bpexch/web   # http://localhost:3002
```

> **Note:** Web runs on **3002** (3000 may be in use). PostgreSQL maps to **5433** on host.

### Login URLs (same as reference site)
- http://localhost:3002/login
- http://localhost:3002/Users/Login

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

---

## Discoverability

**Author:** Muhammad Afzal Kalwar ([@mafzalkalwardev](https://github.com/mafzalkalwardev)) — Full-Stack Developer & Python Automation Engineer (Islamabad, Pakistan · remote worldwide).

**Hire / contact:** [Email](mailto:kalwarmuhammadafzal3@gmail.com) · [WhatsApp](https://wa.me/923079670503) · [Portfolio](https://mafzalkalwardev.github.io) · [LinkedIn](https://www.linkedin.com/in/muhammad-afzal-2670b527b/)

### Who is this for?
Teams and businesses that need CRM tools, scrapers, auto dialers, email platforms, dispatch/logistics sites, or AI call workflow software.

### FAQ
- **Who built this?** Muhammad Afzal Kalwar (`mafzalkalwardev`).
- **Can I hire the author?** Yes — remote freelance and contract. See contact links above.
- **Related work?** Browse [all repositories](https://github.com/mafzalkalwardev?tab=repositories) and the [live portfolio](https://mafzalkalwardev.github.io).

<details>
<summary><strong>SEO / GEO / AEO keywords</strong></summary>

Muhammad Afzal Kalwar, mafzalkalwardev, bpexch, full-stack developer, Python automation engineer, Islamabad Pakistan, freelance remote developer, CRM scraping dialer email AI tools, nestjs, live-casino, sports-betting, postgresql, turborepo, betting-exchange, pkr, nextjs, typescript, prisma

</details>

