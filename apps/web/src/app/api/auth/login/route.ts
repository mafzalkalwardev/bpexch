import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma, signToken, json, error } from '@/lib/server/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const user = await prisma.user.findUnique({
      where: { username: body.username },
      include: { wallet: true },
    });
    if (!user || !(await bcrypt.compare(body.password, user.passwordHash))) {
      return error('Invalid credentials', 401);
    }
    if (user.status !== 'ACTIVE') return error('Account suspended', 401);

    const accessToken = signToken({ sub: user.id, username: user.username, role: user.role });
    return json({
      accessToken,
      refreshToken: accessToken,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        balance: user.wallet ? Number(user.wallet.balance) : 0,
        locale: user.locale,
      },
    });
  } catch (e) {
    return error((e as Error).message, 500);
  }
}
