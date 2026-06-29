import { NextRequest } from 'next/server';
import { prisma, getUserFromRequest, json, error } from '@/lib/server/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user || user.role !== 'USER') return error('Forbidden', 403);

  try {
    const { runnerId, side, odds, stake } = await req.json();
    const runner = await prisma.runner.findUnique({
      where: { id: runnerId },
      include: { market: true, oddsSnapshots: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });
    if (!runner || runner.market.status !== 'OPEN') return error('Market unavailable');

    const liability = side === 'BACK' ? stake : stake * (odds - 1);
    const wallet = await prisma.wallet.findUnique({ where: { userId: user.id } });
    if (!wallet || Number(wallet.balance) < liability) return error('Insufficient balance');

    const bet = await prisma.$transaction(async (tx) => {
      const newBalance = Number(wallet.balance) - liability;
      await tx.wallet.update({ where: { id: wallet.id }, data: { balance: newBalance } });
      await tx.ledgerEntry.create({
        data: {
          walletId: wallet.id,
          type: 'DEBIT',
          amount: liability,
          balanceAfter: newBalance,
          referenceType: 'BET_STAKE',
          note: `${side} bet`,
        },
      });
      return tx.bet.create({
        data: {
          userId: user.id,
          runnerId,
          side,
          odds,
          stake,
          status: 'MATCHED',
          matchedStake: stake,
          potentialProfit: side === 'BACK' ? stake * (odds - 1) : stake,
        },
      });
    });
    return json(bet);
  } catch (e) {
    return error((e as Error).message, 500);
  }
}

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return error('Unauthorized', 401);
  const status = new URL(req.url).searchParams.get('status');
  const bets = await prisma.bet.findMany({
    where: { userId: user.id, ...(status ? { status: status as never } : {}) },
    include: { runner: { include: { market: { include: { event: true } } } } },
    orderBy: { createdAt: 'desc' },
  });
  return json(bets);
}
