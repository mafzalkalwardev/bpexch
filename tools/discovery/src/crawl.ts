import { config } from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

config({ path: path.resolve(__dirname, '../../../.env') });
import { chromium, type Page, type Request } from 'playwright';

const BASE_URL = process.env.BPEXCH_BASE_URL || 'https://bpexch.live';
const USERNAME = process.env.BPEXCH_USER || '';
const PASSWORD = process.env.BPEXCH_PASS || '';

const OUTPUT_DIR = path.resolve(__dirname, '../../../docs/discovery');
const SCREENSHOTS_DIR = path.join(OUTPUT_DIR, 'screenshots');

interface RouteInfo {
  url: string;
  title: string;
  path: string;
  timestamp: string;
}

interface GameInfo {
  name: string;
  category: string;
  iframeSrc?: string;
  providerHint?: string;
}

interface ApiHint {
  method: string;
  url: string;
  resourceType: string;
}

const ROUTES_TO_TRY = [
  '/',
  '/Users/Login',
  '/Users/Dashboard',
  '/Users/Home',
  '/Sports',
  '/Sports/InPlay',
  '/Casino',
  '/Casino/Live',
  '/Wallet',
  '/Account/Statement',
  '/Bets/Open',
  '/Bets/History',
  '/Agent',
  '/Agent/Users',
  '/Agent/Reports',
  '/Admin',
  '/Admin/Dashboard',
];

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function slugify(s: string) {
  return s.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase().slice(0, 80);
}

async function extractNav(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a[href]'));
    return [...new Set(links.map((a) => (a as HTMLAnchorElement).href).filter(Boolean))];
  });
}

async function extractGames(page: Page): Promise<GameInfo[]> {
  return page.evaluate(() => {
    const games: GameInfo[] = [];
    const iframes = document.querySelectorAll('iframe');
    iframes.forEach((iframe) => {
      games.push({
        name: iframe.getAttribute('title') || iframe.getAttribute('data-game') || 'Unknown',
        category: iframe.getAttribute('data-category') || 'unknown',
        iframeSrc: iframe.src || undefined,
      });
    });
    document.querySelectorAll('[data-game-name], .game-item, .casino-game, .game-card').forEach((el) => {
      const name =
        el.getAttribute('data-game-name') ||
        el.querySelector('img')?.alt ||
        el.textContent?.trim().slice(0, 60) ||
        'Unknown';
      games.push({
        name,
        category: el.getAttribute('data-category') || 'unknown',
      });
    });
    return games;
  });
}

async function login(page: Page): Promise<boolean> {
  const loginUrl = `${BASE_URL}/Users/Login`;
  await page.goto(loginUrl, { waitUntil: 'networkidle', timeout: 60000 });

  if (!USERNAME || !PASSWORD) {
    console.warn('BPEXCH_USER/BPEXCH_PASS not set — capturing public pages only.');
    return false;
  }

  const usernameSelectors = [
    'input[name="Username"]',
    'input[name="username"]',
    'input#Username',
    'input[type="text"]',
  ];
  const passwordSelectors = [
    'input[name="Password"]',
    'input[name="password"]',
    'input#Password',
    'input[type="password"]',
  ];

  for (const sel of usernameSelectors) {
    if (await page.locator(sel).count()) {
      await page.fill(sel, USERNAME);
      break;
    }
  }
  for (const sel of passwordSelectors) {
    if (await page.locator(sel).count()) {
      await page.fill(sel, PASSWORD);
      break;
    }
  }

  const submitSelectors = [
    'button[type="submit"]',
    'input[type="submit"]',
    'button:has-text("Login")',
    'button:has-text("Sign In")',
    '.btn-login',
  ];
  for (const sel of submitSelectors) {
    if (await page.locator(sel).count()) {
      await page.click(sel);
      break;
    }
  }

  await page.waitForTimeout(3000);
  const url = page.url();
  return !url.toLowerCase().includes('login');
}

