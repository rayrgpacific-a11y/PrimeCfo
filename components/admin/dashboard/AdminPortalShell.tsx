'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  BarChart3,
  LayoutDashboard,
  Wallet,
  Building,
  FileText,
  Brain,
  Link2,
  Settings,
  Calendar,
  HelpCircle,
  Bell,
  Menu,
  X,
  ChevronDown,
  LogOut,
  User,
  Shield,
  ShieldCheck,
  Loader2,
  ExternalLink,
  Plus,
  ArrowUpRight,
  Check,
  RefreshCw,
  Folder,
  ListTodo,
  CheckCircle,
  ChevronRight
} from 'lucide-react';
import { Client, Alert, TimeFrame, ViewType } from '@/types/admin';

interface AdminPortalShellProps {
  children: React.ReactNode;
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
  clients: Client[];
  selectedClient: Client | null;
  setSelectedClient: (client: Client) => void;
  timeFrame: TimeFrame;
  setTimeFrame: (timeFrame: TimeFrame) => void;
  refreshing: boolean;
  onRefresh: () => void;
  alerts: Alert[];
}

export default function AdminPortalShell({
  children,
  activeView,
  setActiveView,
  clients,
  selectedClient,
  setSelectedClient,
  timeFrame,
  setTimeFrame,
  refreshing,
  onRefresh,
  alerts
}: AdminPortalShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [clientDropdownOpen, setClientDropdownOpen] = useState(false);
  const router = useRouter();

  const criticalAlertsCount = alerts.filter(a => a.severity === 'critical').length;

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/signout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (e) {
      console.error(e);
    }
  };

  const navItems: { label: string; view: ViewType; icon: any }[] = [
    { label: 'Overview', view: 'overview', icon: LayoutDashboard },
    { label: 'Treasury & Cash', view: 'treasury', icon: Wallet },
    { label: 'Asset Register', view: 'assets', icon: Building },
    { label: 'AP & AR Invoices', view: 'transactions', icon: FileText },
    { label: 'Analytics & KPIs', view: 'analytics', icon: BarChart3 },
    { label: 'Documents Vault', view: 'documents', icon: Folder },
    { label: 'System Alerts', view: 'alerts', icon: Bell },
    { label: 'Integrations & QBO', view: 'integrations', icon: Link2 },
    { label: 'CFO Workpapers', view: 'notes', icon: ListTodo },
  ];

  const isQboConnected = !!selectedClient?.client_qbo_connections?.[0];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-teal-500/30 selection:text-teal-200">
      {/* Top Navbar matching Client Portal */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50 h-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Mobile Sidebar Hamburger */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors focus:outline-none cursor-pointer"
              aria-label="Toggle Navigation Sidebar"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Logo with Admin Pill */}
            <Link href="/admin/dashboard" className="flex items-center gap-3 group select-none">
              <div className="w-9 h-9 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-lg flex items-center justify-center shadow-lg shadow-teal-500/20 group-hover:scale-105 transition-transform duration-200">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-white tracking-tight">
                  Prime<span className="text-teal-400">CFO</span>
                  <span className="text-slate-400 text-sm">.ai</span>
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-teal-500/10 border border-teal-500/30 text-teal-300 rounded-md">
                  Admin
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1 ml-6">
              <button
                type="button"
                onClick={() => setActiveView('overview')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  activeView === 'overview'
                    ? 'text-teal-400 bg-slate-800'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                Dashboard
              </button>
              <button
                type="button"
                onClick={() => setActiveView('analytics')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  activeView === 'analytics'
                    ? 'text-teal-400 bg-slate-800'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                Reports
              </button>
              <button
                type="button"
                onClick={() => setActiveView('treasury')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  activeView === 'treasury'
                    ? 'text-teal-400 bg-slate-800'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                Treasury
              </button>
              <Link
                href="/dashboard"
                className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors flex items-center gap-1"
              >
                <span>Client Portal</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>
            </nav>
          </div>

          {/* Right Header CTAs */}
          <div className="flex items-center gap-3">
            {/* Quick Add Client Button */}
            <Link
              href="/admin/clients/add"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-teal-500 to-emerald-500 text-white text-xs font-semibold hover:from-teal-400 hover:to-emerald-400 transition-all shadow-md shadow-teal-500/20"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Client</span>
            </Link>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors focus:outline-none cursor-pointer"
                aria-label="View notifications"
              >
                <Bell className="w-5 h-5" />
                {criticalAlertsCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-slate-900 animate-pulse" />
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl py-3 z-50 animate-in fade-in-50 zoom-in-95">
                  <div className="px-4 pb-2 border-b border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">System Alerts</span>
                    <span className="text-[10px] bg-teal-500/20 text-teal-400 px-2 py-0.5 rounded-full font-medium">
                      {alerts.length} Active
                    </span>
                  </div>
                  <div className="divide-y divide-slate-800/60 max-h-64 overflow-y-auto">
                    {alerts.map((item) => (
                      <div key={item.id} className="p-3 hover:bg-slate-800/60 transition-colors">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs font-semibold text-white">{item.title}</p>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                            item.severity === 'critical' ? 'bg-rose-500/20 text-rose-300' : 'bg-slate-800 text-slate-400'
                          }`}>
                            {item.category}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">{item.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Operator Menu */}
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-800 transition-colors focus:outline-none cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-500 text-slate-950 font-bold text-xs flex items-center justify-center shadow-md">
                  CFO
                </div>
                <span className="hidden md:inline text-xs font-medium text-slate-300">
                  Prime Operator
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${userDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl py-2 z-50 animate-in fade-in-50 zoom-in-95">
                  <div className="px-4 py-2.5 border-b border-slate-800/80">
                    <p className="text-xs text-slate-400">Admin Account</p>
                    <p className="text-sm font-semibold text-white truncate">CFO Operations Portal</p>
                    <p className="text-[11px] text-teal-400 mt-0.5">Prime Accounting Solutions, LLC</p>
                  </div>

                  <Link
                    href="/dashboard"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5 text-teal-400" />
                    <span>Switch to Client Portal</span>
                  </Link>

                  <Link
                    href="/admin/clients/add"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5 text-teal-400" />
                    <span>Provision New Client</span>
                  </Link>

                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors text-left cursor-pointer border-t border-slate-800/80 mt-1"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Container with Sidebar matching PortalShell */}
      <div className="flex-1 flex">
        {/* Backdrop for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar Navigation */}
        <aside
          className={`fixed top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-slate-900 border-r border-slate-800 z-40 transition-transform duration-300 flex flex-col justify-between ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
        >
          <div className="overflow-y-auto">
            {/* Client Selector Card */}
            <div className="p-4 border-b border-slate-800">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setClientDropdownOpen(!clientDropdownOpen)}
                  className="w-full p-3 bg-slate-800/60 border border-slate-700/60 hover:border-teal-500/40 rounded-xl text-left transition-colors cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-bold text-white truncate group-hover:text-teal-300 transition-colors">
                      {selectedClient ? selectedClient.client_name : 'Select Client'}
                    </p>
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isQboConnected ? 'bg-emerald-400' : 'bg-slate-500'
                      }`}
                      title={isQboConnected ? 'QuickBooks Connected' : 'QuickBooks Offline'}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="truncate">{selectedClient?.company_name || 'Individual Entity'}</span>
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${clientDropdownOpen ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                {/* Client Dropdown Switcher */}
                {clientDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setClientDropdownOpen(false)}
                    />
                    <div className="absolute top-full left-0 mt-2 w-72 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in-50 zoom-in-95">
                      <div className="p-2.5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                          Client Entities ({clients.length})
                        </span>
                        <Link
                          href="/admin/clients/add"
                          onClick={() => setClientDropdownOpen(false)}
                          className="text-[11px] text-teal-400 hover:text-teal-300 font-semibold flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add New</span>
                        </Link>
                      </div>

                      <div className="max-h-60 overflow-y-auto divide-y divide-slate-800/60">
                        {clients.map((client) => (
                          <button
                            key={client.client_id}
                            type="button"
                            onClick={() => {
                              setSelectedClient(client);
                              setClientDropdownOpen(false);
                            }}
                            className={`w-full p-2.5 text-left hover:bg-slate-800/80 transition-colors flex items-center justify-between cursor-pointer ${
                              selectedClient?.client_id === client.client_id ? 'bg-slate-800/90 text-teal-300' : 'text-slate-200'
                            }`}
                          >
                            <div className="min-w-0 pr-2">
                              <p className="font-semibold text-xs text-white truncate">{client.client_name}</p>
                              {client.company_name && (
                                <p className="text-[10px] text-slate-400 truncate">{client.company_name}</p>
                              )}
                            </div>
                            {client.client_qbo_connections?.[0] ? (
                              <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                QBO
                              </span>
                            ) : null}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Sidebar Navigation Links matching PortalShell */}
            <nav className="p-3 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeView === item.view;

                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => {
                      setActiveView(item.view);
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all text-left cursor-pointer ${
                      isActive
                        ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20 shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-teal-400' : 'text-slate-400'}`} />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Sidebar Bottom Actions */}
          <div className="p-4 border-t border-slate-800 space-y-2">
            <Link
              href="/dashboard"
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-300 bg-slate-800/60 border border-slate-700/60 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <div className="flex items-center gap-2">
                <LayoutDashboard className="w-3.5 h-3.5 text-teal-400" />
                <span>Client Portal View</span>
              </div>
              <ArrowUpRight className="w-3 h-3 text-slate-400" />
            </Link>

            <Link
              href="/admin/clients/add"
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-teal-300 bg-teal-500/10 border border-teal-500/30 hover:bg-teal-500/20 transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-teal-400" />
              <span>Provision Client Account</span>
            </Link>
          </div>
        </aside>

        {/* Content Outlet */}
        <main className="flex-1 lg:pl-64 min-w-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
