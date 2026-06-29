export declare enum UserRole {
    SUPER_ADMIN = "SUPER_ADMIN",
    ADMIN = "ADMIN",
    MANAGER = "MANAGER",
    AGENT = "AGENT",
    USER = "USER"
}
export declare enum UserStatus {
    ACTIVE = "ACTIVE",
    SUSPENDED = "SUSPENDED",
    PENDING = "PENDING"
}
export declare enum BetSide {
    BACK = "BACK",
    LAY = "LAY"
}
export declare enum BetStatus {
    OPEN = "OPEN",
    MATCHED = "MATCHED",
    WON = "WON",
    LOST = "LOST",
    VOID = "VOID",
    CANCELLED = "CANCELLED"
}
export declare enum LedgerEntryType {
    CREDIT = "CREDIT",
    DEBIT = "DEBIT"
}
export declare enum LedgerReferenceType {
    MANUAL_CREDIT = "MANUAL_CREDIT",
    MANUAL_DEBIT = "MANUAL_DEBIT",
    DEPOSIT = "DEPOSIT",
    WITHDRAWAL = "WITHDRAWAL",
    BET_STAKE = "BET_STAKE",
    BET_WIN = "BET_WIN",
    BET_REFUND = "BET_REFUND",
    COMMISSION = "COMMISSION",
    CASINO_BET = "CASINO_BET",
    CASINO_WIN = "CASINO_WIN"
}
export declare enum WithdrawalStatus {
    PENDING = "PENDING",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED",
    PAID = "PAID"
}
export declare enum DepositStatus {
    PENDING = "PENDING",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED"
}
export declare enum GameCategory {
    LIVE_DEALER = "LIVE_DEALER",
    AVIATOR = "AVIATOR",
    SLOTS = "SLOTS",
    TABLE = "TABLE",
    CRASH = "CRASH"
}
export declare enum GameSessionStatus {
    ACTIVE = "ACTIVE",
    CLOSED = "CLOSED",
    EXPIRED = "EXPIRED"
}
export declare enum EventStatus {
    UPCOMING = "UPCOMING",
    IN_PLAY = "IN_PLAY",
    SUSPENDED = "SUSPENDED",
    CLOSED = "CLOSED",
    SETTLED = "SETTLED"
}
export declare enum MarketStatus {
    OPEN = "OPEN",
    SUSPENDED = "SUSPENDED",
    CLOSED = "CLOSED",
    SETTLED = "SETTLED"
}
export declare enum KycStatus {
    NOT_SUBMITTED = "NOT_SUBMITTED",
    PENDING = "PENDING",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED"
}
export declare const ROLE_HIERARCHY: Record<UserRole, UserRole[]>;
export declare const ROLE_LEVEL: Record<UserRole, number>;
export declare function canManageRole(actorRole: UserRole, targetRole: UserRole): boolean;
export declare function canManageUser(actorRole: UserRole, targetRole: UserRole): boolean;
export declare const PERMISSIONS: {
    readonly MANAGE_PLATFORM: readonly [UserRole.SUPER_ADMIN];
    readonly MANAGE_GAME_CATALOG: readonly [UserRole.SUPER_ADMIN];
    readonly VIEW_GAME_CATALOG: readonly [UserRole.SUPER_ADMIN, UserRole.ADMIN];
    readonly CREATE_ADMIN: readonly [UserRole.SUPER_ADMIN];
    readonly CREATE_MANAGER: readonly [UserRole.SUPER_ADMIN, UserRole.ADMIN];
    readonly CREATE_AGENT: readonly [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER];
    readonly CREATE_USER: readonly [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.AGENT];
    readonly CREDIT_WALLET: readonly [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.AGENT];
    readonly VIEW_DOWNLINE: readonly [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.AGENT];
    readonly APPROVE_WITHDRAWAL: readonly [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.AGENT];
    readonly PLACE_BETS: readonly [UserRole.USER];
    readonly REQUEST_WITHDRAWAL: readonly [UserRole.USER];
    readonly VIEW_AUDIT: readonly [UserRole.SUPER_ADMIN, UserRole.ADMIN];
    readonly MANAGE_KYC: readonly [UserRole.SUPER_ADMIN, UserRole.ADMIN];
    readonly VIEW_REPORTS: readonly [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER];
};
export declare function hasPermission(role: UserRole, permission: keyof typeof PERMISSIONS): boolean;
export * from './types';
