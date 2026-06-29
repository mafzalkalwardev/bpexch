import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BetSide, LedgerReferenceType } from '@bpexch/db';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { AuditService } from '../audit/audit.service';
import { PlaceBetDto } from './sports.dto';
import { OddsFeedService } from './odds-feed.service';
import { OrderMatchingService } from './order-matching.service';
import { SportsGateway } from './sports.gateway';

@Injectable()
export class SportsService {
  constructor(
    private prisma: PrismaService,
    private wallet: WalletService,
    private audit: AuditService,
    private oddsFeed: OddsFeedService,
    private matching: OrderMatchingService,
    private gateway: SportsGateway,
  ) {}

  async listSports() {
    return this.prisma.sport.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async listEvents(sportSlug?: string, inPlayOnly = false) {
    return this.prisma.event.findMany({
      where: {
        ...(sportSlug ? { sport: { slug: sportSlug } } : {}),
        ...(inPlayOnly ? { status: 'IN_PLAY' } : {}),
      },
      include: {
        sport: true,
        markets: {
          include: {
            runners: {
              include: {
                oddsSnapshots: { orderBy: { createdAt: 'desc' }, take: 1 },
              },
            },
          },
        },
      },
      orderBy: { startTime: 'asc' },
    });
  }

  async getMarket(marketId: string) {
    const market = await this.prisma.market.findUnique({
      where: { id: marketId },
      include: {
        event: { include: { sport: true } },
        runners: {
          include: { oddsSnapshots: { orderBy: { createdAt: 'desc' }, take: 1 } },
        },
      },
    });
    if (!market) throw new NotFoundException('Market not found');
    return market;
  }

  async placeBet(userId: string, dto: PlaceBetDto) {
    const runner = await this.prisma.runner.findUnique({
      where: { id: dto.runnerId },
      include: {
        market: { include: { event: true } },
        oddsSnapshots: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });
    if (!runner) throw new NotFoundException('Runner not found');
    if (runner.market.status !== 'OPEN') throw new BadRequestException('Market suspended');

    const latestOdds = runner.oddsSnapshots[0];
    const expectedOdds = dto.side === BetSide.BACK ? Number(latestOdds?.backPrice) : Number(latestOdds?.layPrice);
    if (Math.abs(dto.odds - expectedOdds) > 0.05) {
      throw new BadRequestException('Odds changed — refresh and retry');
    }

    const liability =
      dto.side === BetSide.BACK
        ? dto.stake
        : dto.stake * (dto.odds - 1);
    const potentialProfit =
      dto.side === BetSide.BACK
        ? dto.stake * (dto.odds - 1)
        : dto.stake;

    const idempotencyKey = `bet-${userId}-${Date.now()}-${dto.runnerId}`;

    const bet = await this.prisma.$transaction(async (tx) => {
      await this.wallet.debit(
        userId,
        liability,
        LedgerReferenceType.BET_STAKE,
        undefined,
        idempotencyKey,
        `${dto.side} bet on ${runner.name}`,
        tx,
      );

      return tx.bet.create({
        data: {
          userId,
          runnerId: dto.runnerId,
          side: dto.side,
          odds: dto.odds,
          stake: dto.stake,
          status: 'MATCHED',
          matchedStake: dto.stake,
          potentialProfit,
          idempotencyKey,
        },
      });
    });

    await this.matching.addToOrderBook(userId, dto.runnerId, dto.side, dto.odds, dto.stake);

    await this.audit.log({
      actorId: userId,
      action: 'PLACE_BET',
      entityType: 'Bet',
      entityId: bet.id,
      metadata: { side: dto.side, odds: dto.odds, stake: dto.stake },
    });

    this.gateway.emitBetUpdate(userId, bet);
    return bet;
  }

  async getUserBets(userId: string, status?: string) {
    return this.prisma.bet.findMany({
      where: { userId, ...(status ? { status: status as never } : {}) },
      include: {
        runner: { include: { market: { include: { event: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async settleEvent(eventId: string, winnerRunnerId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: { markets: { include: { runners: { include: { bets: { where: { status: 'MATCHED' } } } } } } },
    });
    if (!event) throw new NotFoundException('Event not found');

    for (const market of event.markets) {
      for (const runner of market.runners) {
        await this.prisma.runner.update({
          where: { id: runner.id },
          data: { isWinner: runner.id === winnerRunnerId },
        });
        for (const bet of runner.bets) {
          await this.settleBet(bet.id, runner.id === winnerRunnerId);
        }
      }
      await this.prisma.market.update({ where: { id: market.id }, data: { status: 'SETTLED' } });
    }

    await this.prisma.event.update({
      where: { id: eventId },
      data: { status: 'SETTLED', resultRunnerId: winnerRunnerId },
    });
  }

  private async settleBet(betId: string, runnerWon: boolean) {
    const bet = await this.prisma.bet.findUnique({ where: { id: betId } });
    if (!bet || bet.status !== 'MATCHED') return;

    let won = false;
    if (bet.side === BetSide.BACK) won = runnerWon;
    else won = !runnerWon;

    if (won) {
      const payout = Number(bet.stake) + Number(bet.potentialProfit);
      await this.wallet.creditWin(
        bet.userId,
        payout,
        LedgerReferenceType.BET_WIN,
        betId,
        `bet-win-${betId}`,
      );
      await this.prisma.bet.update({
        where: { id: betId },
        data: { status: 'WON', settledAmount: payout },
      });
    } else {
      await this.prisma.bet.update({
        where: { id: betId },
        data: { status: 'LOST', settledAmount: 0 },
      });
    }
    this.gateway.emitBetUpdate(bet.userId, { id: betId, status: won ? 'WON' : 'LOST' });
  }

  @Cron(CronExpression.EVERY_30_SECONDS)
  async syncOdds() {
    const updates = await this.oddsFeed.fetchUpdates();
    for (const u of updates) {
      await this.prisma.oddsSnapshot.create({
        data: { runnerId: u.runnerId, backPrice: u.backPrice, layPrice: u.layPrice },
      });
      this.gateway.emitOddsUpdate(u.runnerId, u.backPrice, u.layPrice);
    }
  }
}
