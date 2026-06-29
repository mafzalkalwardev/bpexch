'use client';

import { useEffect, useState } from 'react';
import { RequireAuth } from '@/components/RequireAuth';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';

export default function WalletPage() {
  const { token, user, refreshUser } = useAuth();
  const [entries, setEntries] = useState<Array<{ id: string; type: string; amount: number; balanceAfter: number; referenceType: string; createdAt: string }>>([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    api<{ entries: typeof entries }>('/wallet/statement', {}, token).then((r) => setEntries(r.entries)).catch(console.error);
  }, [token]);

  return (
    <RequireAuth roles={['USER']}>
      <div className="card-panel">
        <div className="card-panel-header">Account Ledger</div>
        <div className="p-4 bg-[#f0f4f8] border-b">
          <span className="text-sm text-gray-600">Available Balance: </span>
          <span className="text-xl font-bold text-[#0d3320]">PKR {user?.balance?.toLocaleString()}</span>
        </div>
        <table className="market-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th className="text-right">Debit</th>
              <th className="text-right">Credit</th>
              <th className="text-right">Balance</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id}>
                <td className="text-xs">{new Date(e.createdAt).toLocaleString()}</td>
                <td>{e.referenceType}</td>
                <td className="text-right text-red-600">{e.type === 'DEBIT' ? e.amount.toLocaleString() : ''}</td>
                <td className="text-right text-green-700">{e.type === 'CREDIT' ? e.amount.toLocaleString() : ''}</td>
                <td className="text-right font-medium">{e.balanceAfter.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {message && <p className="p-3 text-green-700 text-sm">{message}</p>}
      </div>
    </RequireAuth>
  );
}
