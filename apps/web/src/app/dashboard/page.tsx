'use client';

import Link from 'next/link';
import { RequireAuth } from '@/components/RequireAuth';
import { useAuth } from '@/lib/auth';

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <RequireAuth>
      <div className="card-panel">
        <div className="card-panel-header">
          <span>Dashboard</span>
          <span className="text-[#7dffb3] text-xs">PKR {user?.balance?.toLocaleString()}</span>
        </div>
        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <QuickLink href="/sports?inPlay=true" title="In-Play" desc="Live betting markets" color="bg-red-600" />
          <QuickLink href="/sports?sport=cricket" title="Cricket" desc="PSL, International, T20" color="bg-green-700" />
          <QuickLink href="/casino" title="Casino" desc="Live games & slots" color="bg-purple-700" />
          <QuickLink href="/casino?section=teenpatti" title="TeenPatti Studio" desc="Teen Patti, Andar Bahar" color="bg-orange-700" />
          <QuickLink href="/wallet" title="Account Ledger" desc="Balance & statements" color="bg-blue-700" />
          <QuickLink href="/bets/open" title="Open Bets" desc="Your active bets" color="bg-gray-700" />
        </div>
      </div>

      <div className="card-panel">
        <div className="card-panel-header">Welcome, {user?.username}</div>
        <div className="p-4 text-sm text-gray-600">
          <p>Role: <strong>{user?.role}</strong></p>
          <p className="mt-2">Use the sidebar to navigate sports, casino, and account sections — same layout as BpExch exchange.</p>
        </div>
      </div>
    </RequireAuth>
  );
}

function QuickLink({ href, title, desc, color }: { href: string; title: string; desc: string; color: string }) {
  return (
    <Link href={href} className={`${color} text-white p-4 rounded block hover:opacity-90 transition-opacity`}>
      <div className="font-semibold">{title}</div>
      <div className="text-xs opacity-80 mt-1">{desc}</div>
    </Link>
  );
}
