import { BetSide, BetStatus, GameCategory, UserRole, WithdrawalStatus } from './index';
export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}
export interface JwtPayload {
    sub: string;
    username: string;
    role: UserRole;
}
export interface CreateUserDto {
    username: string;
    password: string;
    role: UserRole;
    parentId?: string;
    locale?: string;
    phone?: string;
}
export interface LoginDto {
    username: string;
    password: string;
}
export interface CreditWalletDto {
    userId: string;
    amount: number;
    note?: string;
    idempotencyKey?: string;
}
export interface PlaceBetDto {
    runnerId: string;
    side: BetSide;
    odds: number;
    stake: number;
}
export interface LaunchGameDto {
    gameId: string;
}
export interface WithdrawalRequestDto {
    amount: number;
    paymentMethod: string;
    accountDetails: string;
}
export interface DepositRequestDto {
    amount: number;
    paymentMethod: string;
    reference?: string;
}
export interface CasinoWebhookDto {
    sessionId: string;
    transactionId: string;
    type: 'BET' | 'WIN' | 'REFUND';
    amount: number;
    signature?: string;
}
export interface PaginatedQuery {
    page?: number;
    limit?: number;
}
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}
export interface UserSummary {
    id: string;
    username: string;
    role: UserRole;
    status: string;
    balance?: number;
    parentId?: string | null;
    createdAt: string;
}
export interface MarketView {
    id: string;
    name: string;
    eventName: string;
    sport: string;
    status: string;
    runners: RunnerOdds[];
}
export interface RunnerOdds {
    id: string;
    name: string;
    backPrice: number;
    layPrice: number;
}
export interface BetView {
    id: string;
    runnerName: string;
    marketName: string;
    eventName: string;
    side: BetSide;
    odds: number;
    stake: number;
    status: BetStatus;
    potentialProfit: number;
    createdAt: string;
}
export interface GameView {
    id: string;
    name: string;
    category: GameCategory;
    provider: string;
    thumbnailUrl?: string;
    isActive: boolean;
}
export interface LaunchGameResponse {
    iframeUrl: string;
    sessionId: string;
    expiresAt: string;
}
export interface LedgerEntryView {
    id: string;
    type: string;
    amount: number;
    balanceAfter: number;
    referenceType: string;
    note?: string;
    createdAt: string;
}
export interface WithdrawalView {
    id: string;
    amount: number;
    status: WithdrawalStatus;
    paymentMethod: string;
    createdAt: string;
}
export interface DownlineReport {
    userId: string;
    username: string;
    role: UserRole;
    balance: number;
    totalBets: number;
    totalStaked: number;
    childCount: number;
}
export interface OrderBookEntry {
    id: string;
    runnerId: string;
    side: BetSide;
    odds: number;
    stake: number;
    remainingStake: number;
    userId: string;
    createdAt: string;
}
export interface ExposureSummary {
    userId: string;
    totalExposure: number;
    marketExposures: {
        marketId: string;
        exposure: number;
    }[];
}
export interface KycSubmissionDto {
    documentType: string;
    documentNumber: string;
    documentUrl: string;
}
export interface CommissionRuleDto {
    role: UserRole;
    sportPercent: number;
    casinoPercent: number;
}
export interface PaymentWebhookDto {
    provider: 'JAZZCASH' | 'EASYPAISA' | 'BANK';
    transactionId: string;
    amount: number;
    userId: string;
    status: 'SUCCESS' | 'FAILED';
    signature?: string;
}
