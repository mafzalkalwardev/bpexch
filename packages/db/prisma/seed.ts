import * as bcrypt from 'bcryptjs';
import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

async function upsertUser(
  username: string,
  password: string,
  role: UserRole,
  parentId?: string,
) {
  const passwordHash = await bcrypt.hash(password, 10);
  return prisma.user.upsert({
    where: { username },
    update: { passwordHash, role, parentId },
    create: { username, passwordHash, role, parentId, status: 'ACTIVE' },
  });
}

async function rebuildClosure(userId: string, parentId?: string | null) {
  await prisma.hierarchyClosure.deleteMany({ where: { descendantId: userId } });
  await prisma.hierarchyClosure.create({
    data: { ancestorId: userId, descendantId: userId, depth: 0 },
  });
  if (parentId) {
    const ancestors = await prisma.hierarchyClosure.findMany({
      where: { descendantId: parentId },
    });
    for (const a of ancestors) {
      await prisma.hierarchyClosure.create({
        data: {
          ancestorId: a.ancestorId,
          descendantId: userId,
          depth: a.depth + 1,
        },
      });
    }
  }
}

async function ensureWallet(userId: string, balance = 0) {
  return prisma.wallet.upsert({
    where: { userId },
    update: {},
    create: { userId, balance, currency: 'PKR' },
  });
}

