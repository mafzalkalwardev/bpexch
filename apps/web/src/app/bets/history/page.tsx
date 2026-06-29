'use client';

import { useEffect, useState } from 'react';
import { RequireAuth } from '@/components/RequireAuth';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';

export default function BetsHistoryPage() {
  const { token } = useAuth();
  const [bets, setBets] = useState<Array<Record<string, unknown>>>([]);

  useEffect(() => {
    api<typeof bets>('/sports/bets/my', {}, token).then(setBets).catch(console.error);
  }, [token]);

  return (
    <RequireAuth roles={['USER']}>
      <div className="card-panel">
        <div className="card-panel-header">Bets History</div>
        <table className="market-table">
          <thead>
            <tr>
              <th>Date</th>
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
              const bet = b as { id: string; side: string; odds: number; stake: number; status: string; createdAt: string; runner: { name: string; market: { event: { name: string } } } };
              return (
                <tr key={bet.id}>
                  <td className="text-xs">{new Date(bet.createdAt).toLocaleDateString()}</td>
                  <td>{bet.runner?.market?.event?.name}</td>
                  <td>{bet.runner?.name}</td>
                  <td>{bet.side}</td>
                  <td>{Number(bet.odds).toFixed(2)}</td>
                  <td>PKR {Number(bet.stake).toLocaleString()}</td>
                  <td>{bet.status}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </RequireAuth>
  );
}
