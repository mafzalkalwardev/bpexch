import { NextRequest } from 'next/server';
import { execSync } from 'child_process';
import path from 'path';
import { json, error } from '@/lib/server/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-setup-secret');
  if (secret !== process.env.SETUP_SECRET) {
    return error('Forbidden', 403);
  }
  const root = path.resolve(process.cwd(), '../..');
  const dbPath = path.join(root, 'packages/db');
  try {
    execSync('npx prisma db push --accept-data-loss', { cwd: dbPath, stdio: 'pipe', env: process.env });
    execSync('npx tsx prisma/seed.ts', { cwd: dbPath, stdio: 'pipe', env: process.env });
    return json({ success: true, message: 'Database migrated and seeded' });
  } catch (e) {
    return error((e as Error).message, 500);
  }
}