async function crawl() {
  ensureDir(OUTPUT_DIR);
  ensureDir(SCREENSHOTS_DIR);

  const routes: RouteInfo[] = [];
  const games: GameInfo[] = [];
  const apiHints: ApiHint[] = [];
  const navLinks = new Set<string>();

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });
  const page = await context.newPage();

  page.on('request', (req: Request) => {
    const url = req.url();
    const rt = req.resourceType();
    if (rt === 'xhr' || rt === 'fetch') {
      apiHints.push({ method: req.method(), url, resourceType: rt });
    }
  });

  const loggedIn = await login(page);
  console.log(loggedIn ? 'Login successful' : 'Public-only crawl');

  const pathsToVisit = new Set<string>(ROUTES_TO_TRY);
  if (loggedIn) {
    const homeLinks = await extractNav(page);
    homeLinks
      .filter((l) => l.startsWith(BASE_URL))
      .forEach((l) => {
        try {
          pathsToVisit.add(new URL(l).pathname);
        } catch {
          /* ignore */
        }
      });
  }

  for (const routePath of pathsToVisit) {
    const url = routePath.startsWith('http') ? routePath : `${BASE_URL}${routePath}`;
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(1500);

      const title = await page.title();
      const currentPath = new URL(page.url()).pathname;

      routes.push({
        url: page.url(),
        title,
        path: currentPath,
        timestamp: new Date().toISOString(),
      });

      const shotName = slugify(currentPath || 'root') + '.png';
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, shotName), fullPage: true });

      const pageGames = await extractGames(page);
      games.push(...pageGames);

      const links = await extractNav(page);
      links.forEach((l) => navLinks.add(l));

      console.log(`Captured: ${currentPath} (${title})`);
    } catch (err) {
      console.warn(`Failed ${url}:`, (err as Error).message);
    }
  }

  await browser.close();

  const uniqueApiHints = Array.from(
    new Map(apiHints.map((h) => [`${h.method}:${h.url}`, h])).values(),
  ).slice(0, 200);

  const uniqueGames = Array.from(new Map(games.map((g) => [g.name, g])).values());

  fs.writeFileSync(path.join(OUTPUT_DIR, 'routes.json'), JSON.stringify(routes, null, 2));
  fs.writeFileSync(path.join(OUTPUT_DIR, 'games.json'), JSON.stringify(uniqueGames, null, 2));
  fs.writeFileSync(path.join(OUTPUT_DIR, 'api-hints.json'), JSON.stringify(uniqueApiHints, null, 2));
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'nav-links.json'),
    JSON.stringify([...navLinks].sort(), null, 2),
  );

  const uiComponents = `# UI Components Discovery

Generated: ${new Date().toISOString()}
Base URL: ${BASE_URL}
Logged in: ${loggedIn}

## Navigation Links (${navLinks.size})
${[...navLinks].slice(0, 50).map((l) => `- ${l}`).join('\n')}

## Routes Captured (${routes.length})
${routes.map((r) => `- **${r.path}** — ${r.title}`).join('\n')}

## Games Found (${uniqueGames.length})
${uniqueGames.map((g) => `- ${g.name} (${g.category})${g.iframeSrc ? ` — iframe: ${g.iframeSrc}` : ''}`).join('\n')}

## Expected MVP UI Components
- Top nav: Sports | In-Play | Casino | Wallet | Account
- Market table: Runner | Back | Lay columns
- Bet slip: side, odds, stake, potential profit
- Casino lobby: category tabs + game grid
- Wallet: balance, deposit request, withdrawal request, statement
- Agent panel: create user, credit, downline list
- Admin: hierarchy tree, pending withdrawals, audit log
`;

  fs.writeFileSync(path.join(OUTPUT_DIR, 'ui-components.md'), uiComponents);
  console.log(`Discovery complete. Output: ${OUTPUT_DIR}`);
}

crawl().catch((err) => {
  console.error(err);
  process.exit(1);
});
