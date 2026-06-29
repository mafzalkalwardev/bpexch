import { NextRequest } from 'next/server';
import { prisma, getUserFromRequest, json, error } from '@/lib/server/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return error('Unauthorized', 401);
  const wallet = await prisma.wallet.findUnique({ where: { userId: user.id } });
  return json({ balance: wallet ? Number(wallet.balance) : 0, currency: 'PKR' });
}
