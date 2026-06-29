import { NextRequest } from 'next/server';
import { prisma, getUserFromRequest, json, error } from '@/lib/server/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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
