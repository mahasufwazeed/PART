import React, { useState } from 'react';
import { mockStore, Profile } from '@part/shared';
import { Search, ShieldCheck, UserX, Star, CheckCircle } from 'lucide-react';

export const UsersPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [profiles, setProfiles] = useState<Profile[]>(
    Array.from(mockStore.profiles.values())
  );

  const filtered = profiles.filter(
    (p) =>
      p.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.general_location || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggleVerification = (userId: string) => {
    const p = mockStore.profiles.get(userId);
    if (!p) return;
    p.verification_status = p.verification_status === 'verified' ? 'unverified' : 'verified';
    setProfiles(Array.from(mockStore.profiles.values()));
  };

  return (
    <div className="space-y-5 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-base font-extrabold text-slate-900">
            User Management & Verification
          </h2>
          <p className="text-xs text-slate-400">
            Moderate registered accounts, verify IDs, and enforce safety policies.
          </p>
        </div>

        <div className="relative w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by name or locality..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="text-slate-400 border-b border-slate-100 uppercase text-[10px] tracking-wider">
              <th className="pb-3">User</th>
              <th className="pb-3">Locality</th>
              <th className="pb-3">Worker Rating</th>
              <th className="pb-3">Requester Rating</th>
              <th className="pb-3">Verification</th>
              <th className="pb-3 text-right">Moderation Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((user) => (
              <tr key={user.id} className="hover:bg-slate-50 transition">
                <td className="py-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">
                      {user.full_name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 flex items-center gap-1">
                        <span>{user.full_name}</span>
                        {user.is_admin && (
                          <span className="text-[9px] bg-indigo-100 text-primary font-bold px-1.5 py-0.2 rounded">
                            ADMIN
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {user.phone || 'Phone hidden'}
                      </span>
                    </div>
                  </div>
                </td>

                <td className="py-3.5 font-medium text-slate-600">
                  {user.general_location || 'Chennai'}
                </td>

                <td className="py-3.5">
                  <span className="font-bold text-amber-600 flex items-center gap-1">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                    {user.rating_as_worker.toFixed(1)} ({user.total_reviews_as_worker})
                  </span>
                </td>

                <td className="py-3.5">
                  <span className="font-bold text-slate-700 flex items-center gap-1">
                    <Star className="w-3 h-3 fill-slate-300 text-slate-400" />
                    {user.rating_as_requester.toFixed(1)} ({user.total_reviews_as_requester})
                  </span>
                </td>

                <td className="py-3.5">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      user.verification_status === 'verified'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {user.verification_status === 'verified' ? (
                      <>
                        <ShieldCheck className="w-3 h-3" />
                        Verified
                      </>
                    ) : (
                      'Unverified'
                    )}
                  </span>
                </td>

                <td className="py-3.5 text-right space-x-2">
                  <button
                    onClick={() => handleToggleVerification(user.id)}
                    className="text-xs font-bold text-primary hover:underline"
                  >
                    {user.verification_status === 'verified' ? 'Revoke ID' : 'Verify ID'}
                  </button>
                  <button
                    onClick={() => alert(`Account ${user.full_name} flagged for review.`)}
                    className="text-xs font-bold text-rose-600 hover:underline"
                  >
                    Suspend
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
