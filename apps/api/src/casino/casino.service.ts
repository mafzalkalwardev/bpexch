import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { LedgerReferenceType } from '@bpexch/db';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { AuditService } from '../audit/audit.service';
import { CasinoWebhookDto } from './casino.dto';

@Injectable()
export class CasinoService {
  constructor(
    private prisma: PrismaService,
    private wallet: WalletService,
    private audit: AuditService,
  ) {}

  async listGames(category?: string) {
    return this.prisma.game.findMany({
      where: {
        isActive: true,
        ...(category ? { category: category as never } : {}),
      },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async launchGame(userId: string, gameId: string) {
    const game = await this.prisma.game.findUnique({ where: { id: gameId } });
    if (!game || !game.isActive) throw new NotFoundException('Game not found');

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user?.selfExcludedUntil && user.selfExcludedUntil > new Date()) {
      throw new BadRequestException('Account self-excluded');
    }

    const sessionToken = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000);

    const session = await this.prisma.gameSession.create({
      data: {
        userId,
        gameId,
        providerSessionId: sessionToken,
        expiresAt,
        status: 'ACTIVE',
      },
    });

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const iframeUrl = `${baseUrl}/api/casino/embed/${session.id}?token=${sessionToken}`;

    await this.audit.log({
      actorId: userId,
      action: 'LAUNCH_GAME',
      entityType: 'GameSession',
      entityId: session.id,
      metadata: { gameId, gameName: game.name },
    });

    return { iframeUrl, sessionId: session.id, expiresAt: expiresAt.toISOString() };
  }

  async getEmbedSession(sessionId: string, token: string) {
    const session = await this.prisma.gameSession.findUnique({
      where: { id: sessionId },
      include: { game: true, user: { include: { wallet: true } } },
    });
    if (!session || session.providerSessionId !== token || session.status !== 'ACTIVE') {
      throw new NotFoundException('Invalid session');
    }
    if (session.expiresAt < new Date()) {
      await this.prisma.gameSession.update({ where: { id: sessionId }, data: { status: 'EXPIRED' } });
      throw new BadRequestException('Session expired');
    }
    return session;
  }

  async handleWebhook(dto: CasinoWebhookDto, secret?: string) {
    const expected = process.env.CASINO_WEBHOOK_SECRET || 'mock-webhook-secret';
    if (secret !== expected) throw new BadRequestException('Invalid webhook signature');

    const session = await this.prisma.gameSession.findUnique({ where: { id: dto.sessionId } });
    if (!session) throw new NotFoundException('Session not found');

    const idempotencyKey = `casino-${dto.transactionId}`;

    if (dto.type === 'BET') {
      await this.wallet.debit(
        session.userId,
        dto.amount,
        LedgerReferenceType.CASINO_BET,
        dto.transactionId,
        idempotencyKey,
        'Casino bet',
      );
    } else if (dto.type === 'WIN') {
      await this.wallet.creditWin(
        session.userId,
        dto.amount,
        LedgerReferenceType.CASINO_WIN,
        dto.transactionId,
        idempotencyKey,
      );
    } else if (dto.type === 'REFUND') {
      await this.wallet.creditWin(
        session.userId,
        dto.amount,
        LedgerReferenceType.BET_REFUND,
        dto.transactionId,
        idempotencyKey,
      );
    }

    await this.audit.log({
      actorId: session.userId,
      action: `CASINO_${dto.type}`,
      entityType: 'GameSession',
      entityId: session.id,
      metadata: { amount: dto.amount, transactionId: dto.transactionId },
    });

    const wallet = await this.prisma.wallet.findUnique({ where: { userId: session.userId } });
    return { success: true, balance: wallet ? Number(wallet.balance) : 0 };
  }

  async closeSession(sessionId: string) {
    return this.prisma.gameSession.update({
      where: { id: sessionId },
      data: { status: 'CLOSED', closedAt: new Date() },
    });
  }

  async createGame(data: {
    name: string;
    category: string;
    provider: string;
    providerGameId?: string;
    thumbnailUrl?: string;
  }) {
    return this.prisma.game.create({ data: { ...data, category: data.category as never } });
  }
}
