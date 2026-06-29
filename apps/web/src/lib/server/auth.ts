import { prisma } from '@bpexch/db';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { NextRequest } from 'next/server';

export { prisma };

export function getJwtSecret() {
  return process.env.JWT_SECRET || 'dev-secret-change-in-production';
}

export function signToken(payload: { sub: string; username: string; role: string }) {
  const options: SignOptions = { expiresIn: '15m' };
  return jwt.sign(payload, getJwtSecret(), options);
}

export async function getUserFromRequest(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  try {
    const payload = jwt.verify(auth.slice(7), getJwtSecret()) as { sub: string };
    return prisma.user.findUnique({
      where: { id: payload.sub },
      include: { wallet: true },
    });
  } catch {
    return null;
  }
}

export function json(data: unknown, status = 200) {
  return Response.json(data, { status });
}

export function error(message: string, status = 400) {
  return Response.json({ message, error: message }, { status });
}
