import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async downlineReport(ancestorId: string) {
    const closures = await this.prisma.hierarchyClosure.findMany({
      where: { ancestorId, depth: { gte: 1 } },
      include: {
        descendant: {
          include: {
            wallet: true,
            _count: { select: { bets: true } },
            bets: { select: { stake: true } },
          },
        },
      },
    });

    return closures.map((c) => ({
      userId: c.descendant.id,
      username: c.descendant.username,
      role: c.descendant.role,
      balance: c.descendant.wallet ? Number(c.descendant.wallet.balance) : 0,
      totalBets: c.descendant._count.bets,
      totalStaked: c.descendant.bets.reduce((s, b) => s + Number(b.stake), 0),
      depth: c.depth,
    }));
  }

  async branchPnL(ancestorId: string) {
    const downline = await this.prisma.hierarchyClosure.findMany({
      where: { ancestorId },
      select: { descendantId: true },
    });
    const userIds = downline.map((d) => d.descendantId);

    const [won, lost, commissions] = await Promise.all([
      this.prisma.bet.aggregate({
        where: { userId: { in: userIds }, status: 'WON' },
        _sum: { settledAmount: true },
      }),
      this.prisma.bet.aggregate({
        where: { userId: { in: userIds }, status: 'LOST' },
        _sum: { stake: true },
      }),
      this.prisma.commissionAccrual.aggregate({
        where: { userId: { in: userIds } },
        _sum: { amount: true },
      }),
    ]);

    return {
      totalWinnings: Number(won._sum.settledAmount || 0),
      totalLosses: Number(lost._sum.stake || 0),
      totalCommissions: Number(commissions._sum.amount || 0),
      netPnL: Number(lost._sum.stake || 0) - Number(won._sum.settledAmount || 0),
    };
  }

  async exportCsv(ancestorId: string) {
    const report = await this.downlineReport(ancestorId);
    const header = 'userId,username,role,balance,totalBets,totalStaked,depth\n';
    const rows = report
      .map((r) => `${r.userId},${r.username},${r.role},${r.balance},${r.totalBets},${r.totalStaked},${r.depth}`)
      .join('\n');
    return header + rows;
  }
}
