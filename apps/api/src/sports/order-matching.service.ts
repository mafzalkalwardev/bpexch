import { Injectable } from '@nestjs/common';
import { BetSide } from '@bpexch/db';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrderMatchingService {
  constructor(private prisma: PrismaService) {}

  async addToOrderBook(userId: string, runnerId: string, side: BetSide, odds: number, stake: number) {
    return this.prisma.orderBookEntry.create({
      data: {
        userId,
        runnerId,
        side,
        odds,
        stake,
        remainingStake: stake,
        status: 'OPEN',
      },
    });
  }

  async getOrderBook(runnerId: string) {
    return this.prisma.orderBookEntry.findMany({
      where: { runnerId, status: { in: ['OPEN', 'PARTIALLY_MATCHED'] } },
      orderBy: [{ side: 'asc' }, { odds: 'desc' }],
      take: 50,
    });
  }

  async matchOrders(runnerId: string) {
    const backs = await this.prisma.orderBookEntry.findMany({
      where: { runnerId, side: 'BACK', status: { in: ['OPEN', 'PARTIALLY_MATCHED'] } },
      orderBy: { odds: 'desc' },
    });
    const lays = await this.prisma.orderBookEntry.findMany({
      where: { runnerId, side: 'LAY', status: { in: ['OPEN', 'PARTIALLY_MATCHED'] } },
      orderBy: { odds: 'asc' },
    });

    for (const back of backs) {
      for (const lay of lays) {
        if (Number(back.odds) >= Number(lay.odds) && Number(back.remainingStake) > 0 && Number(lay.remainingStake) > 0) {
          const matchAmount = Math.min(Number(back.remainingStake), Number(lay.remainingStake));
          const backRemaining = Number(back.remainingStake) - matchAmount;
          const layRemaining = Number(lay.remainingStake) - matchAmount;

          await this.prisma.orderBookEntry.update({
            where: { id: back.id },
            data: {
              remainingStake: backRemaining,
              status: backRemaining === 0 ? 'FULLY_MATCHED' : 'PARTIALLY_MATCHED',
            },
          });
          await this.prisma.orderBookEntry.update({
            where: { id: lay.id },
            data: {
              remainingStake: layRemaining,
              status: layRemaining === 0 ? 'FULLY_MATCHED' : 'PARTIALLY_MATCHED',
            },
          });
        }
      }
    }
  }
}
