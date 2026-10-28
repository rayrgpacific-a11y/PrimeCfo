'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  BarChart3,
  LayoutDashboard,
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
  Loader2,
  ExternalLink,
  Mail,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface PortalShellProps {
  children: React.ReactNode;
  activeView: 'dashboard' | 'reports' | 'insights' | 'connect' | 'settings';
}

export default function PortalShell({ children, activeView }: PortalShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [advisorModalOpen, setAdvisorModalOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string>('');
  const [tenantName, setTenantName] = useState<string>('');
  const [isOperator, setIsOperator] = useState<boolean>(false);
  const [qbConnected, setQbConnected] = useState<boolean>(false);
  const [alerts, setAlerts] = useState<any[]>([]);

  // Advisor Booking Form State
  const [bookingDate, setBookingDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [bookingTime, setBookingTime] = useState<string>('10:00');
  const [bookingTopic, setBookingTopic] = useState<string>('Monthly CFO Performance Review');
  const [bookingSubmitting, setBookingSubmitting] = useState<boolean>(false);
  const [bookingSuccess, setBookingSuccess] = useState<boolean>(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);

  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    fetch('/api/me')
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          if (data.email) {
            setUserEmail(data.email);
            setIsOperator(!!data.isOperator);
          }
          if (data.tenantName) {
            setTenantName(data.tenantName);
          }
          if (typeof data.isQbConnected === 'boolean') {
            setQbConnected(data.isQbConnected);
          }
        }
      })
      .catch(() => {});

    fetch('/api/alerts')
      .then(r => r.json())
      .then(res => {
        if (res.success && Array.isArray(res.data)) {
          setAlerts(res.data);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (advisorModalOpen) {
      setBookingSuccess(false);
      setBookingError(null);
      fetch('/api/advisor/book')
        .then((r) => r.json())
        .then((res) => {
          if (res.success && Array.isArray(res.data)) {
            setRecentBookings(res.data);
          }
        })
        .catch(() => {});
    }
  }, [advisorModalOpen]);

  const handleBookSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingSubmitting(true);
    setBookingError(null);
    try {
      const scheduledDateTime = new Date(`${bookingDate}T${bookingTime}:00`);
      const res = await fetch('/api/advisor/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduledAt: scheduledDateTime.toISOString(),
          eventType: bookingTopic,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to schedule session');
      }
      setBookingSuccess(true);
      if (data.booking) {
        setRecentBookings((prev) => [data.booking, ...prev]);
      }
    } catch (err: any) {
      setBookingError(err.message || 'An error occurred');
    } finally {
      setBookingSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/signout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (e) {
      console.error(e);
    }
  };

  const GENERIC_PROVIDERS = ['gmail', 'yahoo', 'ymail', 'rocketmail', 'hotmail', 'outlook', 'live', 'msn', 'icloud', 'proton', 'protonmail', 'zoho', 'aol', 'mail', 'gmx', 'yandex'];

  const getClientDisplayName = (email: string) => {
    const isGeneric = tenantName && GENERIC_PROVIDERS.includes(tenantName.toLowerCase().trim());
    if (tenantName && !isGeneric) return tenantName;
    if (!email) return 'My Organization';
    const prefix = email.split('@')[0];
    const nameTokens = prefix
      .split(/[._+-]/)
      .filter(Boolean)
      .filter((s) => !/^\d+$/.test(s))
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase())
      .filter((s) => !['web', 'admin', 'contact', 'info'].includes(s.toLowerCase()));
    const formatted = nameTokens.join(' ');
    return formatted ? `${formatted} Holdings` : 'My Organization';
  };

  const getInitials = (email: string) => {
    const effectiveName = getClientDisplayName(email);
    const parts = effectiveName.trim().split(/[\s._+-]+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return effectiveName.slice(0, 2).toUpperCase();
  };

  const displayName = getClientDisplayName(userEmail);

  const sidebarNavItems = [
    { label: 'Dashboard', href: '/dashboard', view: 'dashboard', icon: LayoutDashboard },
    { label: 'Reports', href: '/reports', view: 'reports', icon: FileText },
    { label: 'AI Insights', href: '/insights', view: 'insights', icon: Brain },
    { label: 'Connections', href: '/connect', view: 'connect', icon: Link2 },
    { label: 'Settings', href: '/settings', view: 'settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-teal-500/30 selection:text-teal-200">
      {/* Top Navbar */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50 h-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Mobile Sidebar Hamburger */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors focus:outline-none"
              aria-label="Toggle Navigation Sidebar"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group select-none">
              <div className="w-9 h-9 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-lg flex items-center justify-center shadow-lg shadow-teal-500/20 group-hover:scale-105 transition-transform duration-200">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">
                Prime<span className="text-teal-400">CFO</span>
                <span className="text-slate-400 text-sm">.ai</span>
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1 ml-6">
              <Link
                href="/dashboard"
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  activeView === 'dashboard'
                    ? 'text-teal-400 bg-slate-800'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                Dashboard
              </Link>
              <Link
                href="/reports"
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  activeView === 'reports'
                    ? 'text-teal-400 bg-slate-800'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                Reports
              </Link>
              <Link
                href="/insights"
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  activeView === 'insights'
                    ? 'text-teal-400 bg-slate-800'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                Insights
              </Link>
              <Link
                href="/about"
                className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
              >
                About Us
              </Link>
              <Link
                href="/contact"
                className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
              >
                Contact
              </Link>
            </nav>
          </div>

          {/* Right Header CTAs */}
          <div className="flex items-center gap-3">
            {/* Talk to Your Advisor Pill CTA */}
            <button
              onClick={() => setAdvisorModalOpen(true)}
              className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-teal-500/30 bg-teal-500/10 text-teal-300 text-sm font-medium hover:bg-teal-500/20 hover:border-teal-500/50 transition-colors cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5 text-teal-400" />
              <span>Talk to Your Advisor</span>
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors focus:outline-none cursor-pointer"
                aria-label="View notifications"
              >
                <Bell className="w-5 h-5" />
                {alerts.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-teal-400 ring-2 ring-slate-900 animate-pulse" />
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl py-3 z-50 animate-in fade-in-50 zoom-in-95">
                  <div className="px-4 pb-2 border-b border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Notifications</span>
                    <span className="text-[10px] bg-teal-500/20 text-teal-400 px-2 py-0.5 rounded-full font-medium">
                      {alerts.length > 0 ? `${alerts.length} Active` : 'All Clear'}
                    </span>
                  </div>
                  <div className="divide-y divide-slate-800/60 max-h-64 overflow-y-auto">
                    {alerts.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-400">
                        No active alerts. Your accounts and financial metrics are operating normally.
                      </div>
                    ) : (
                      alerts.map((item) => (
                        <div key={item.id} className="p-3 hover:bg-slate-800/60 transition-colors">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-xs font-semibold text-white">{item.title}</p>
                            <span className="text-[10px] text-slate-500">
                              {new Date(item.timestamp || item.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400">{item.description}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Menu */}
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-800 transition-colors focus:outline-none cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-500 text-slate-950 font-bold text-xs flex items-center justify-center shadow-md">
                  {getInitials(userEmail)}
                </div>
                <span className="hidden md:inline text-xs font-medium text-slate-300">
                  {displayName}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${userDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl py-2 z-50 animate-in fade-in-50 zoom-in-95">
                  <div className="px-4 py-2.5 border-b border-slate-800/80">
                    <p className="text-xs text-slate-400">Client Account</p>
                    <p className="text-sm font-semibold text-white truncate">{userEmail}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Prime Accounting Solutions Client</p>
                  </div>

                  <Link
                    href="/dashboard"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5 text-teal-400" />
                    Dashboard
                  </Link>

                  <Link
                    href="/settings"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    <Settings className="w-3.5 h-3.5 text-teal-400" />
                    Settings
                  </Link>

                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors text-left cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Container with Sidebar */}
      <div className="flex-1 flex">
        {/* Backdrop for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar Aside */}
        <aside
          className={`fixed top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-slate-900 border-r border-slate-800 z-40 transition-transform duration-300 flex flex-col justify-between ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
        >
          <div>
            {/* Client Identity Card */}
            <div className="p-4 border-b border-slate-800">
              <Link
                href="/connect"
                className="block p-3 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-teal-500/30 rounded-xl transition-colors group cursor-pointer"
              >
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-bold text-white truncate">{displayName}</p>
                  <span
                    className={`w-2 h-2 rounded-full ${
                      qbConnected ? 'bg-emerald-400' : 'bg-slate-500'
                    }`}
                  />
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 group-hover:text-teal-300 transition-colors">
                  <span>{qbConnected ? 'QuickBooks Connected' : 'Connect QuickBooks'}</span>
                </div>
              </Link>
            </div>

            {/* Sidebar Navigation Links */}
            <nav className="p-3 space-y-1">
              {sidebarNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeView === item.view;

                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20 shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-teal-400' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Sidebar Bottom Footer Actions */}
          <div className="p-4 border-t border-slate-800 space-y-2">
            <button
              onClick={() => setAdvisorModalOpen(true)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-teal-300 bg-teal-500/10 border border-teal-500/30 hover:bg-teal-500/20 transition-colors cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5 text-teal-400" />
              <span>Talk to Your Advisor</span>
            </button>

            <Link
              href="/contact"
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Help &amp; Support</span>
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

      {/* Advisor Consultation Modal */}
      {advisorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in-50 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative my-8">
            <button
              onClick={() => setAdvisorModalOpen(false)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mb-4">
              <Calendar className="w-6 h-6 text-teal-400" />
            </div>

            <h3 className="text-xl font-bold text-white mb-2">Schedule Advisory Session</h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Connect directly with Andrew and your dedicated CPA team at Prime Accounting Solutions to review your metrics, cash flow forecasts, and advisory strategy.
            </p>

            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 mb-5 space-y-1.5 text-xs text-slate-300">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Advisory Lead:</span>
                <span className="font-semibold text-white">Andrew (Prime Accounting Solutions)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Contact Email:</span>
                <span className="text-teal-400">andrew@primeaccsolutions.com</span>
              </div>
            </div>

            {bookingSuccess ? (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl mb-6 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <h4 className="text-sm font-bold text-white">Advisory Session Confirmed!</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Your session request has been recorded into the Prime advisory calendar. Andrew's office will prepare your financial workpapers and send a calendar invite.
                </p>
                <button
                  type="button"
                  onClick={() => setBookingSuccess(false)}
                  className="mt-2 text-xs font-semibold text-teal-400 hover:text-teal-300 cursor-pointer"
                >
                  Schedule Another Session
                </button>
              </div>
            ) : (
              <form onSubmit={handleBookSession} className="space-y-4 mb-6">
                {bookingError && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs text-rose-300 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                    <span>{bookingError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Session Date
                    </label>
                    <input
                      type="date"
                      value={bookingDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setBookingDate(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-teal-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Preferred Time
                    </label>
                    <select
                      value={bookingTime}
                      onChange={(e) => setBookingTime(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-teal-500 transition-colors cursor-pointer"
                    >
                      <option value="09:00">09:00 AM (EST)</option>
                      <option value="10:00">10:00 AM (EST)</option>
                      <option value="11:00">11:00 AM (EST)</option>
                      <option value="13:00">01:00 PM (EST)</option>
                      <option value="14:00">02:00 PM (EST)</option>
                      <option value="15:00">03:00 PM (EST)</option>
                      <option value="16:00">04:00 PM (EST)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Advisory Focus
                  </label>
                  <select
                    value={bookingTopic}
                    onChange={(e) => setBookingTopic(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-teal-500 transition-colors cursor-pointer"
                  >
                    <option value="Monthly CFO Performance Review">Monthly CFO Performance Review</option>
                    <option value="Cash Flow & Runway Optimization">Cash Flow &amp; Runway Optimization</option>
                    <option value="Tax Planning & Owner Compensation">Tax Planning &amp; Owner Compensation</option>
                    <option value="QuickBooks Reconciliation & GL Deep-Dive">QuickBooks Reconciliation &amp; GL Deep-Dive</option>
                    <option value="Capital Allocation & Growth Strategy">Capital Allocation &amp; Growth Strategy</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={bookingSubmitting}
                  className="w-full py-2.5 px-4 rounded-xl text-center text-xs sm:text-sm font-semibold text-slate-950 bg-teal-400 hover:bg-teal-300 transition-all shadow-lg shadow-teal-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {bookingSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                      <span>Confirming Schedule...</span>
                    </>
                  ) : (
                    <>
                      <Calendar className="w-4 h-4" />
                      <span>Confirm Advisory Session</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Previously Booked Sessions Register */}
            {recentBookings.length > 0 && (
              <div className="mb-5 pt-4 border-t border-slate-800">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                  Scheduled Sessions ({recentBookings.length})
                </span>
                <div className="space-y-2 max-h-36 overflow-y-auto">
                  {recentBookings.slice(0, 3).map((b) => (
                    <div key={b.id} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-semibold text-white">{b.eventType || 'CFO Advisory Review'}</p>
                        <p className="text-[11px] text-slate-400">
                          {b.scheduledAt ? new Date(b.scheduledAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : 'Pending Confirmation'}
                        </p>
                      </div>
                      <span className="text-[10px] font-bold text-teal-300 bg-teal-500/10 border border-teal-500/20 px-2 py-0.5 rounded">
                        Confirmed
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href="mailto:andrew@primeaccsolutions.com?subject=PrimeCFO%20Client%20Advisory%20Session&body=Hi%20Andrew%2C%20I%20would%20like%20to%20schedule%20our%20fractional%20CFO%20advisory%20review."
                className="flex-1 py-2.5 px-4 rounded-xl text-center text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-750 border border-slate-700/80 transition-all flex items-center justify-center gap-2"
              >
                <Mail className="w-3.5 h-3.5 text-teal-400" />
                <span>Email Advisor Directly</span>
              </a>
              <button
                type="button"
                onClick={() => setAdvisorModalOpen(false)}
                className="py-2.5 px-4 rounded-xl text-xs font-medium text-slate-400 hover:text-white bg-slate-850 hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
