'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Building, 
  ChevronDown, 
  CheckCircle, 
  RefreshCw, 
  Bell, 
  ExternalLink,
  Plus,
  BarChart3,
  ShieldCheck,
  ArrowUpRight,
  Layers
} from 'lucide-react';
import { Client, Alert, TimeFrame, ViewType } from '@/types/admin';
import { timeFrameOptions, viewOptions } from '@/lib/admin-utils';

interface AdminHeaderProps {
  clients: Client[];
  selectedClient: Client | null;
  setSelectedClient: (client: Client) => void;
  showDropdown: boolean;
  setShowDropdown: (show: boolean) => void;
  timeFrame: TimeFrame;
  setTimeFrame: (timeFrame: TimeFrame) => void;
  refreshing: boolean;
  onRefresh: () => void;
  alerts: Alert[];
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
}

export default function AdminHeader({
  clients,
  selectedClient,
  setSelectedClient,
  showDropdown,
  setShowDropdown,
  timeFrame,
  setTimeFrame,
  refreshing,
  onRefresh,
  alerts,
  activeView,
  setActiveView
}: AdminHeaderProps) {
  const criticalAlertsCount = alerts.filter(a => a.severity === 'critical').length;

  return (
    <div className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30 shadow-xl">
      {/* Prime Accounting Trust Bar & Operator Mode Indicator */}
      <div className="border-b border-slate-800/80 bg-slate-950/60 px-4 sm:px-6 lg:px-8 py-2">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-400">
          <p className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-teal-400 flex-shrink-0" />
            <span>
              <strong className="text-slate-300">PrimeCFO Operator Portal</strong> &mdash; Multi-client accounting intelligence & QuickBooks synchronizer
            </span>
          </p>
          <div className="flex items-center gap-3">
            <span className="px-2 py-0.5 bg-teal-500/10 border border-teal-500/20 text-teal-300 rounded text-[11px] font-semibold">
              CFO Operator Mode
            </span>
            <Link 
              href="/dashboard"
              className="text-slate-400 hover:text-teal-300 transition-colors flex items-center gap-1 text-[11px] font-medium"
            >
              <span>View Client Portal</span>
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Main Top Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-wrap">
            {/* Logo with Operator Tag */}
            <Link href="/admin/dashboard" className="flex items-center gap-2.5 group select-none">
              <div className="w-9 h-9 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-lg flex items-center justify-center shadow-lg shadow-teal-500/20 group-hover:scale-105 transition-transform duration-200">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-lg font-bold text-white tracking-tight">
                  Prime<span className="text-teal-400">CFO</span>
                  <span className="text-slate-400 text-xs">.ai</span>
                </span>
                <span className="ml-2 text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 bg-teal-500/10 border border-teal-500/30 text-teal-300 rounded">
                  Admin
                </span>
              </div>
            </Link>

            <div className="h-6 w-px bg-slate-800 hidden md:block" />

            {/* Client Dropdown Switcher */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2.5 px-3.5 py-2 bg-slate-800/90 border border-slate-700/80 rounded-xl hover:border-teal-500/50 hover:bg-slate-800 min-w-[260px] text-white cursor-pointer shadow-md transition-all text-left"
              >
                <div className="w-7 h-7 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center flex-shrink-0">
                  <Building className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-xs text-white truncate">
                    {selectedClient ? selectedClient.client_name : 'Select Client Account'}
                  </div>
                  {selectedClient?.company_name && (
                    <div className="text-[11px] text-slate-400 truncate">{selectedClient.company_name}</div>
                  )}
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 flex-shrink-0 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
              </button>
              
              {showDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowDropdown(false)}
                  />
                  <div className="absolute top-full left-0 mt-2 w-80 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in-50 zoom-in-95">
                    <div className="p-3 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                        Client Accounts ({clients.length})
                      </span>
                      <span className="text-[11px] text-teal-400 font-medium">Multi-Tenant</span>
                    </div>
                    
                    <div className="overflow-y-auto max-h-64 divide-y divide-slate-800/60">
                      {clients.map(client => (
                        <button
                          key={client.client_id}
                          type="button"
                          onClick={() => {
                            setSelectedClient(client);
                            setShowDropdown(false);
                          }}
                          className={`w-full px-4 py-3 text-left hover:bg-slate-800/80 flex items-center justify-between transition-colors ${
                            selectedClient?.client_id === client.client_id ? 'bg-slate-800 text-teal-300' : 'text-slate-200'
                          }`}
                        >
                          <div className="min-w-0 pr-2">
                            <div className="font-semibold text-xs text-white truncate">{client.client_name}</div>
                            {client.company_name && (
                              <div className="text-[11px] text-slate-400 truncate">{client.company_name}</div>
                            )}
                          </div>
                          {client.client_qbo_connections && client.client_qbo_connections.length > 0 ? (
                            <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full flex-shrink-0">
                              <CheckCircle className="w-2.5 h-2.5 text-emerald-400" />
                              QBO Sync
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full flex-shrink-0">
                              Offline
                            </span>
                          )}
                        </button>
                      ))}
                    </div>

                    <div className="p-2 border-t border-slate-800 bg-slate-950/60">
                      <Link
                        href="/admin/clients/add"
                        onClick={() => setShowDropdown(false)}
                        className="flex items-center justify-center gap-1.5 w-full py-2 px-3 text-xs font-semibold text-teal-300 hover:text-white bg-slate-800/80 border border-slate-700/80 rounded-xl hover:bg-slate-700 transition-colors shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add New Client Account
                      </Link>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Quick Add Client Button */}
            <Link
              href="/admin/clients/add"
              className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 text-white text-xs font-semibold rounded-xl hover:from-teal-400 hover:to-emerald-400 transition-all shadow-lg shadow-teal-500/20"
              title="Add New Client"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Client</span>
            </Link>

            {/* Time Frame Selector */}
            <select
              value={timeFrame}
              onChange={(e) => setTimeFrame(e.target.value as TimeFrame)}
              className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 text-white text-xs cursor-pointer font-medium"
            >
              {timeFrameOptions.map(option => (
                <option key={option.value} value={option.value} className="bg-slate-900 text-white">
                  {option.label}
                </option>
              ))}
            </select>

            {/* Refresh / Sync Button */}
            <button
              type="button"
              onClick={onRefresh}
              disabled={refreshing || !selectedClient}
              className="p-2 text-slate-400 hover:text-white bg-slate-800 border border-slate-700 rounded-xl hover:bg-slate-700 disabled:opacity-50 transition-colors cursor-pointer"
              title="Refresh Client Data"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-teal-400' : ''}`} />
            </button>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Alert Badge */}
            <button 
              type="button"
              onClick={() => setActiveView('alerts')}
              className="p-2 text-slate-400 hover:text-white bg-slate-800 border border-slate-700 rounded-xl hover:bg-slate-700 relative cursor-pointer transition-colors"
              title="View Alerts"
            >
              <Bell className="w-4 h-4" />
              {criticalAlertsCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-slate-900"></span>
              )}
            </button>

            {/* QuickBooks Link */}
            {selectedClient?.client_qbo_connections?.[0] ? (
              <a
                href={`https://app.qbo.intuit.com/app/customerdetail?nameId=${selectedClient.client_qbo_connections[0].customer_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl hover:bg-emerald-500/20 font-semibold text-xs transition-colors"
              >
                <span>QuickBooks</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            ) : null}
          </div>
        </div>
      </div>

      {/* View Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-800/80">
        <div className="flex gap-1 overflow-x-auto scrollbar-none py-1">
          {viewOptions.map(view => {
            const Icon = view.icon;
            const isActive = activeView === view.value;
            return (
              <button
                key={view.value}
                type="button"
                onClick={() => setActiveView(view.value as ViewType)}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl whitespace-nowrap text-xs font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'text-teal-400 bg-slate-800 font-semibold shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-teal-400' : 'text-slate-400'}`} />
                {view.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
