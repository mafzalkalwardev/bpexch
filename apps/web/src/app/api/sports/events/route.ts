import { NextRequest } from 'next/server';
import { prisma, json, error } from '@/lib/server/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sport = searchParams.get('sport');
  const inPlay = searchParams.get('inPlay') === 'true';

  try {
    const events = await prisma.event.findMany({
      where: {
        ...(sport ? { sport: { slug: sport } } : {}),
        ...(inPlay ? { status: 'IN_PLAY' } : {}),
      },
      include: {
        sport: true,
        markets: {
          include: {
            runners: {
              include: { oddsSnapshots: { orderBy: { createdAt: 'desc' }, take: 1 } },
            },
          },
        },
      },
      orderBy: { startTime: 'asc' },
    });
    return json(events);
  } catch (e) {
    return error((e as Error).message, 500);
  }
}
