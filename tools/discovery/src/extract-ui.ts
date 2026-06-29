import { config } from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { chromium } from 'playwright';

config({ path: path.resolve(__dirname, '../../../.env') });

const BASE = process.env.BPEXCH_BASE_URL || 'https://bpexch.live';
const OUT = path.resolve(__dirname, '../../../docs/discovery/ui-reference.json');

async function login(page: import('playwright').Page) {
  await page.goto(`${BASE}/Users/Login`, { waitUntil: 'networkidle', timeout: 60000 });
  const user = process.env.BPEXCH_USER;
  const pass = process.env.BPEXCH_PASS;
  if (!user || !pass) return false;
  await page.fill('input[name="Username"], input#Username, input[type="text"]', user);
  await page.fill('input[name="Password"], input#Password, input[type="password"]', pass);
  await page.click('button[type="submit"], input[type="submit"]');
  await page.waitForTimeout(3000);
  return !page.url().toLowerCase().includes('login');
}

async function extractStyles(page: import('playwright').Page) {
  return page.evaluate(() => {
    const pick = (sel: string) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const s = getComputedStyle(el);
      return {
        background: s.backgroundColor,
        color: s.color,
        fontFamily: s.fontFamily,
        fontSize: s.fontSize,
        padding: s.padding,
        border: s.border,
      };
    };
    const navLinks = [...document.querySelectorAll('a, .nav-link, [class*="menu"] a, li a')]
      .slice(0, 40)
      .map((a) => ({ text: (a as HTMLElement).innerText?.trim().slice(0, 40), href: (a as HTMLAnchorElement).href }))
      .filter((x) => x.text);
    const body = getComputedStyle(document.body);
    return {
      body: { background: body.backgroundColor, color: body.color, fontFamily: body.fontFamily },
      header: pick('header') || pick('.navbar') || pick('[class*="header"]'),
      sidebar: pick('.sidebar') || pick('[class*="sidebar"]') || pick('aside'),
      primaryBtn: pick('button[type="submit"]') || pick('.btn-primary') || pick('button'),
      navLinks,
      title: document.title,
      htmlClass: document.documentElement.className,
      bodyClass: document.body.className,
    };
  });
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  const result: Record<string, unknown> = {};

  await page.goto(`${BASE}/Users/Login`, { waitUntil: 'networkidle' });
  await page.screenshot({ path: path.resolve(__dirname, '../../../docs/discovery/screenshots/login-ref.png'), fullPage: true });
  result.login = await extractStyles(page);
  result.loginHtml = await page.content();

  const loggedIn = await login(page);
  if (loggedIn) {
    await page.screenshot({ path: path.resolve(__dirname, '../../../docs/discovery/screenshots/dashboard-ref.png'), fullPage: true });
    result.dashboard = await extractStyles(page);
    result.dashboardNav = (result.dashboard as { navLinks?: unknown }).navLinks;

    await page.goto(`${BASE}/Common/RSC`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.resolve(__dirname, '../../../docs/discovery/screenshots/casino-ref.png'), fullPage: true });
    result.casino = await extractStyles(page);
  }

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(result, null, 2));
  console.log('UI reference saved:', OUT);
  await browser.close();
}

main().catch(console.error);
