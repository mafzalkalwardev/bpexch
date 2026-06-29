'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { RequireAuth } from '@/components/RequireAuth';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { io } from 'socket.io-client';

interface Event {
  id: string;
  name: string;
  status: string;
  sport: { name: string; slug: string };
  markets: {
    id: string;
    name: string;
    runners: {
      id: string;
      name: string;
      oddsSnapshots: { backPrice: string; layPrice: string }[];
    }[];
  }[];
}

interface BetSlip {
  runnerId: string;
  runnerName: string;
  side: 'BACK' | 'LAY';
  odds: number;
}

function SportsContent() {
  const { token, refreshUser } = useAuth();
  const searchParams = useSearchParams();
  const sport = searchParams.get('sport') || '';
  const inPlay = searchParams.get('inPlay') === 'true';
  const [events, setEvents] = useState<Event[]>([]);
  const [betSlip, setBetSlip] = useState<BetSlip | null>(null);
  const [stake, setStake] = useState(500);
  const [message, setMessage] = useState('');

  const loadEvents = () => {
    const qs = new URLSearchParams();
    if (sport) qs.set('sport', sport);
    if (inPlay) qs.set('inPlay', 'true');
    api<Event[]>(`/sports/events?${qs}`, {}, token).then(setEvents).catch(console.error);
  };

  useEffect(() => { loadEvents(); }, [token, sport, inPlay]);

  useEffect(() => {
    const socket = io(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/sports`);
    socket.on('odds', () => loadEvents());
    return () => { socket.disconnect(); };
  }, [token, sport, inPlay]);

  const placeBet = async () => {
    if (!betSlip || !token) return;
    try {
      await api('/sports/bets', { method: 'POST', body: JSON.stringify({ ...betSlip, stake }) }, token);
      setMessage('Bet placed successfully');
      setBetSlip(null);
      refreshUser();
    } catch (err) {
      setMessage((err as Error).message);
    }
  };

  const title = inPlay ? 'In-Play' : sport ? sport.charAt(0).toUpperCase() + sport.slice(1) : 'All Sports';

  return (
    <div className="flex gap-3">
      <div className="flex-1 min-w-0">
        <div className="card-panel">
          <div className="card-panel-header">{title}</div>
          {events.map((event) => (
            <div key={event.id} className="border-b border-gray-200 last:border-0">
              <div className="bg-[#f0f4f8] px-3 py-2 flex justify-between items-center">
                <span className="font-semibold text-sm text-[#1a2744]">{event.name}</span>
                {event.status === 'IN_PLAY' && (
                  <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded">IN-PLAY</span>
                )}
              </div>
              {event.markets.map((market) => (
                <table key={market.id} className="market-table">
                  <thead>
                    <tr>
                      <th className="w-1/2">{market.name}</th>
                      <th className="text-center w-24">Back</th>
                      <th className="text-center w-24">Lay</th>
                    </tr>
                  </thead>
                  <tbody>
                    {market.runners.map((runner) => {
                      const odds = runner.oddsSnapshots[0];
                      const back = odds ? Number(odds.backPrice) : 0;
                      const lay = odds ? Number(odds.layPrice) : 0;
                      return (
                        <tr key={runner.id}>
                          <td className="font-medium">{runner.name}</td>
                          <td className="text-center">
                            <button className="odds-back" onClick={() => setBetSlip({ runnerId: runner.id, runnerName: runner.name, side: 'BACK', odds: back })}>
                              {back.toFixed(2)}
                            </button>
                          </td>
                          <td className="text-center">
                            <button className="odds-lay" onClick={() => setBetSlip({ runnerId: runner.id, runnerName: runner.name, side: 'LAY', odds: lay })}>
                              {lay.toFixed(2)}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="w-56 flex-shrink-0">
        <div className="betslip-panel sticky top-3">
          <div className="betslip-header">Bet Slip</div>
          <div className="p-3">
            {betSlip ? (
              <>
                <p className="text-sm font-medium">{betSlip.runnerName}</p>
                <p className={`text-sm font-bold mt-1 ${betSlip.side === 'BACK' ? 'text-blue-600' : 'text-pink-600'}`}>
                  {betSlip.side} @ {betSlip.odds.toFixed(2)}
                </p>
                <input type="number" className="input-bpexch mt-3" value={stake} onChange={(e) => setStake(Number(e.target.value))} min={100} />
                <button className="btn-login mt-3" onClick={placeBet}>Place Bet</button>
              </>
            ) : (
              <p className="text-gray-400 text-xs">Click Back or Lay to bet</p>
            )}
            {message && <p className="text-green-700 text-xs mt-2">{message}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SportsPage() {
  return (
    <RequireAuth roles={['USER']}>
      <Suspense fallback={<div>Loading...</div>}>
        <SportsContent />
      </Suspense>
    </RequireAuth>
  );
}
