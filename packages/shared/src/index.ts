export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  AGENT = 'AGENT',
  USER = 'USER',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING = 'PENDING',
}

export enum BetSide {
  BACK = 'BACK',
  LAY = 'LAY',
}

export enum BetStatus {
  OPEN = 'OPEN',
  MATCHED = 'MATCHED',
  WON = 'WON',
  LOST = 'LOST',
  VOID = 'VOID',
  CANCELLED = 'CANCELLED',
}

export enum LedgerEntryType {
  CREDIT = 'CREDIT',
  DEBIT = 'DEBIT',
}

export enum LedgerReferenceType {
  MANUAL_CREDIT = 'MANUAL_CREDIT',
  MANUAL_DEBIT = 'MANUAL_DEBIT',
  DEPOSIT = 'DEPOSIT',
  WITHDRAWAL = 'WITHDRAWAL',
  BET_STAKE = 'BET_STAKE',
  BET_WIN = 'BET_WIN',
  BET_REFUND = 'BET_REFUND',
  COMMISSION = 'COMMISSION',
  CASINO_BET = 'CASINO_BET',
  CASINO_WIN = 'CASINO_WIN',
}

export enum WithdrawalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  PAID = 'PAID',
}

export enum DepositStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum GameCategory {
  LIVE_DEALER = 'LIVE_DEALER',
  AVIATOR = 'AVIATOR',
  SLOTS = 'SLOTS',
  TABLE = 'TABLE',
  CRASH = 'CRASH',
}

export enum GameSessionStatus {
  ACTIVE = 'ACTIVE',
  CLOSED = 'CLOSED',
  EXPIRED = 'EXPIRED',
}

export enum EventStatus {
  UPCOMING = 'UPCOMING',
  IN_PLAY = 'IN_PLAY',
  SUSPENDED = 'SUSPENDED',
  CLOSED = 'CLOSED',
  SETTLED = 'SETTLED',
}

export enum MarketStatus {
  OPEN = 'OPEN',
  SUSPENDED = 'SUSPENDED',
  CLOSED = 'CLOSED',
  SETTLED = 'SETTLED',
}

export enum KycStatus {
  NOT_SUBMITTED = 'NOT_SUBMITTED',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export const ROLE_HIERARCHY: Record<UserRole, UserRole[]> = {
  [UserRole.SUPER_ADMIN]: [UserRole.ADMIN],
  [UserRole.ADMIN]: [UserRole.MANAGER],
  [UserRole.MANAGER]: [UserRole.AGENT],
  [UserRole.AGENT]: [UserRole.USER],
  [UserRole.USER]: [],
};

export const ROLE_LEVEL: Record<UserRole, number> = {
  [UserRole.SUPER_ADMIN]: 5,
  [UserRole.ADMIN]: 4,
  [UserRole.MANAGER]: 3,
  [UserRole.AGENT]: 2,
  [UserRole.USER]: 1,
};

export function canManageRole(actorRole: UserRole, targetRole: UserRole): boolean {
  return ROLE_HIERARCHY[actorRole]?.includes(targetRole) ?? false;
}

export function canManageUser(actorRole: UserRole, targetRole: UserRole): boolean {
  return ROLE_LEVEL[actorRole] > ROLE_LEVEL[targetRole];
}

export const PERMISSIONS = {
  MANAGE_PLATFORM: [UserRole.SUPER_ADMIN],
  MANAGE_GAME_CATALOG: [UserRole.SUPER_ADMIN],
  VIEW_GAME_CATALOG: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
  CREATE_ADMIN: [UserRole.SUPER_ADMIN],
  CREATE_MANAGER: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
  CREATE_AGENT: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER],
  CREATE_USER: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.AGENT],
  CREDIT_WALLET: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.AGENT],
  VIEW_DOWNLINE: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.AGENT],
  APPROVE_WITHDRAWAL: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.AGENT],
  PLACE_BETS: [UserRole.USER],
  REQUEST_WITHDRAWAL: [UserRole.USER],
  VIEW_AUDIT: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
  MANAGE_KYC: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
  VIEW_REPORTS: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER],
} as const;

export function hasPermission(role: UserRole, permission: keyof typeof PERMISSIONS): boolean {
  return (PERMISSIONS[permission] as readonly UserRole[]).includes(role);
}

export * from './types';
