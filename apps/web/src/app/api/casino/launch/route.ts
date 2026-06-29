import { NextRequest } from 'next/server';
import { prisma, getUserFromRequest, json, error } from '@/lib/server/auth';
import { randomUUID } from 'crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return error('Unauthorized', 401);
  const { gameId } = await req.json();
  const game = await prisma.game.findUnique({ where: { id: gameId } });
  if (!game) return error('Game not found', 404);

  const sessionToken = randomUUID();
  const expiresAt = new Date(Date.now() + 3600000);
  const session = await prisma.gameSession.create({
    data: { userId: user.id, gameId, providerSessionId: sessionToken, expiresAt, status: 'ACTIVE' },
  });

  const host = req.headers.get('host');
  const proto = req.headers.get('x-forwarded-proto') || 'https';
  const base = host ? `${proto}://${host}` : 'http://localhost:3002';

  return json({
    iframeUrl: `${base}/api/casino/embed/${session.id}?token=${sessionToken}`,
    sessionId: session.id,
    expiresAt: expiresAt.toISOString(),
  });
}
