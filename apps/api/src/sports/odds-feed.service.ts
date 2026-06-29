import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface OddsUpdate {
  runnerId: string;
  backPrice: number;
  layPrice: number;
}

@Injectable()
export class OddsFeedService {
  constructor(private prisma: PrismaService) {}

  async fetchUpdates(): Promise<OddsUpdate[]> {
    const runners = await this.prisma.runner.findMany({
      include: {
        oddsSnapshots: { orderBy: { createdAt: 'desc' }, take: 1 },
        market: { include: { event: true } },
      },
    });

    const updates: OddsUpdate[] = [];
    for (const runner of runners) {
      if (runner.market.event.status === 'SETTLED') continue;
      const current = runner.oddsSnapshots[0];
      if (!current) continue;

      const drift = (Math.random() - 0.5) * 0.04;
      const back = Math.max(1.01, Number(current.backPrice) + drift);
      const lay = Math.max(back + 0.01, Number(current.layPrice) + drift);

      if (Math.abs(back - Number(current.backPrice)) > 0.005) {
        updates.push({ runnerId: runner.id, backPrice: +back.toFixed(2), layPrice: +lay.toFixed(2) });
      }
    }
    return updates;
  }
}
