# Phase 2 — Full Platform Features

Implemented in this codebase beyond MVP:

## Sports Exchange (Production-Grade)
- [x] Order book entries with partial matching (`OrderMatchingService`)
- [x] Cash-out endpoint (`POST /api/sports/bets/:id/cashout`)
- [x] Exposure calculation (`GET /api/sports/exposure`)
- [x] Order book view (`GET /api/sports/orderbook/:runnerId`)
- [ ] Full automated matching loop (cron job — wire `matchOrders` on interval)
- [ ] In-play delay rules
- [ ] Void rules engine

## Casino (Production)
- [x] Game catalog CRUD (Super Admin)
- [x] Session management with expiry
- [x] Webhook reconciliation (BET/WIN/REFUND)
- [ ] Licensed aggregator integration (replace mock embed)

## Payments (Real PKR)
- [x] Deposit webhook handler (`POST /api/payments/webhook/deposit`)
- [x] Withdrawal payout initiation (`POST /api/payments/withdrawals/:id/payout`)
- [ ] JazzCash / Easypaisa merchant API integration
- [ ] Daily reconciliation reports job

## Operations
- [x] KYC submission and admin review
- [x] Self-exclusion field on User model
- [x] Deposit limit field on User model
- [x] Branch P&L reports + CSV export
- [ ] Notification service (SMS/email)
- [ ] Native Android WebView APK

## Admin & Compliance
- [x] Immutable audit trail
- [x] Platform settings store
- [x] Commission rules per role
- [ ] Role impersonation with logging
- [ ] Geo/IP restrictions
- [ ] Backup/restore runbooks

## Production Checklist Before Go-Live
1. Obtain gambling license (Curaçao or equivalent)
2. Contract odds feed provider
3. Contract casino aggregator
4. Integrate JazzCash/Easypaisa merchant APIs
5. Legal review for target jurisdiction
6. Rotate all secrets; remove demo passwords
7. Enable HTTPS, WAF, database backups