async function main() {
  console.log('Seeding Bpexch database...');

  const superAdmin = await upsertUser('superadmin', 'SuperAdmin@123', UserRole.SUPER_ADMIN);
  await rebuildClosure(superAdmin.id);
  await ensureWallet(superAdmin.id);

  const admin = await upsertUser('admin', 'Admin@123', UserRole.ADMIN, superAdmin.id);
  await rebuildClosure(admin.id, superAdmin.id);
  await ensureWallet(admin.id, 100000);

  const manager = await upsertUser('manager', 'Manager@123', UserRole.MANAGER, admin.id);
  await rebuildClosure(manager.id, admin.id);
  await ensureWallet(manager.id, 50000);

  const agent = await upsertUser('agent', 'Agent@123', UserRole.AGENT, manager.id);
  await rebuildClosure(agent.id, manager.id);
  await ensureWallet(agent.id, 25000);

  const users = [
    { username: 'user1', balance: 5000 },
    { username: 'user2', balance: 3000 },
    { username: 'demo', balance: 10000 },
  ];

  for (const u of users) {
    const user = await upsertUser(u.username, 'User@123', UserRole.USER, agent.id);
    await rebuildClosure(user.id, agent.id);
    const wallet = await ensureWallet(user.id, u.balance);
    if (Number(wallet.balance) === 0 && u.balance > 0) {
      await prisma.wallet.update({
        where: { id: wallet.id },
        data: { balance: u.balance },
      });
      await prisma.ledgerEntry.create({
        data: {
          walletId: wallet.id,
          type: 'CREDIT',
          amount: u.balance,
          balanceAfter: u.balance,
          referenceType: 'MANUAL_CREDIT',
          note: 'Seed balance',
        },
      });
    }
  }

  const commissionRules = [
    { role: UserRole.AGENT, sportPercent: 1.5, casinoPercent: 2.0 },
    { role: UserRole.MANAGER, sportPercent: 0.5, casinoPercent: 0.75 },
    { role: UserRole.ADMIN, sportPercent: 0.25, casinoPercent: 0.5 },
  ];

  for (const rule of commissionRules) {
    await prisma.commissionRule.upsert({
      where: { role: rule.role },
      update: { sportPercent: rule.sportPercent, casinoPercent: rule.casinoPercent },
      create: rule,
    });
  }

  const cricket = await prisma.sport.upsert({
    where: { slug: 'cricket' },
    update: {},
    create: { name: 'Cricket', slug: 'cricket', sortOrder: 1 },
  });

  const football = await prisma.sport.upsert({
    where: { slug: 'football' },
    update: {},
    create: { name: 'Football', slug: 'football', sortOrder: 2 },
  });

  const events = [
    {
      sportId: cricket.id,
      name: 'Pakistan vs India - T20',
      externalId: 'evt-cricket-pak-ind',
      status: 'IN_PLAY' as const,
      startTime: new Date(),
      market: 'Match Odds',
      runners: [
        { name: 'Pakistan', back: 2.1, lay: 2.12 },
        { name: 'India', back: 1.85, lay: 1.87 },
      ],
    },
    {
      sportId: cricket.id,
      name: 'PSL Final 2026',
      externalId: 'evt-cricket-psl',
      status: 'UPCOMING' as const,
      startTime: new Date(Date.now() + 86400000),
      market: 'Match Odds',
      runners: [
        { name: 'Lahore Qalandars', back: 1.95, lay: 1.97 },
        { name: 'Karachi Kings', back: 2.05, lay: 2.08 },
      ],
    },
    {
      sportId: football.id,
      name: 'Manchester United vs Liverpool',
      externalId: 'evt-football-mu-liv',
      status: 'UPCOMING' as const,
      startTime: new Date(Date.now() + 172800000),
      market: 'Match Odds',
      runners: [
        { name: 'Man United', back: 2.5, lay: 2.55 },
        { name: 'Draw', back: 3.4, lay: 3.5 },
        { name: 'Liverpool', back: 2.8, lay: 2.85 },
      ],
    },
  ];

  for (const evt of events) {
    const event = await prisma.event.upsert({
      where: { externalId: evt.externalId },
      update: { status: evt.status, name: evt.name },
      create: {
        sportId: evt.sportId,
        name: evt.name,
        externalId: evt.externalId,
        status: evt.status,
        startTime: evt.startTime,
      },
    });

    let market = await prisma.market.findFirst({
      where: { eventId: event.id, name: evt.market },
    });
    if (!market) {
      market = await prisma.market.create({
        data: { eventId: event.id, name: evt.market, status: 'OPEN' },
      });
    }

    for (let i = 0; i < evt.runners.length; i++) {
      const r = evt.runners[i];
      let runner = await prisma.runner.findFirst({
        where: { marketId: market.id, name: r.name },
      });
      if (!runner) {
        runner = await prisma.runner.create({
          data: { marketId: market.id, name: r.name, sortOrder: i },
        });
      }
      await prisma.oddsSnapshot.create({
        data: {
          runnerId: runner.id,
          backPrice: r.back,
          layPrice: r.lay,
        },
      });
    }
  }

  const games = [
    { name: 'Lucky Jet', category: 'AVIATOR' as const, provider: 'mock-spribe', providerGameId: 'lucky-jet' },
    { name: '7-Up-Down', category: 'TABLE' as const, provider: 'mock-pragmatic', providerGameId: '7-up-down' },
    { name: 'TeenPatti T20', category: 'LIVE_DEALER' as const, provider: 'mock-evolution', providerGameId: 'teenpatti-t20' },
    { name: 'HiLo', category: 'TABLE' as const, provider: 'mock-pragmatic', providerGameId: 'hilo' },
    { name: 'Dragon Tiger', category: 'LIVE_DEALER' as const, provider: 'mock-evolution', providerGameId: 'dragon-tiger' },
    { name: 'Live Roulette', category: 'LIVE_DEALER' as const, provider: 'mock-evolution', providerGameId: 'roulette' },
    { name: 'Live Baccarat', category: 'LIVE_DEALER' as const, provider: 'mock-evolution', providerGameId: 'baccarat' },
    { name: 'Teen Patti Live', category: 'LIVE_DEALER' as const, provider: 'mock-evolution', providerGameId: 'teen-patti' },
    { name: 'Andar Bahar', category: 'TABLE' as const, provider: 'mock-pragmatic', providerGameId: 'andar-bahar' },
    { name: 'Sweet Bonanza', category: 'SLOTS' as const, provider: 'mock-pragmatic', providerGameId: 'sweet-bonanza' },
    { name: 'Crash X', category: 'CRASH' as const, provider: 'mock-spribe', providerGameId: 'crash-x' },
  ];

  for (let i = 0; i < games.length; i++) {
    const g = games[i];
    const existing = await prisma.game.findFirst({ where: { name: g.name } });
    if (!existing) {
      await prisma.game.create({
        data: {
          ...g,
          sortOrder: i,
          iframePattern: `/casino/embed/${g.providerGameId}`,
        },
      });
    }
  }

  await prisma.platformSetting.upsert({
    where: { key: 'platform' },
    update: {},
    create: {
      key: 'platform',
      value: {
        name: 'BPExch',
        currency: 'PKR',
        minWithdrawal: 500,
        minDeposit: 500,
        maxExposure: 500000,
        commissionOnWinnings: 2,
        locales: ['en', 'ur'],
      },
    },
  });

  console.log('Seed complete.');
  console.log('Accounts: superadmin, admin, manager, agent, user1, user2, demo');
  console.log('Default password pattern: Role@123 (e.g. User@123, Agent@123)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
