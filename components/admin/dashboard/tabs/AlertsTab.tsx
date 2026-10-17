'use client';

import React from 'react';
import { AlertTriangle, AlertCircle, Info, CheckCheck } from 'lucide-react';
import { Alert } from '@/types/admin';

interface AlertsTabProps {
  alerts: Alert[];
}

export default function AlertsTab({ alerts }: AlertsTabProps) {
  const criticalCount = alerts.filter(a => a.severity === 'critical').length;
  const warningCount = alerts.filter(a => a.severity === 'warning').length;
  const infoCount = alerts.filter(a => a.severity === 'info').length;

  return (
    <div className="space-y-6">
      {/* Alert Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-rose-300">Critical Alerts</p>
              <p className="text-3xl font-bold text-white tabular-nums mt-1">
                {criticalCount}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[11px] text-rose-300/80 mt-2">Requires immediate CFO intervention</p>
        </div>

        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-300">Warnings</p>
              <p className="text-3xl font-bold text-white tabular-nums mt-1">
                {warningCount}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[11px] text-amber-300/80 mt-2">Cash threshold and invoice alerts</p>
        </div>

        <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-cyan-300">System Logs & Info</p>
              <p className="text-3xl font-bold text-white tabular-nums mt-1">
                {infoCount}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Info className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[11px] text-cyan-300/80 mt-2">Bank feed updates & sync events</p>
        </div>
      </div>

      {/* Alert Feed List */}
      <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl overflow-hidden shadow-lg">
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/40">
          <div>
            <h3 className="text-base font-semibold text-white tracking-tight">Active Financial Alerts</h3>
            <p className="text-xs text-slate-400">Real-time alerts generated across general ledger & treasury accounts</p>
          </div>
          <button type="button" className="text-xs font-semibold text-teal-400 hover:text-teal-300 flex items-center gap-1 cursor-pointer">
            <CheckCheck className="w-3.5 h-3.5" />
            Mark All Read
          </button>
        </div>

        <div className="divide-y divide-slate-800/60">
          {alerts.map(alert => {
            const isCritical = alert.severity === 'critical';
            const isWarning = alert.severity === 'warning';

            return (
              <div 
                key={alert.id} 
                className={`p-5 transition-colors ${
                  isCritical ? 'bg-rose-500/[0.04] hover:bg-rose-500/[0.08]' :
                  isWarning ? 'bg-amber-500/[0.03] hover:bg-amber-500/[0.07]' :
                  'hover:bg-slate-800/40'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-start gap-3.5">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      isCritical ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                      isWarning ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                      'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                    }`}>
                      {isCritical ? <AlertTriangle className="w-4 h-4" /> :
                       isWarning ? <AlertCircle className="w-4 h-4" /> :
                       <Info className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h4 className="font-semibold text-sm text-white">{alert.title}</h4>
                        <span className="px-2 py-0.5 text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700 rounded-md">
                          {alert.category}
                        </span>
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase tracking-wider ${
                          isCritical ? 'bg-rose-500/20 text-rose-300' :
                          isWarning ? 'bg-amber-500/20 text-amber-300' :
                          'bg-cyan-500/20 text-cyan-300'
                        }`}>
                          {alert.severity}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mb-1.5 leading-relaxed">{alert.description}</p>
                      <p className="text-[11px] text-slate-500 font-mono">
                        {new Date(alert.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {alert.actionRequired && (
                    <button 
                      type="button" 
                      className="self-start px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-teal-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                    >
                      Resolve Alert
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {alerts.length === 0 && (
            <div className="p-8 text-center text-xs text-slate-500">
              No active alerts for this client account.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
