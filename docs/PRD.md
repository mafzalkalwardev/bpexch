# BPExch Platform — Product Requirements Document

**Version:** 1.0  
**Date:** June 2026  
**Status:** Approved for MVP build

---

## 1. Product Vision

Build a self-hosted, BetPro-style peer-to-peer betting exchange platform for the Pakistani market (PKR), with a five-tier agent hierarchy, sports exchange (back/lay), live casino via iframe integrations, and a double-entry wallet ledger — fully managed on our infrastructure with PostgreSQL.

## 2. Personas

| Persona | Description |
|---------|-------------|
| **Super Admin** | Platform owner. Manages settings, game catalog, admins, audit. |
| **Admin** | Regional operator. Manages managers, views branch P&L. |
| **Manager** | Oversees agents in a branch. Creates agents, views downline. |
| **Agent** | Front-line operator. Creates users, credits wallets, handles deposits/withdrawals locally. |
| **User** | Bettor. Places sports/casino bets, requests deposits/withdrawals. |

## 3. User Stories

### Super Admin
- As Super Admin, I can create Admin accounts and configure platform settings.
- As Super Admin, I can manage the casino game catalog and view full audit logs.

### Admin / Manager / Agent
- As an Agent, I can create User accounts under my branch and credit their wallet (manual deposit).
- As a Manager, I can view aggregate downline balances and P&L reports.
- As an Admin, I can approve pending withdrawal requests for my branch.

### User
- As a User, I can log in, view my PKR balance, and browse sports markets.
- As a User, I can place back/lay bets on cricket and football markets.
- As a User, I can launch live casino games in an iframe with wallet integration.
- As a User, I can request deposits (via agent) and withdrawals (JazzCash/Easypaisa).

## 4. Functional Requirements

### 4.1 Authentication & RBAC
- JWT access + refresh tokens
- Role hierarchy: Super Admin → Admin → Manager → Agent → User
- Permission guards on all API endpoints
- Hierarchy closure table for fast downline queries

### 4.2 Wallet & Ledger
- Double-entry immutable ledger (no balance change without ledger row)
- Idempotency keys on all financial operations
- Agent manual credit (MVP deposit flow)
- Withdrawal request → approval workflow
- Commission accrual stub on bet placement

### 4.3 Sports Exchange
- Events, markets, runners synced from odds feed (mock in MVP)
- Back and Lay bet placement with liability calculation
- Live odds via WebSocket (30s sync in MVP)
- Settlement on event result (admin triggers in MVP)
- Order book entries (Phase 2 matching engine foundation)

### 4.4 Live Casino
- Game catalog with categories: Live Dealer, Aviator, Slots, Table, Crash
- Game launcher returns iframe URL + session token
- Provider webhook for BET/WIN/REFUND → ledger integration
- Mock sandbox embed for MVP; licensed aggregator in production

### 4.5 Admin & Reporting
- Downline list with balances
- Branch P&L report
- CSV export
- Audit log viewer
- Pending withdrawal queue

## 5. Non-Functional Requirements

| Requirement | Target |
|-------------|--------|
| Uptime | 99.9% (production) |
| Audit trail | Immutable, all financial actions logged |
| i18n | English + Urdu (Phase 2 UI) |
| Mobile | Responsive PWA (MVP); native APK (Phase 2) |
| Security | bcrypt passwords, JWT, rate limiting, webhook secrets |

## 6. Compliance

- **Licensing:** Curaçao eGaming or equivalent offshore license required before real-money go-live.
- **KYC:** Document upload + admin review queue (implemented in Phase 2 module).
- **Responsible gambling:** Deposit limits, self-exclusion fields on User model.
- **Age gate:** 18+ confirmation on registration (Phase 2).
- **Legal review:** Required for PKR real-money operations in target jurisdiction.

## 7. Integration Shortlist

| Domain | MVP | Production |
|--------|-----|------------|
| **Odds feed** | Mock drift simulator | Betfair Exchange API / Sportradar / OddsMatrix |
| **Casino** | Mock iframe embed | SoftSwiss / EveryMatrix / Evolution direct |
| **Payments** | Manual agent credit | JazzCash / Easypaisa merchant APIs |
| **Notifications** | — | SMS / WhatsApp / Push (Phase 2) |

## 8. Out of Scope (MVP)

- Native Android APK
- WhatsApp bot registration
- Crypto payment rails
- Full P2P order book matching
- Cash-out / partial hedge
- Automated PKR payout

## 9. MVP Success Criteria

1. Super Admin seeds hierarchy; Agent creates User and credits PKR balance.
2. User places back/lay cricket bet; balance updates on settlement.
3. User opens live casino game in iframe; wallet debits/credits via webhook.
4. All actions appear in audit log and ledger — reconcilable.

## 10. Screen Inventory

- Login
- Dashboard (role-aware quick links)
- Sports (market grid, bet slip, in-play filter)
- Casino (lobby, iframe player)
- Wallet (balance, deposit/withdraw request, statement)
- Agent Panel (create user, credit, downline)
- Admin Dashboard (stats, withdrawals, audit, P&L)
