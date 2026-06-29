'use client';

import { useEffect, useState } from 'react';
import { RequireAuth } from '@/components/RequireAuth';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';

export default function OpenBetsPage() {
  const { token } = useAuth();
  const [bets, setBets] = useState<Array<Record<string, unknown>>>([]);

  useEffect(() => {
    api<typeof bets>('/sports/bets/my?status=MATCHED', {}, token).then(setBets).catch(console.error);
  }, [token]);

  return (
    <RequireAuth roles={['USER']}>
      <div className="card-panel">
        <div className="card-panel-header">Open Bets</div>
        <table className="market-table">
          <thead>
            <tr>
              <th>Event</th>
              <th>Selection</th>
              <th>Side</th>
              <th>Odds</th>
              <th>Stake</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {bets.map((b) => {
              const bet = b as { id: string; side: string; odds: number; stake: number; status: string; runner: { name: string; market: { name: string; event: { name: string } } } };
              return (
                <tr key={bet.id}>
                  <td>{bet.runner?.market?.event?.name}</td>
                  <td>{bet.runner?.name}</td>
                  <td className={bet.side === 'BACK' ? 'text-blue-600 font-bold' : 'text-pink-600 font-bold'}>{bet.side}</td>
                  <td>{Number(bet.odds).toFixed(2)}</td>
                  <td>PKR {Number(bet.stake).toLocaleString()}</td>
                  <td>{bet.status}</td>
                </tr>
              );
            })}
            {bets.length === 0 && (
              <tr><td colSpan={6} className="text-center text-gray-400 py-6">No open bets</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </RequireAuth>
  );
}
