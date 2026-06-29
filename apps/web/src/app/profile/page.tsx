'use client';

import { RequireAuth } from '@/components/RequireAuth';
import { useAuth } from '@/lib/auth';

export default function ProfilePage() {
  const { user } = useAuth();
  return (
    <RequireAuth>
      <div className="card-panel">
        <div className="card-panel-header">Profile</div>
        <div className="p-4 text-sm space-y-2">
          <p><span className="text-gray-500 w-24 inline-block">Username</span> <strong>{user?.username}</strong></p>
          <p><span className="text-gray-500 w-24 inline-block">Role</span> {user?.role}</p>
          <p><span className="text-gray-500 w-24 inline-block">Balance</span> PKR {user?.balance?.toLocaleString()}</p>
        </div>
      </div>
    </RequireAuth>
  );
}
