import React, { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';
import { Users, Shield, Stethoscope, User, Search } from 'lucide-react';
import { Badge } from '../../components/common/StatCard';
import { formatDate } from '../../utils/formatters';

export function UsersPage() {
  const [users, setUsers] = useState([]);
  const [filterRole, setFilterRole] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUsers() {
      setLoading(true);
      try {
        const res = await adminApi.getUsers(filterRole);
        if (res.success) setUsers(res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadUsers();
  }, [filterRole]);

  const filteredUsers = users.filter((u) => {
    const matchName = u.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchEmail = u.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchName || matchEmail;
  });

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin':
        return <Shield className="w-4 h-4 text-purple-400" />;
      case 'staff':
        return <Stethoscope className="w-4 h-4 text-emerald-400" />;
      default:
        return <User className="w-4 h-4 text-sky-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
            Admin Console
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">
            Staff & Customer Directory
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage system access, customer registrations, and service desk assignments.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search name or email..."
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {['', 'customer', 'staff', 'admin'].map((r) => (
            <button
              key={r}
              onClick={() => setFilterRole(r)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-colors ${
                filterRole === r
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {r || 'All Roles'}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/60 text-slate-400 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-4 px-6">Name</th>
                <th className="py-4 px-6">Email</th>
                <th className="py-4 px-6">Phone</th>
                <th className="py-4 px-6">Role</th>
                <th className="py-4 px-6">Registered</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredUsers.map((u) => (
                <tr key={u._id || u.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-4 px-6 font-semibold text-white">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center">
                        {getRoleIcon(u.role)}
                      </div>
                      <span>{u.name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-slate-400">{u.email}</td>
                  <td className="py-4 px-6 text-slate-400">{u.phone || '--'}</td>
                  <td className="py-4 px-6">
                    <Badge
                      status={u.role === 'admin' ? 'purple' : u.role === 'staff' ? 'active' : 'brand'}
                      text={u.role}
                      size="sm"
                    />
                  </td>
                  <td className="py-4 px-6 text-slate-400">{formatDate(u.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
