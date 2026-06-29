'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      router.push('/dashboard');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#eef1f5]">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-[#1a2744]">
            <span className="text-[#f5c518]">Bp</span>Exch
          </h1>
          <p className="text-gray-500 text-sm mt-1">Login to your account</p>
        </div>
        <div className="bg-white border border-gray-300 shadow-md p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-gray-600 uppercase tracking-wide">Username</label>
              <input
                className="input-bpexch mt-1"
                name="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
              />
            </div>
            <div>
              <label className="text-xs text-gray-600 uppercase tracking-wide">Password</label>
              <input
                type="password"
                className="input-bpexch mt-1"
                name="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button type="submit" className="btn-login" disabled={loading}>
              {loading ? 'Please wait...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
