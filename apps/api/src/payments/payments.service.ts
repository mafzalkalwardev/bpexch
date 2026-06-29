import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { AuditService } from '../audit/audit.service';
import { PaymentWebhookDto } from './payments.dto';

@Injectable()
export class PaymentsService {
  constructor(
    private prisma: PrismaService,
    private wallet: WalletService,
    private audit: AuditService,
  ) {}

  async handleDepositWebhook(dto: PaymentWebhookDto) {
    if (dto.status !== 'SUCCESS') {
      return { processed: false, reason: 'Payment failed' };
    }

    const idempotencyKey = `payment-${dto.provider}-${dto.transactionId}`;
    const existing = await this.prisma.ledgerEntry.findUnique({ where: { idempotencyKey } });
    if (existing) return { processed: true, duplicate: true };

    await this.wallet.credit(
      { id: 'system', role: 'SUPER_ADMIN' as never },
      dto.userId,
      dto.amount,
      `${dto.provider} deposit ${dto.transactionId}`,
      idempotencyKey,
    );

    await this.audit.log({
      action: 'PAYMENT_DEPOSIT',
      entityType: 'Payment',
      entityId: dto.transactionId,
      metadata: { provider: dto.provider, amount: dto.amount, userId: dto.userId },
    });

    return { processed: true };
  }

  async initiateWithdrawalPayout(withdrawalId: string, provider: string) {
    const withdrawal = await this.prisma.withdrawalRequest.findUnique({
      where: { id: withdrawalId },
    });
    if (!withdrawal || withdrawal.status !== 'APPROVED') {
      throw new BadRequestException('Withdrawal not approved');
    }

    await this.audit.log({
      action: 'PAYMENT_WITHDRAWAL_INITIATED',
      entityType: 'WithdrawalRequest',
      entityId: withdrawalId,
      metadata: { provider, amount: Number(withdrawal.amount) },
    });

    return {
      status: 'PAYOUT_INITIATED',
      provider,
      amount: Number(withdrawal.amount),
      reference: `PAY-${withdrawalId.slice(0, 8)}`,
    };
  }
}
