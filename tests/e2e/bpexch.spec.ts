import { test, expect } from '@playwright/test';

const WEB = process.env.WEB_URL || 'http://localhost:3000';
const API = process.env.API_URL || 'http://localhost:3001';

test.describe('BPExch E2E', () => {
  test('login as demo user', async ({ page }) => {
    await page.goto(`${WEB}/login`);
    await page.fill('input', 'demo');
    await page.locator('input[type="password"]').fill('User@123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/dashboard/);
    await expect(page.getByText('demo')).toBeVisible();
  });

  test('place sports bet flow', async ({ page, request }) => {
    const loginRes = await request.post(`${API}/api/auth/login`, {
      data: { username: 'demo', password: 'User@123' },
    });
    const { accessToken } = await loginRes.json();

    const eventsRes = await request.get(`${API}/api/sports/events`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const events = await eventsRes.json();
    expect(events.length).toBeGreaterThan(0);

    const runner = events[0].markets[0].runners[0];
    const odds = runner.oddsSnapshots[0];

    const betRes = await request.post(`${API}/api/sports/bets`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: {
        runnerId: runner.id,
        side: 'BACK',
        odds: Number(odds.backPrice),
        stake: 100,
      },
    });
    expect(betRes.ok()).toBeTruthy();
  });

  test('launch casino game', async ({ page, request }) => {
    const loginRes = await request.post(`${API}/api/auth/login`, {
      data: { username: 'demo', password: 'User@123' },
    });
    const { accessToken } = await loginRes.json();

    const gamesRes = await request.get(`${API}/api/casino/games`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const games = await gamesRes.json();
    expect(games.length).toBeGreaterThan(0);

    const launchRes = await request.post(`${API}/api/casino/launch`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { gameId: games[0].id },
    });
    expect(launchRes.ok()).toBeTruthy();
    const { iframeUrl } = await launchRes.json();
    expect(iframeUrl).toContain('/casino/embed/');
  });

  test('agent credit flow', async ({ request }) => {
    const agentLogin = await request.post(`${API}/api/auth/login`, {
      data: { username: 'agent', password: 'Agent@123' },
    });
    const { accessToken: agentToken } = await agentLogin.json();

    const downline = await request.get(`${API}/api/users/downline`, {
      headers: { Authorization: `Bearer ${agentToken}` },
    });
    const users = await downline.json();
    const demoUser = users.find((u: { username: string }) => u.username === 'demo');

    const creditRes = await request.post(`${API}/api/wallet/credit`, {
      headers: { Authorization: `Bearer ${agentToken}` },
      data: { userId: demoUser.id, amount: 100, note: 'E2E test credit' },
    });
    expect(creditRes.ok()).toBeTruthy();
  });
});
