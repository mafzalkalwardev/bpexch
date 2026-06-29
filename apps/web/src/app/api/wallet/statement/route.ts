import { NextRequest } from 'next/server';
import { prisma, getUserFromRequest, json, error } from '@/lib/server/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return error('Unauthorized', 401);
  const wallet = await prisma.wallet.findUnique({ where: { userId: user.id } });
  if (!wallet) return error('Wallet not found', 404);
  const entries = await prisma.ledgerEntry.findMany({
    where: { walletId: wallet.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  return json({
    entries: entries.map((e) => ({
      id: e.id,
      type: e.type,
      amount: Number(e.amount),
      balanceAfter: Number(e.balanceAfter),
      referenceType: e.referenceType,
      note: e.note,
      createdAt: e.createdAt.toISOString(),
    })),
  });
}
