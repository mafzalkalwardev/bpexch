'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';

const sportsMenu = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/sports?inPlay=true', label: 'In-Play' },
  { href: '/sports?sport=cricket', label: 'Cricket' },
  { href: '/sports?sport=football', label: 'Soccer' },
  { href: '/sports', label: 'All Sports' },
];

const casinoMenu = [
  { href: '/casino', label: 'Star Casino' },
  { href: '/casino?section=world', label: 'World Casino' },
  { href: '/casino?section=galaxy', label: 'Galaxy Casino' },
  { href: '/casino?section=teenpatti', label: 'TeenPatti Studio' },
  { href: '/casino?section=premium', label: 'Premium Games' },
  { href: '/casino?section=live', label: 'Live Casino' },
];

const accountMenu = [
  { href: '/wallet', label: 'Account Ledger' },
  { href: '/bets/open', label: 'Open Bets' },
  { href: '/bets/history', label: 'Bets History' },
  { href: '/reports/pnl', label: 'Profit / Loss' },
  { href: '/reports/liabilities', label: 'Liabilities' },
  { href: '/profile', label: 'Profile' },
];

const adminMenu = [
  { href: '/agent', label: 'Agent Panel' },
  { href: '/admin', label: 'Admin Dashboard' },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  if (!user) return <>{children}</>;

  const isActive = (href: string) => pathname === href || pathname.startsWith(href.split('?')[0]);

  return (
    <div className="min-h-screen flex flex-col bg-[#eef1f5]">
      <header className="bg-[#1a2744] text-white h-12 flex items-center px-4 justify-between shadow-md z-20">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="font-bold text-lg tracking-wide">
            <span className="text-[#f5c518]">Bp</span>Exch
          </Link>
          <span className="text-xs text-gray-300 hidden md:inline">Betting Exchange</span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="bg-[#0d3320] px-3 py-1 rounded text-[#7dffb3] font-semibold">
            PKR {user.balance?.toLocaleString(undefined, { minimumFractionDigits: 2 }) ?? '0.00'}
          </div>
          <span className="text-gray-300">{user.username}</span>
          <button onClick={logout} className="text-gray-400 hover:text-white text-xs uppercase tracking-wide">
            Logout
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-52 bg-[#243352] text-gray-200 flex-shrink-0 overflow-y-auto hidden md:block">
          <SidebarSection title="Sports">
            {sportsMenu.map((item) => (
              <SidebarLink key={item.href} href={item.href} label={item.label} active={isActive(item.href)} />
            ))}
          </SidebarSection>
          <SidebarSection title="Casino">
            {casinoMenu.map((item) => (
              <SidebarLink key={item.href} href={item.href} label={item.label} active={isActive(item.href)} />
            ))}
          </SidebarSection>
          <SidebarSection title="Account">
            {accountMenu.map((item) => (
              <SidebarLink key={item.href} href={item.href} label={item.label} active={isActive(item.href)} />
            ))}
          </SidebarSection>
          {['AGENT', 'MANAGER', 'ADMIN', 'SUPER_ADMIN'].includes(user.role) && (
            <SidebarSection title="Management">
              {adminMenu.map((item) => (
                <SidebarLink key={item.href} href={item.href} label={item.label} active={isActive(item.href)} />
              ))}
            </SidebarSection>
          )}
        </aside>

        <main className="flex-1 overflow-y-auto p-3 md:p-4">{children}</main>
      </div>
    </div>
  );
}

function SidebarSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-[#1a2744]">
      <div className="px-3 py-2 text-[10px] uppercase tracking-widest text-gray-400 font-semibold">{title}</div>
      {children}
    </div>
  );
}

function SidebarLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`block px-4 py-2 text-sm border-l-2 transition-colors ${
        active
          ? 'border-[#f5c518] bg-[#1a2744] text-white'
          : 'border-transparent hover:bg-[#1a2744]/60 hover:text-white'
      }`}
    >
      {label}
    </Link>
  );
}
