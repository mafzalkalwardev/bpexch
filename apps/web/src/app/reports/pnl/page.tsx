'use client';

import { useEffect, useState } from 'react';
import { RequireAuth } from '@/components/RequireAuth';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';

export default function PnlPage() {
  const { token } = useAuth();
  const [pnl, setPnl] = useState<Record<string, number> | null>(null);

  useEffect(() => {
    api<Record<string, number>>('/reports/pnl', {}, token).then(setPnl).catch(() => {});
  }, [token]);

  return (
    <RequireAuth roles={['USER', 'AGENT', 'MANAGER', 'ADMIN', 'SUPER_ADMIN']}>
      <div className="card-panel">
        <div className="card-panel-header">Profit / Loss</div>
        <div className="p-4 space-y-2 text-sm">
          {pnl ? (
            <>
              <div className="flex justify-between"><span>Total Winnings</span><span className="text-green-700">PKR {pnl.totalWinnings?.toLocaleString()}</span></div>
              <div className="flex justify-between"><span>Total Losses</span><span className="text-red-600">PKR {pnl.totalLosses?.toLocaleString()}</span></div>
              <div className="flex justify-between font-bold border-t pt-2"><span>Net P&L</span><span>PKR {pnl.netPnL?.toLocaleString()}</span></div>
            </>
          ) : (
            <p className="text-gray-500">No P&L data available for your account level</p>
          )}
        </div>
      </div>
    </RequireAuth>
  );
}
