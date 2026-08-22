import React, { useState } from 'react';
import { Shield, Clock, Search, Trash2, UserCheck, Key, FileEdit, AlertCircle } from 'lucide-react';
import { AuditLog } from '../../types';

interface AuditLogsPageProps {
  logs: AuditLog[];
  showToast: (msg: string, type?: 'success' | 'error') => void;
  openConfirm: (opts: { title: string; message: string; onConfirm: () => void }) => void;
  onClearLogs?: () => Promise<void>;
}

export const AuditLogsPage: React.FC<AuditLogsPageProps> = ({
  logs = [],
  showToast,
  openConfirm,
  onClearLogs
}) => {
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState<string>('all');

  const filteredLogs = logs.filter(log => {
    const matchesSearch =
      (log.action || '').toLowerCase().includes(search.toLowerCase()) ||
      (log.details || '').toLowerCase().includes(search.toLowerCase()) ||
      (log.user || '').toLowerCase().includes(search.toLowerCase());

    const matchesAction =
      filterAction === 'all' ||
      log.action.toLowerCase().includes(filterAction.toLowerCase());

    return matchesSearch && matchesAction;
  });

  const getActionBadge = (action: string) => {
    const act = action.toLowerCase();
    if (act.includes('login')) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg">
          <Key className="w-3 h-3" />
          <span>{action}</span>
        </span>
      );
    }
    if (act.includes('update') || act.includes('edit') || act.includes('save')) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-lg">
          <FileEdit className="w-3 h-3" />
          <span>{action}</span>
        </span>
      );
    }
    if (act.includes('delete') || act.includes('remove')) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-lg">
          <Trash2 className="w-3 h-3" />
          <span>{action}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-lg">
        <UserCheck className="w-3 h-3" />
        <span>{action}</span>
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-stone-100 flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-400" />
            <span>Admin Activity Audit Trail</span>
          </h1>
          <p className="text-xs text-stone-400">Security history and admin changes timestamped for integrity</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-56">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
            <input
              type="text"
              placeholder="Search audit trail..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-stone-900 border border-stone-800 rounded-2xl text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-stone-600"
            />
          </div>

          <select
            value={filterAction}
            onChange={e => setFilterAction(e.target.value)}
            className="bg-stone-900 border border-stone-800 rounded-2xl px-3 py-2 text-xs text-stone-300 focus:outline-none"
          >
            <option value="all">All Actions</option>
            <option value="login">Logins</option>
            <option value="update">Updates</option>
            <option value="delete">Deletions</option>
          </select>
        </div>
      </div>

      <div className="bg-stone-900 border border-stone-800 rounded-3xl overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-stone-500 space-y-2">
            <Clock className="w-8 h-8 mx-auto text-stone-600" />
            <p className="text-xs font-medium text-stone-400">No audit log entries matching criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-stone-800 bg-stone-950/50 text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
                  <th className="py-3.5 px-6">Timestamp</th>
                  <th className="py-3.5 px-6">User / Actor</th>
                  <th className="py-3.5 px-6">Action</th>
                  <th className="py-3.5 px-6">Details / Payload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/60 text-xs">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-stone-800/30 transition-colors">
                    <td className="py-3.5 px-6 whitespace-nowrap text-stone-400 font-mono text-[11px]">
                      {new Date(log.timestamp).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </td>
                    <td className="py-3.5 px-6 whitespace-nowrap font-medium text-stone-200">
                      {log.user || 'Admin User'}
                    </td>
                    <td className="py-3.5 px-6 whitespace-nowrap">
                      {getActionBadge(log.action)}
                    </td>
                    <td className="py-3.5 px-6 text-stone-300 font-mono text-[11px] max-w-xs truncate" title={log.details}>
                      {log.details || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
