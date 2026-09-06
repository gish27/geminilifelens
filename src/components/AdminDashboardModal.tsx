import React, { useEffect, useState } from 'react';
import { ShieldCheck, Users, Database, Activity, Lock, RefreshCw, X, AlertCircle } from 'lucide-react';
import { type AdminStats } from '../types';

interface AdminDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserEmail?: string | null;
}

export const AdminDashboardModal: React.FC<AdminDashboardModalProps> = ({
  isOpen,
  onClose,
  currentUserEmail,
}) => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAdminStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/overview', {
        headers: {
          'x-user-email': currentUserEmail || '',
        },
      });

      if (!res.ok) {
        if (res.status === 403) {
          throw new Error('Access Denied: You do not possess elevated administrator privileges.');
        }
        throw new Error('Unable to retrieve administrator metrics.');
      }

      const data = await res.json();
      setStats({
        totalInteractions: data.metrics?.totalInteractions || 0,
        totalUsersEstimated: data.metrics?.totalUsersEstimated || 0,
        recentAuditLogs: data.auditLogs || [],
        systemStatus: data.systemStatus || {
          geminiService: 'Operational',
          firestoreService: 'Connected',
          notificationsQueue: 'Active',
        },
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load RBAC analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAdminStats();
    }
  }, [isOpen, currentUserEmail]);

  if (!isOpen) return null;

  return (
    <div
      id="admin-dashboard-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-2xl overflow-hidden text-neutral-200">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-950/60 border border-indigo-800/40 text-indigo-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Administrator Security Portal (RBAC)</h2>
              <p className="text-xs text-neutral-400">
                Authoritative verification for {currentUserEmail || 'authenticated session'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          {error ? (
            <div className="p-4 bg-red-950/30 border border-red-900/50 rounded-xl text-xs text-red-300 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block mb-1">RBAC Security Enforcement</span>
                <span>{error}</span>
              </div>
            </div>
          ) : loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-neutral-400">
              <RefreshCw className="w-6 h-6 animate-spin text-indigo-400" />
              <span className="text-xs">Verifying elevated admin permissions...</span>
            </div>
          ) : stats ? (
            <>
              {/* Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 bg-neutral-950/80 border border-neutral-800/80 rounded-xl">
                  <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
                    <span>Interactions</span>
                    <Database className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <div className="text-xl font-bold text-white font-mono">{stats.totalInteractions}</div>
                  <span className="text-[10px] text-emerald-400">100% Isolated paths</span>
                </div>

                <div className="p-3.5 bg-neutral-950/80 border border-neutral-800/80 rounded-xl">
                  <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
                    <span>Active Users</span>
                    <Users className="w-3.5 h-3.5 text-indigo-400" />
                  </div>
                  <div className="text-xl font-bold text-white font-mono">{stats.totalUsersEstimated}</div>
                  <span className="text-[10px] text-indigo-400">Owner-bound UID</span>
                </div>

                <div className="p-3.5 bg-neutral-950/80 border border-neutral-800/80 rounded-xl">
                  <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
                    <span>Gemini Core</span>
                    <Activity className="w-3.5 h-3.5 text-sky-400" />
                  </div>
                  <div className="text-xs font-semibold text-emerald-400 font-mono mt-1 truncate">
                    {stats.systemStatus.geminiService}
                  </div>
                  <span className="text-[10px] text-neutral-500">Auto-fallback ladder</span>
                </div>
              </div>

              {/* Audit Logs */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    Security & Authorization Audit Log
                  </span>
                  <button
                    onClick={fetchAdminStats}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" /> Refresh
                  </button>
                </div>

                <div className="bg-neutral-950/90 border border-neutral-800 rounded-xl overflow-hidden divide-y divide-neutral-800/60 font-mono text-[11px]">
                  {stats.recentAuditLogs.map((log) => (
                    <div key={log.id} className="p-2.5 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 truncate">
                        <span className="px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300 text-[10px]">
                          {log.action}
                        </span>
                        <span className="text-neutral-400 truncate">{log.resource}</span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-emerald-400 text-[10px]">{log.status}</span>
                        <span className="text-neutral-600 text-[10px]">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : null}
        </div>

        <div className="mt-5 pt-3 border-t border-neutral-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium rounded-lg transition-colors"
          >
            Close Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};
