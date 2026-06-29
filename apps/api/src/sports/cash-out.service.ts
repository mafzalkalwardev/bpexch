import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { LedgerReferenceType } from '@bpexch/db';

@Injectable()
export class CashOutService {
  constructor(
    private prisma: PrismaService,
    private wallet: WalletService,
  ) {}

  async cashOut(userId: string, betId: string) {
    const bet = await this.prisma.bet.findFirst({
      where: { id: betId, userId, status: 'MATCHED' },
      include: { runner: { include: { oddsSnapshots: { orderBy: { createdAt: 'desc' }, take: 1 } } } },
    });
    if (!bet) throw new NotFoundException('Open bet not found');

    const currentOdds = bet.runner.oddsSnapshots[0];
    if (!currentOdds) throw new BadRequestException('Odds unavailable');

    const currentPrice = bet.side === 'BACK' ? Number(currentOdds.backPrice) : Number(currentOdds.layPrice);
    const originalOdds = Number(bet.odds);
    const stake = Number(bet.stake);

    let cashOutValue: number;
    if (bet.side === 'BACK') {
      cashOutValue = stake * (originalOdds / currentPrice);
    } else {
      cashOutValue = stake - stake * (currentPrice - originalOdds);
    }
    cashOutValue = Math.max(0, Math.round(cashOutValue * 100) / 100);

    await this.wallet.creditWin(
      userId,
      cashOutValue,
      LedgerReferenceType.BET_REFUND,
      betId,
      `cashout-${betId}`,
    );

    return this.prisma.bet.update({
      where: { id: betId },
      data: { status: 'CANCELLED', settledAmount: cashOutValue },
    });
  }

  async getExposure(userId: string) {
    const openBets = await this.prisma.bet.findMany({
      where: { userId, status: { in: ['OPEN', 'MATCHED'] } },
      include: { runner: { include: { market: true } } },
    });

    const marketExposures = new Map<string, number>();
    let totalExposure = 0;

    for (const bet of openBets) {
      const liability =
        bet.side === 'BACK' ? Number(bet.stake) : Number(bet.stake) * (Number(bet.odds) - 1);
      totalExposure += liability;
      const marketId = bet.runner.marketId;
      marketExposures.set(marketId, (marketExposures.get(marketId) || 0) + liability);
    }

    return {
      userId,
      totalExposure,
      marketExposures: [...marketExposures.entries()].map(([marketId, exposure]) => ({
        marketId,
        exposure,
      })),
    };
  }
}
