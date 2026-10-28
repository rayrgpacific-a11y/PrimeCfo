'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import PortalShell from '@/components/portal/PortalShell';
import {
  CheckCircle2,
  RefreshCw,
  Unlink,
  Link2,
  ShieldCheck,
  FileSpreadsheet,
  AlertCircle,
  ExternalLink,
  Loader2
} from 'lucide-react';

export default function ConnectQuickBooks() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isQbConnected, setIsQbConnected] = useState(false);
  const [qboCompanyId, setQboCompanyId] = useState<string | null>(null);
  const [tenantName, setTenantName] = useState<string>('');
  const [clientId, setClientId] = useState<string>('');

  useEffect(() => {
    fetch('/api/me')
      .then((r) => r.json())
      .then((user) => {
        if (user.clientId) setClientId(user.clientId);
        const GENERIC_PROVIDERS = ['gmail', 'yahoo', 'ymail', 'rocketmail', 'hotmail', 'outlook', 'live', 'msn', 'icloud', 'proton', 'protonmail', 'zoho', 'aol', 'mail', 'gmx', 'yandex'];
        const isGeneric = user.tenantName && GENERIC_PROVIDERS.includes(user.tenantName.toLowerCase().trim());
        if (user.tenantName && !isGeneric) {
          setTenantName(user.tenantName);
        } else if (user.email) {
          const prefix = user.email.split('@')[0];
          const nameTokens = prefix
            .split(/[._+-]/)
            .filter(Boolean)
            .filter((s: string) => !/^\d+$/.test(s))
            .map((s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase())
            .filter((s: string) => !['web', 'admin', 'contact', 'info'].includes(s.toLowerCase()));
          const formatted = nameTokens.join(' ');
          setTenantName(formatted ? `${formatted} Holdings` : 'Your Organization');
        }
        if (user.isQbConnected) setIsQbConnected(true);
        if (user.qboCompanyId) setQboCompanyId(user.qboCompanyId);
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  const handleConnect = () => {
    setIsConnecting(true);
    const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const returnTo = params?.get('returnTo') || 'dashboard';
    window.location.href = `/api/quickbooks/auth?clientId=${encodeURIComponent(clientId)}&returnTo=${encodeURIComponent(returnTo)}`;
  };

  const handleSyncNow = async () => {
    if (!clientId) return;
    setIsSyncing(true);
    setSyncSuccess(false);
    try {
      const res = await fetch(`/api/quickbooks/customer?clientId=${clientId}&timeFrame=3m`);
      if (res.ok) {
        setSyncSuccess(true);
        setTimeout(() => setSyncSuccess(false), 3000);
      }
    } catch (e) {
      console.warn('Sync failed:', e);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <PortalShell activeView="connect">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-2">
            Accounting Integrations
          </h1>
          <p className="text-sm text-slate-400">
            Manage your Intuit QuickBooks Online OAuth 2.0 connection and general ledger data sync.
          </p>
        </div>

        {loading ? (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center">
            <Loader2 className="w-8 h-8 text-teal-400 animate-spin mx-auto mb-3" />
            <p className="text-sm text-slate-400">Loading connection credentials...</p>
          </div>
        ) : isQbConnected ? (
          /* ACTIVE CONNECTION CARD */
          <div className="space-y-6">
            <div className="bg-slate-900/80 border border-emerald-500/30 rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-800">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-[#2CA01C]/15 border border-[#2CA01C]/30 flex items-center justify-center flex-shrink-0">
                    <svg viewBox="0 0 24 24" className="w-7 h-7" fill="#2CA01C">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-6H7v-2h4v8zm4 0h-2v-8h4v2h-2v6z" />
                    </svg>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-white">QuickBooks Online</h2>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Connected &amp; Verified
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Organization: <strong className="text-slate-200">{tenantName || 'Your Organization'}</strong>
                      {qboCompanyId && (
                        <span> &middot; Realm ID: <span className="font-mono text-slate-300">{qboCompanyId}</span></span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleSyncNow}
                    disabled={isSyncing}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>{isSyncing ? 'Syncing...' : 'Re-sync Now'}</span>
                  </button>

                  <Link
                    href={`/disconnect?clientId=${encodeURIComponent(clientId)}`}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-rose-300 hover:text-white bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition-colors"
                  >
                    <Unlink className="w-3.5 h-3.5" />
                    <span>Disconnect</span>
                  </Link>
                </div>
              </div>

              {syncSuccess && (
                <div className="mb-6 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in-50">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>General ledger, invoices, and bank balances successfully re-synchronized.</span>
                </div>
              )}

              <div className="grid sm:grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80">
                  <span className="text-slate-500 block mb-1 uppercase text-[10px] tracking-wider font-semibold">Sync Mode</span>
                  <p className="font-bold text-white">OAuth 2.0 Live Token Vault</p>
                  <p className="text-[11px] text-emerald-400 mt-1">AES-256 Encrypted at Rest</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80">
                  <span className="text-slate-500 block mb-1 uppercase text-[10px] tracking-wider font-semibold">Auto-Sync Cadence</span>
                  <p className="font-bold text-white">Daily at 00:00 UTC</p>
                  <p className="text-[11px] text-slate-400 mt-1">On-demand refresh enabled</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80">
                  <span className="text-slate-500 block mb-1 uppercase text-[10px] tracking-wider font-semibold">Synced Entities</span>
                  <p className="font-bold text-white">Invoices &middot; GL &middot; Bank Accounts</p>
                  <p className="text-[11px] text-slate-400 mt-1">Full financial visibility</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* DISCONNECTED / CONNECT PROMPT CARD */
          <div className="bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-800 rounded-2xl p-8 md:p-12 shadow-2xl">
            <div className="flex items-center justify-center gap-6 mb-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500/20 to-emerald-600/10 border border-teal-500/30 flex items-center justify-center">
                <span className="text-2xl font-bold text-teal-400">P</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-8 h-px bg-gradient-to-r from-teal-500/50 to-[#2CA01C]/50" />
                <Link2 className="w-4 h-4 text-slate-500" />
              </div>
              <div className="w-16 h-16 rounded-2xl bg-[#2CA01C]/15 border border-[#2CA01C]/30 flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-8 h-8" fill="#2CA01C">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-6H7v-2h4v8zm4 0h-2v-8h4v2h-2v6z" />
                </svg>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-center text-white mb-3">
              Connect QuickBooks Online
            </h2>
            <p className="text-slate-400 text-center text-sm mb-8 max-w-lg mx-auto leading-relaxed">
              Link your QuickBooks Online account to enable real-time cash position monitoring, automated statements, and verified financial intelligence.
            </p>

            <div className="max-w-md mx-auto space-y-3 mb-8">
              <div className="p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-xl flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs">
                  <strong className="text-white block mb-0.5">Automated Financial Sync</strong>
                  <span className="text-slate-400">Direct integration with your verified General Ledger and bank balances.</span>
                </div>
              </div>
              <div className="p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-xl flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs">
                  <strong className="text-white block mb-0.5">Enterprise Token Vault</strong>
                  <span className="text-slate-400">Tokens encrypted at rest via AES-256-GCM. Your login credentials are never stored.</span>
                </div>
              </div>
              <div className="p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-xl flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs">
                  <strong className="text-white block mb-0.5">Disconnect Anytime</strong>
                  <span className="text-slate-400">Revoke permissions instantly with one click from this page.</span>
                </div>
              </div>
            </div>

            <div className="max-w-md mx-auto">
              <button
                onClick={handleConnect}
                disabled={isConnecting}
                className="w-full py-4 px-6 rounded-xl font-bold text-white bg-[#2CA01C] hover:bg-[#248516] transition-all duration-200 flex items-center justify-center gap-3 disabled:opacity-70 shadow-lg shadow-[#2CA01C]/25 cursor-pointer text-sm"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Connecting to Intuit...</span>
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-6H7v-2h4v8zm4 0h-2v-8h4v2h-2v6z" />
                    </svg>
                    <span>Connect to QuickBooks</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </PortalShell>
  );
}