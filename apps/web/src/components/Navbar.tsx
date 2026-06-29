'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';

const navItems = [
  { href: '/dashboard', label: 'Home', roles: ['USER', 'AGENT', 'MANAGER', 'ADMIN', 'SUPER_ADMIN'] },
  { href: '/sports', label: 'Sports', roles: ['USER'] },
  { href: '/casino', label: 'Casino', roles: ['USER'] },
  { href: '/wallet', label: 'Wallet', roles: ['USER'] },
  { href: '/agent', label: 'Agent', roles: ['AGENT', 'MANAGER', 'ADMIN', 'SUPER_ADMIN'] },
  { href: '/admin', label: 'Admin', roles: ['ADMIN', 'SUPER_ADMIN'] },
];

export function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  if (!user) return null;

  return (
    <nav className="bg-brand-navy border-b border-gray-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="text-brand-gold font-bold text-xl">
            BPExch
          </Link>
          {navItems
            .filter((n) => n.roles.includes(user.role))
            .map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm ${pathname.startsWith(item.href) ? 'text-brand-gold' : 'text-gray-300 hover:text-white'}`}
              >
                {item.label}
              </Link>
            ))}
        </div>
        <div className="flex items-center gap-4">
          <span className="text-brand-green font-mono text-sm">
            PKR {user.balance?.toLocaleString() ?? '0'}
          </span>
          <span className="text-gray-400 text-sm">{user.username}</span>
          <span className="text-xs bg-gray-700 px-2 py-0.5 rounded">{user.role}</span>
          <button onClick={logout} className="text-sm text-gray-400 hover:text-white">
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
