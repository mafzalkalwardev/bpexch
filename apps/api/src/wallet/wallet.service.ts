import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { Prisma, LedgerReferenceType, LedgerEntryType } from '@bpexch/db';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { UsersService } from '../users/users.service';
import { UserRole } from '@bpexch/shared';

@Injectable()
export class WalletService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private users: UsersService,
  ) {}

  async getBalance(userId: string) {
    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) throw new NotFoundException('Wallet not found');
    return { balance: Number(wallet.balance), currency: wallet.currency };
  }

  async getStatement(userId: string, page = 1, limit = 50) {
    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) throw new NotFoundException('Wallet not found');
    const skip = (page - 1) * limit;
    const [entries, total] = await Promise.all([
      this.prisma.ledgerEntry.findMany({
        where: { walletId: wallet.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.ledgerEntry.count({ where: { walletId: wallet.id } }),
    ]);
    return {
      entries: entries.map((e) => ({
        id: e.id,
        type: e.type,
        amount: Number(e.amount),
        balanceAfter: Number(e.balanceAfter),
        referenceType: e.referenceType,
        note: e.note,
        createdAt: e.createdAt.toISOString(),
      })),
      total,
      page,
    };
  }

  async credit(
    actor: { id: string; role: UserRole },
    targetUserId: string,
    amount: number,
    note?: string,
    idempotencyKey?: string,
  ) {
    if (amount <= 0) throw new BadRequestException('Amount must be positive');
    const canManage = await this.users.isInDownline(actor.id, targetUserId);
    if (!canManage && actor.id !== targetUserId && actor.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Cannot credit this user');
    }

    if (idempotencyKey) {
      const existing = await this.prisma.ledgerEntry.findUnique({ where: { idempotencyKey } });
      if (existing) return { duplicate: true, entryId: existing.id };
    }

    return this.prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({ where: { userId: targetUserId } });
      if (!wallet) throw new NotFoundException('Wallet not found');
      const newBalance = Number(wallet.balance) + amount;
      await tx.wallet.update({ where: { id: wallet.id }, data: { balance: newBalance } });
      const entry = await tx.ledgerEntry.create({
        data: {
          walletId: wallet.id,
          type: LedgerEntryType.CREDIT,
          amount,
          balanceAfter: newBalance,
          referenceType: LedgerReferenceType.MANUAL_CREDIT,
          idempotencyKey,
          note: note || `Credit by ${actor.id}`,
        },
      });
      await this.audit.log({
        actorId: actor.id,
        action: 'WALLET_CREDIT',
        entityType: 'Wallet',
        entityId: wallet.id,
        metadata: { amount, targetUserId },
      });
      return { balance: newBalance, entryId: entry.id };
    });
  }

  async debit(
    userId: string,
    amount: number,
    referenceType: LedgerReferenceType,
    referenceId?: string,
    idempotencyKey?: string,
    note?: string,
    tx?: Prisma.TransactionClient,
  ) {
    if (amount <= 0) throw new BadRequestException('Amount must be positive');

    const execute = async (client: Prisma.TransactionClient) => {
      if (idempotencyKey) {
        const existing = await client.ledgerEntry.findUnique({ where: { idempotencyKey } });
        if (existing) return { duplicate: true, balance: Number(existing.balanceAfter) };
      }
      const wallet = await client.wallet.findUnique({ where: { userId } });
      if (!wallet) throw new NotFoundException('Wallet not found');
      if (Number(wallet.balance) < amount) throw new BadRequestException('Insufficient balance');
      const newBalance = Number(wallet.balance) - amount;
      await client.wallet.update({ where: { id: wallet.id }, data: { balance: newBalance } });
      await client.ledgerEntry.create({
        data: {
          walletId: wallet.id,
          type: LedgerEntryType.DEBIT,
          amount,
          balanceAfter: newBalance,
          referenceType,
          referenceId,
          idempotencyKey,
          note,
        },
      });
      return { balance: newBalance };
    };

    if (tx) return execute(tx);
    return this.prisma.$transaction(execute);
  }

  async creditWin(
    userId: string,
    amount: number,
    referenceType: LedgerReferenceType,
    referenceId?: string,
    idempotencyKey?: string,
    tx?: Prisma.TransactionClient,
  ) {
    const execute = async (client: Prisma.TransactionClient) => {
      if (idempotencyKey) {
        const existing = await client.ledgerEntry.findUnique({ where: { idempotencyKey } });
        if (existing) return { duplicate: true };
      }
      const wallet = await client.wallet.findUnique({ where: { userId } });
      if (!wallet) throw new NotFoundException('Wallet not found');
      const newBalance = Number(wallet.balance) + amount;
      await client.wallet.update({ where: { id: wallet.id }, data: { balance: newBalance } });
      await client.ledgerEntry.create({
        data: {
          walletId: wallet.id,
          type: LedgerEntryType.CREDIT,
          amount,
          balanceAfter: newBalance,
          referenceType,
          referenceId,
          idempotencyKey,
        },
      });
      return { balance: newBalance };
    };
    if (tx) return execute(tx);
    return this.prisma.$transaction(execute);
  }

  async requestWithdrawal(userId: string, amount: number, paymentMethod: string, accountDetails: string) {
    if (amount <= 0) throw new BadRequestException('Invalid amount');
    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet || Number(wallet.balance) < amount) {
      throw new BadRequestException('Insufficient balance');
    }
    return this.prisma.withdrawalRequest.create({
      data: { userId, amount, paymentMethod, accountDetails, status: 'PENDING' },
    });
  }

  async requestDeposit(userId: string, amount: number, paymentMethod: string, reference?: string) {
    return this.prisma.depositRequest.create({
      data: { userId, amount, paymentMethod, reference, status: 'PENDING' },
    });
  }

  async approveWithdrawal(actorId: string, withdrawalId: string, approve: boolean, note?: string) {
    return this.prisma.$transaction(async (tx) => {
      const req = await tx.withdrawalRequest.findUnique({ where: { id: withdrawalId } });
      if (!req || req.status !== 'PENDING') throw new BadRequestException('Invalid withdrawal request');

      if (!approve) {
        return tx.withdrawalRequest.update({
          where: { id: withdrawalId },
          data: { status: 'REJECTED', approvedById: actorId, rejectionNote: note },
        });
      }

      await this.debit(
        req.userId,
        Number(req.amount),
        LedgerReferenceType.WITHDRAWAL,
        withdrawalId,
        `withdrawal-${withdrawalId}`,
        'Withdrawal approved',
        tx,
      );

      return tx.withdrawalRequest.update({
        where: { id: withdrawalId },
        data: { status: 'PAID', approvedById: actorId, paidAt: new Date() },
      });
    });
  }

  async approveDeposit(actorId: string, depositId: string) {
    return this.prisma.$transaction(async (tx) => {
      const req = await tx.depositRequest.findUnique({ where: { id: depositId } });
      if (!req || req.status !== 'PENDING') throw new BadRequestException('Invalid deposit request');

      const wallet = await tx.wallet.findUnique({ where: { userId: req.userId } });
      if (!wallet) throw new NotFoundException('Wallet not found');
      const newBalance = Number(wallet.balance) + Number(req.amount);
      await tx.wallet.update({ where: { id: wallet.id }, data: { balance: newBalance } });
      await tx.ledgerEntry.create({
        data: {
          walletId: wallet.id,
          type: LedgerEntryType.CREDIT,
          amount: req.amount,
          balanceAfter: newBalance,
          referenceType: LedgerReferenceType.DEPOSIT,
          referenceId: depositId,
          idempotencyKey: `deposit-${depositId}`,
        },
      });
      return tx.depositRequest.update({
        where: { id: depositId },
        data: { status: 'APPROVED', approvedById: actorId },
      });
    });
  }

  async listPendingWithdrawals() {
    return this.prisma.withdrawalRequest.findMany({
      where: { status: 'PENDING' },
      include: { user: { select: { username: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async accrueCommission(userId: string, referenceType: string, referenceId: string, baseAmount: number, percent: number) {
    const amount = (baseAmount * percent) / 100;
    if (amount <= 0) return;
    await this.prisma.commissionAccrual.create({
      data: { userId, referenceType, referenceId, amount, percent, settled: false },
    });
  }
}
