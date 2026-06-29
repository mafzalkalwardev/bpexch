'use client';

import { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { RequireAuth } from '@/components/RequireAuth';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';

interface DownlineUser {
  id: string;
  username: string;
  role: string;
  balance: number;
  depth: number;
}

export default function AgentPage() {
  const { token, refreshUser } = useAuth();
  const [downline, setDownline] = useState<DownlineUser[]>([]);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [creditUserId, setCreditUserId] = useState('');
  const [creditAmount, setCreditAmount] = useState(1000);
  const [message, setMessage] = useState('');

  const loadDownline = () => {
    api<DownlineUser[]>('/users/downline', {}, token).then(setDownline).catch(console.error);
  };

  useEffect(() => { loadDownline(); }, [token]);

  const createUser = async () => {
    try {
      await api('/users', {
        method: 'POST',
        body: JSON.stringify({ username: newUsername, password: newPassword, role: 'USER' }),
      }, token);
      setMessage('User created');
      setNewUsername('');
      setNewPassword('');
      loadDownline();
    } catch (err) {
      setMessage((err as Error).message);
    }
  };

  const creditUser = async () => {
    try {
      await api('/wallet/credit', {
        method: 'POST',
        body: JSON.stringify({ userId: creditUserId, amount: creditAmount }),
      }, token);
      setMessage('Credit applied');
      loadDownline();
      refreshUser();
    } catch (err) {
      setMessage((err as Error).message);
    }
  };

  return (
    <RequireAuth roles={['AGENT', 'MANAGER', 'ADMIN', 'SUPER_ADMIN']}>
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">Agent Panel</h1>
        {message && <p className="text-brand-green mb-4">{message}</p>}

        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <div className="card">
            <h3 className="font-semibold mb-3">Create User</h3>
            <input className="input mb-2" placeholder="Username" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} />
            <input className="input mb-2" type="password" placeholder="Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            <button className="btn-primary w-full" onClick={createUser}>Create User</button>
          </div>
          <div className="card">
            <h3 className="font-semibold mb-3">Credit User Wallet</h3>
            <select className="input mb-2" value={creditUserId} onChange={(e) => setCreditUserId(e.target.value)}>
              <option value="">Select user</option>
              {downline.filter((u) => u.role === 'USER').map((u) => (
                <option key={u.id} value={u.id}>{u.username} (PKR {u.balance})</option>
              ))}
            </select>
            <input type="number" className="input mb-2" value={creditAmount} onChange={(e) => setCreditAmount(Number(e.target.value))} />
            <button className="btn-primary w-full" onClick={creditUser}>Credit PKR</button>
          </div>
        </div>

        <h3 className="font-semibold mb-3">Downline</h3>
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 border-b border-gray-700">
                <th className="text-left py-2">Username</th>
                <th className="text-left">Role</th>
                <th className="text-right">Balance</th>
                <th className="text-right">Depth</th>
              </tr>
            </thead>
            <tbody>
              {downline.map((u) => (
                <tr key={u.id} className="border-b border-gray-800">
                  <td className="py-2">{u.username}</td>
                  <td>{u.role}</td>
                  <td className="text-right text-brand-green">PKR {u.balance.toLocaleString()}</td>
                  <td className="text-right">{u.depth}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </RequireAuth>
  );
}
