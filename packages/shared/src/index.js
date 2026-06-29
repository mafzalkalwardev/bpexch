"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PERMISSIONS = exports.ROLE_LEVEL = exports.ROLE_HIERARCHY = exports.KycStatus = exports.MarketStatus = exports.EventStatus = exports.GameSessionStatus = exports.GameCategory = exports.DepositStatus = exports.WithdrawalStatus = exports.LedgerReferenceType = exports.LedgerEntryType = exports.BetStatus = exports.BetSide = exports.UserStatus = exports.UserRole = void 0;
exports.canManageRole = canManageRole;
exports.canManageUser = canManageUser;
exports.hasPermission = hasPermission;
var UserRole;
(function (UserRole) {
    UserRole["SUPER_ADMIN"] = "SUPER_ADMIN";
    UserRole["ADMIN"] = "ADMIN";
    UserRole["MANAGER"] = "MANAGER";
    UserRole["AGENT"] = "AGENT";
    UserRole["USER"] = "USER";
})(UserRole || (exports.UserRole = UserRole = {}));
var UserStatus;
(function (UserStatus) {
    UserStatus["ACTIVE"] = "ACTIVE";
    UserStatus["SUSPENDED"] = "SUSPENDED";
    UserStatus["PENDING"] = "PENDING";
})(UserStatus || (exports.UserStatus = UserStatus = {}));
var BetSide;
(function (BetSide) {
    BetSide["BACK"] = "BACK";
    BetSide["LAY"] = "LAY";
})(BetSide || (exports.BetSide = BetSide = {}));
var BetStatus;
(function (BetStatus) {
    BetStatus["OPEN"] = "OPEN";
    BetStatus["MATCHED"] = "MATCHED";
    BetStatus["WON"] = "WON";
    BetStatus["LOST"] = "LOST";
    BetStatus["VOID"] = "VOID";
    BetStatus["CANCELLED"] = "CANCELLED";
})(BetStatus || (exports.BetStatus = BetStatus = {}));
var LedgerEntryType;
(function (LedgerEntryType) {
    LedgerEntryType["CREDIT"] = "CREDIT";
    LedgerEntryType["DEBIT"] = "DEBIT";
})(LedgerEntryType || (exports.LedgerEntryType = LedgerEntryType = {}));
var LedgerReferenceType;
(function (LedgerReferenceType) {
    LedgerReferenceType["MANUAL_CREDIT"] = "MANUAL_CREDIT";
    LedgerReferenceType["MANUAL_DEBIT"] = "MANUAL_DEBIT";
    LedgerReferenceType["DEPOSIT"] = "DEPOSIT";
    LedgerReferenceType["WITHDRAWAL"] = "WITHDRAWAL";
    LedgerReferenceType["BET_STAKE"] = "BET_STAKE";
    LedgerReferenceType["BET_WIN"] = "BET_WIN";
    LedgerReferenceType["BET_REFUND"] = "BET_REFUND";
    LedgerReferenceType["COMMISSION"] = "COMMISSION";
    LedgerReferenceType["CASINO_BET"] = "CASINO_BET";
    LedgerReferenceType["CASINO_WIN"] = "CASINO_WIN";
})(LedgerReferenceType || (exports.LedgerReferenceType = LedgerReferenceType = {}));
var WithdrawalStatus;
(function (WithdrawalStatus) {
    WithdrawalStatus["PENDING"] = "PENDING";
    WithdrawalStatus["APPROVED"] = "APPROVED";
    WithdrawalStatus["REJECTED"] = "REJECTED";
    WithdrawalStatus["PAID"] = "PAID";
})(WithdrawalStatus || (exports.WithdrawalStatus = WithdrawalStatus = {}));
var DepositStatus;
(function (DepositStatus) {
    DepositStatus["PENDING"] = "PENDING";
    DepositStatus["APPROVED"] = "APPROVED";
    DepositStatus["REJECTED"] = "REJECTED";
})(DepositStatus || (exports.DepositStatus = DepositStatus = {}));
var GameCategory;
(function (GameCategory) {
    GameCategory["LIVE_DEALER"] = "LIVE_DEALER";
    GameCategory["AVIATOR"] = "AVIATOR";
    GameCategory["SLOTS"] = "SLOTS";
    GameCategory["TABLE"] = "TABLE";
    GameCategory["CRASH"] = "CRASH";
})(GameCategory || (exports.GameCategory = GameCategory = {}));
var GameSessionStatus;
(function (GameSessionStatus) {
    GameSessionStatus["ACTIVE"] = "ACTIVE";
    GameSessionStatus["CLOSED"] = "CLOSED";
    GameSessionStatus["EXPIRED"] = "EXPIRED";
})(GameSessionStatus || (exports.GameSessionStatus = GameSessionStatus = {}));
var EventStatus;
(function (EventStatus) {
    EventStatus["UPCOMING"] = "UPCOMING";
    EventStatus["IN_PLAY"] = "IN_PLAY";
    EventStatus["SUSPENDED"] = "SUSPENDED";
    EventStatus["CLOSED"] = "CLOSED";
    EventStatus["SETTLED"] = "SETTLED";
})(EventStatus || (exports.EventStatus = EventStatus = {}));
var MarketStatus;
(function (MarketStatus) {
    MarketStatus["OPEN"] = "OPEN";
    MarketStatus["SUSPENDED"] = "SUSPENDED";
    MarketStatus["CLOSED"] = "CLOSED";
    MarketStatus["SETTLED"] = "SETTLED";
})(MarketStatus || (exports.MarketStatus = MarketStatus = {}));
var KycStatus;
(function (KycStatus) {
    KycStatus["NOT_SUBMITTED"] = "NOT_SUBMITTED";
    KycStatus["PENDING"] = "PENDING";
    KycStatus["APPROVED"] = "APPROVED";
    KycStatus["REJECTED"] = "REJECTED";
})(KycStatus || (exports.KycStatus = KycStatus = {}));
exports.ROLE_HIERARCHY = {
    [UserRole.SUPER_ADMIN]: [UserRole.ADMIN],
    [UserRole.ADMIN]: [UserRole.MANAGER],
    [UserRole.MANAGER]: [UserRole.AGENT],
    [UserRole.AGENT]: [UserRole.USER],
    [UserRole.USER]: [],
};
exports.ROLE_LEVEL = {
    [UserRole.SUPER_ADMIN]: 5,
    [UserRole.ADMIN]: 4,
    [UserRole.MANAGER]: 3,
    [UserRole.AGENT]: 2,
    [UserRole.USER]: 1,
};
function canManageRole(actorRole, targetRole) {
    return exports.ROLE_HIERARCHY[actorRole]?.includes(targetRole) ?? false;
}
function canManageUser(actorRole, targetRole) {
    return exports.ROLE_LEVEL[actorRole] > exports.ROLE_LEVEL[targetRole];
}
exports.PERMISSIONS = {
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
};
function hasPermission(role, permission) {
    return exports.PERMISSIONS[permission].includes(role);
}
__exportStar(require("./types"), exports);
//# sourceMappingURL=index.js.map