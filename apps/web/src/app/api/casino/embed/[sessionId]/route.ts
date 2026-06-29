import { NextRequest } from 'next/server';
import { prisma } from '@/lib/server/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { sessionId: string } }) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');
  const session = await prisma.gameSession.findUnique({
    where: { id: params.sessionId },
    include: { game: true, user: { include: { wallet: true } } },
  });
  if (!session || session.providerSessionId !== token) {
    return new Response('Invalid session', { status: 404 });
  }
  const balance = session.user.wallet ? Number(session.user.wallet.balance) : 0;
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${session.game.name}</title>
<style>body{font-family:Arial;background:#0a1628;color:#fff;margin:0;padding:20px;text-align:center}
.btn{background:#eab308;color:#000;border:none;padding:12px 24px;margin:8px;border-radius:4px;cursor:pointer;font-weight:bold}
</style></head><body>
<h2>${session.game.name}</h2><p>Balance: PKR ${balance.toFixed(2)}</p>
<button class="btn" onclick="alert('Live game — connect licensed provider for production')">Play</button>
</body></html>`;
  return new Response(html, { headers: { 'Content-Type': 'text/html' } });
}
