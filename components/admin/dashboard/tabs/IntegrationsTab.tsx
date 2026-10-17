'use client';

import React from 'react';
import { CheckCircle, ShieldCheck, Link2 } from 'lucide-react';
import { Client } from '@/types/admin';

interface IntegrationsTabProps {
  selectedClient: Client;
  onConnectQuickBooks: (clientId: string) => void;
}

export default function IntegrationsTab({
  selectedClient,
  onConnectQuickBooks
}: IntegrationsTabProps) {
  const isQboConnected = Boolean(selectedClient.client_qbo_connections?.[0]);

  return (
    <div className="space-y-6">
      {/* Integration Status Summary */}
      <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-base font-semibold text-white tracking-tight">Active Integrations</h3>
            <p className="text-xs text-slate-400">Manage real-time data pipelines for this client portfolio</p>
          </div>
          <span className="text-xs font-mono font-medium text-slate-400">3 of 20 connected</span>
        </div>
        <div className="flex gap-2">
          <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-full font-semibold">
            3 Active Pipelines
          </span>
          <span className="px-3 py-1 bg-slate-800 border border-slate-700 text-slate-400 text-xs rounded-full font-medium">
            17 Available Connectors
          </span>
        </div>
      </div>

      {/* Connected Integrations Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* QuickBooks Online */}
        <div className={`bg-slate-900/70 border rounded-2xl p-6 shadow-lg transition-all ${
          isQboConnected ? 'border-emerald-500/40 hover:border-emerald-500/60' : 'border-slate-800 hover:border-slate-700'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">QuickBooks Online</h3>
              <p className="text-xs text-slate-400">General Ledger & Accounts</p>
            </div>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              isQboConnected ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-500'
            }`}>
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>

          <div className="space-y-2 mb-6 text-xs bg-slate-800/40 border border-slate-800 rounded-xl p-3">
            <div className="flex justify-between">
              <span className="text-slate-400">Pipeline Status</span>
              <span className={`font-semibold ${isQboConnected ? 'text-emerald-400' : 'text-slate-500'}`}>
                {isQboConnected ? 'Connected & Live' : 'Offline / Disconnected'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Last Synced</span>
              <span className="text-slate-300 font-mono">{isQboConnected ? '2 mins ago' : 'Never'}</span>
            </div>
          </div>

          {isQboConnected ? (
            <a 
              href={`https://app.qbo.intuit.com/app/customerdetail?nameId=${selectedClient.client_qbo_connections?.[0]?.customer_id || '1'}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl hover:bg-emerald-500/20 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Manage in QuickBooks Online</span>
              <span className="text-[10px]">&rarr;</span>
            </a>
          ) : (
            <button 
              type="button" 
              onClick={() => onConnectQuickBooks(selectedClient.client_id)}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-xl hover:from-teal-400 hover:to-emerald-400 text-xs font-semibold transition-all shadow-lg shadow-teal-500/20 cursor-pointer"
            >
              Connect QuickBooks Online
            </button>
          )}
        </div>

        {/* Stripe */}
        <div className="bg-slate-900/70 border border-emerald-500/40 rounded-2xl p-6 shadow-lg hover:border-emerald-500/60 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Stripe Payments</h3>
              <p className="text-xs text-slate-400">Credit Card & Subscriptions</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>

          <div className="space-y-2 mb-6 text-xs bg-slate-800/40 border border-slate-800 rounded-xl p-3">
            <div className="flex justify-between">
              <span className="text-slate-400">Pipeline Status</span>
              <span className="text-emerald-400 font-semibold">Active & Webhooked</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Last Event</span>
              <span className="text-slate-300 font-mono">5 mins ago</span>
            </div>
          </div>

          <button 
            type="button" 
            className="w-full py-2.5 px-4 bg-slate-800 border border-slate-700 text-slate-300 rounded-xl hover:bg-slate-700 text-xs font-semibold transition-colors cursor-pointer"
          >
            Manage Stripe Keys
          </button>
        </div>

        {/* Plaid */}
        <div className="bg-slate-900/70 border border-emerald-500/40 rounded-2xl p-6 shadow-lg hover:border-emerald-500/60 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Plaid Financial</h3>
              <p className="text-xs text-slate-400">Bank Feeds & Cash Balances</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>

          <div className="space-y-2 mb-6 text-xs bg-slate-800/40 border border-slate-800 rounded-xl p-3">
            <div className="flex justify-between">
              <span className="text-slate-400">Pipeline Status</span>
              <span className="text-emerald-400 font-semibold">Real-Time Sync</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Last Refresh</span>
              <span className="text-slate-300 font-mono">1 min ago</span>
            </div>
          </div>

          <button 
            type="button" 
            className="w-full py-2.5 px-4 bg-slate-800 border border-slate-700 text-slate-300 rounded-xl hover:bg-slate-700 text-xs font-semibold transition-colors cursor-pointer"
          >
            Manage Bank Tokens
          </button>
        </div>
      </div>
    </div>
  );
}
