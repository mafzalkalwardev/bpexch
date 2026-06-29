# BPExch MVP Specification

## Architecture

```
apps/api     — NestJS REST + WebSocket (port 3001)
apps/web     — Next.js 14 App Router (port 3000)
packages/db  — Prisma + PostgreSQL schema
packages/shared — RBAC enums, DTOs, permissions
tools/discovery — Playwright scraper for reference site inventory
```

## Database

PostgreSQL 16 via Docker Compose. Run:

```bash
npm run docker:up
cp .env.example .env
npm install
npm run db:push
npm run db:seed
```

## Seed Accounts

| Username | Password | Role |
|----------|----------|------|
| superadmin | SuperAdmin@123 | SUPER_ADMIN |
| admin | Admin@123 | ADMIN |
| manager | Manager@123 | MANAGER |
| agent | Agent@123 | AGENT |
| demo | User@123 | USER |
| user1 | User@123 | USER |

## API Endpoints (MVP)

### Auth
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `GET /api/auth/me`

### Users
- `POST /api/users` — create downline user
- `GET /api/users/downline`
- `GET /api/users/hierarchy`

### Wallet
- `GET /api/wallet/balance`
- `GET /api/wallet/statement`
- `POST /api/wallet/credit`
- `POST /api/wallet/withdraw`
- `POST /api/wallet/deposit-request`
- `POST /api/wallet/withdrawals/approve`

### Sports
- `GET /api/sports/events`
- `POST /api/sports/bets`
- `GET /api/sports/bets/my`
- `POST /api/sports/events/:id/settle` — admin only
- WebSocket `/sports` — odds updates

### Casino
- `GET /api/casino/games`
- `POST /api/casino/launch`
- `GET /api/casino/embed/:sessionId`
- `POST /api/casino/webhook`

### Admin / Reports
- `GET /api/admin/stats`
- `GET /api/admin/audit`
- `GET /api/reports/downline`
- `GET /api/reports/pnl`

## UAT Checklist

- [ ] Login as demo user
- [ ] View sports markets with live odds
- [ ] Place BACK bet on Pakistan vs India
- [ ] Verify balance reduced by stake
- [ ] Admin settles event; verify win/loss
- [ ] Launch Aviator casino game in iframe
- [ ] Place casino bet; verify ledger debit
- [ ] Simulate win; verify credit
- [ ] Login as agent; create new user
- [ ] Credit user wallet PKR 1000
- [ ] User requests withdrawal
- [ ] Admin approves withdrawal
- [ ] Verify audit log entries for all actions

## Staging Deploy

```bash
docker compose up -d
npm run build
npm run db:push && npm run db:seed
# Terminal 1: npm run dev -w @bpexch/api
# Terminal 2: npm run dev -w @bpexch/web
```

## Phase 2 Additions (Implemented)

- Order book matching service
- PKR payment webhooks (JazzCash/Easypaisa)
- KYC submission and review
- Branch P&L and CSV export
- Commission rules per role
- Platform settings store
