'use client';

import { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { RequireAuth } from '@/components/RequireAuth';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';

interface Stats {
  users: number;
  bets: number;
  pendingWithdrawals: number;
  totalBalance: number;
}

interface Withdrawal {
  id: string;
  amount: string;
  paymentMethod: string;
  user: { username: string };
  createdAt: string;
}

interface AuditEntry {
  id: string;
  action: string;
  entityType: string;
  createdAt: string;
  actor?: { username: string };
}

export default function AdminPage() {
  const { token } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [pnl, setPnl] = useState<Record<string, number> | null>(null);

  useEffect(() => {
    api<Stats>('/admin/stats', {}, token).then(setStats).catch(console.error);
    api<Withdrawal[]>('/admin/withdrawals/pending', {}, token).then(setWithdrawals).catch(console.error);
    api<AuditEntry[]>('/admin/audit', {}, token).then(setAudit).catch(console.error);
    api<Record<string, number>>('/reports/pnl', {}, token).then(setPnl).catch(console.error);
  }, [token]);

  const approveWithdrawal = async (id: string, approve: boolean) => {
    await api('/wallet/withdrawals/approve', {
      method: 'POST',
      body: JSON.stringify({ withdrawalId: id, approve }),
    }, token);
    setWithdrawals((w) => w.filter((x) => x.id !== id));
  };

  return (
    <RequireAuth roles={['ADMIN', 'SUPER_ADMIN']}>
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="card"><p className="text-gray-400 text-sm">Users</p><p className="text-2xl font-bold">{stats.users}</p></div>
            <div className="card"><p className="text-gray-400 text-sm">Total Bets</p><p className="text-2xl font-bold">{stats.bets}</p></div>
            <div className="card"><p className="text-gray-400 text-sm">Pending Withdrawals</p><p className="text-2xl font-bold">{stats.pendingWithdrawals}</p></div>
            <div className="card"><p className="text-gray-400 text-sm">Total Balance</p><p className="text-2xl font-bold text-brand-green">PKR {stats.totalBalance.toLocaleString()}</p></div>
          </div>
        )}

        {pnl && (
          <div className="card mb-8">
            <h3 className="font-semibold mb-2">Branch P&L</h3>
            <p>Net P&L: <span className="text-brand-green font-bold">PKR {pnl.netPnL?.toLocaleString()}</span></p>
            <p className="text-sm text-gray-400">Commissions: PKR {pnl.totalCommissions?.toLocaleString()}</p>
          </div>
        )}

        <h3 className="font-semibold mb-3">Pending Withdrawals</h3>
        <div className="card mb-8 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 border-b border-gray-700">
                <th className="text-left py-2">User</th>
                <th className="text-right">Amount</th>
                <th className="text-left">Method</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {withdrawals.map((w) => (
                <tr key={w.id} className="border-b border-gray-800">
                  <td className="py-2">{w.user.username}</td>
                  <td className="text-right">PKR {Number(w.amount).toLocaleString()}</td>
                  <td>{w.paymentMethod}</td>
                  <td className="text-right space-x-2">
                    <button className="btn-primary text-xs" onClick={() => approveWithdrawal(w.id, true)}>Approve</button>
                    <button className="btn-secondary text-xs" onClick={() => approveWithdrawal(w.id, false)}>Reject</button>
                  </td>
                </tr>
              ))}
              {withdrawals.length === 0 && (
                <tr><td colSpan={4} className="py-4 text-gray-500 text-center">No pending withdrawals</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <h3 className="font-semibold mb-3">Audit Log</h3>
        <div className="card overflow-x-auto max-h-96 overflow-y-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 border-b border-gray-700 sticky top-0 bg-brand-navy">
                <th className="text-left py-2">Time</th>
                <th className="text-left">Actor</th>
                <th className="text-left">Action</th>
                <th className="text-left">Entity</th>
              </tr>
            </thead>
            <tbody>
              {audit.map((a) => (
                <tr key={a.id} className="border-b border-gray-800">
                  <td className="py-2">{new Date(a.createdAt).toLocaleString()}</td>
                  <td>{a.actor?.username || 'system'}</td>
                  <td>{a.action}</td>
                  <td>{a.entityType}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </RequireAuth>
  );
}
