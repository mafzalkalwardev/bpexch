'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { RequireAuth } from '@/components/RequireAuth';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';

interface Game {
  id: string;
  name: string;
  category: string;
  provider: string;
}

const SECTION_TITLES: Record<string, string> = {
  world: 'World Casino',
  galaxy: 'Galaxy Casino',
  teenpatti: 'TeenPatti Studio',
  premium: 'Premium Games',
  live: 'Live Casino',
};

function CasinoContent() {
  const { token } = useAuth();
  const searchParams = useSearchParams();
  const section = searchParams.get('section') || '';
  const [games, setGames] = useState<Game[]>([]);
  const [activeGame, setActiveGame] = useState<{ url: string; name: string } | null>(null);

  useEffect(() => {
    api<Game[]>('/casino/games', {}, token).then(setGames).catch(console.error);
  }, [token]);

  const title = SECTION_TITLES[section] || 'Star Casino';

  const launchGame = async (gameId: string, name: string) => {
    const res = await api<{ iframeUrl: string }>('/casino/launch', {
      method: 'POST',
      body: JSON.stringify({ gameId }),
    }, token);
    setActiveGame({ url: res.iframeUrl, name });
  };

  return (
    <>
      <div className="card-panel">
        <div className="card-panel-header">{title}</div>
        {activeGame ? (
          <div>
            <div className="bg-[#1a2744] text-white px-3 py-2 flex justify-between text-sm">
              <span>{activeGame.name}</span>
              <button onClick={() => setActiveGame(null)} className="text-gray-300 hover:text-white">✕ Close</button>
            </div>
            <iframe src={activeGame.url} className="w-full h-[580px] border-0" sandbox="allow-scripts allow-same-origin allow-forms" allowFullScreen />
          </div>
        ) : (
          <div className="p-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
            {games.map((game) => (
              <button key={game.id} className="game-tile" onClick={() => launchGame(game.id, game.name)}>
                <div className="h-20 bg-gradient-to-br from-[#1a2744] to-[#3a5a8a] flex items-center justify-center text-2xl">
                  {game.category === 'AVIATOR' ? '✈' : game.category === 'LIVE_DEALER' ? '🎲' : '🎰'}
                </div>
                <div className="p-2 text-xs font-semibold text-[#1a2744] text-left">{game.name}</div>
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default function CasinoPage() {
  return (
    <RequireAuth roles={['USER']}>
      <Suspense fallback={<div>Loading...</div>}>
        <CasinoContent />
      </Suspense>
    </RequireAuth>
  );
}
