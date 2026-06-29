import { NextRequest } from 'next/server';
import { prisma, json, error } from '@/lib/server/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const games = await prisma.game.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
    return json(games);
  } catch (e) {
    return error((e as Error).message, 500);
  }
}
