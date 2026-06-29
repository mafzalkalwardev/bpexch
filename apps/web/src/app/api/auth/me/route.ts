import { NextRequest } from 'next/server';
import { getUserFromRequest, json, error } from '@/lib/server/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return error('Unauthorized', 401);
  return json({
    id: user.id,
    username: user.username,
    role: user.role,
    balance: user.wallet ? Number(user.wallet.balance) : 0,
  });
}
