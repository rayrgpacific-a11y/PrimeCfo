'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import PortalShell from '@/components/portal/PortalShell';
import {
  CreditCard,
  Lock,
  Bell,
  Scale,
  Shield,
  Check,
  ChevronRight,
  ExternalLink,
  Save,
  CheckCircle2,
  Link2,
  Building2,
  Loader2,
  AlertCircle
} from 'lucide-react';

export default function SettingsPage() {
  const [reportingBasis, setReportingBasis] = useState<'cash' | 'accrual'>('cash');
  const [weeklyEmail, setWeeklyEmail] = useState(true);
  const [anomalyAlerts, setAnomalyAlerts] = useState(true);
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [plan, setPlan] = useState('UNDERSTAND');
  const [isQbConnected, setIsQbConnected] = useState(false);
  const [qboCompanyId, setQboCompanyId] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data) {
          const d = res.data;
          if (d.reportingBasis) setReportingBasis(d.reportingBasis);
          if (typeof d.weeklyEmail === 'boolean') setWeeklyEmail(d.weeklyEmail);
          if (typeof d.anomalyAlerts === 'boolean') setAnomalyAlerts(d.anomalyAlerts);
          if (d.companyName) setCompanyName(d.companyName);
          if (d.phone) setPhone(d.phone);
          if (d.plan) setPlan(d.plan);
          if (typeof d.isQbConnected === 'boolean') setIsQbConnected(d.isQbConnected);
          if (d.qboCompanyId) setQboCompanyId(d.qboCompanyId);
          if (d.lastSync) setLastSync(d.lastSync);
        }
      })
      .catch((e) => console.warn('Failed to load settings:', e))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setErrorMsg('');
    setSavedSuccess(false);

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName,
          phone,
          reportingBasis,
          weeklyEmail,
          anomalyAlerts,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      } else {
        setErrorMsg(data.error || 'Failed to save settings');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Network error saving settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <PortalShell activeView="settings">
      <div className="max-w-4xl">
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-2">
          Settings
        </h1>
        <p className="text-sm text-slate-400 mb-8">
          Manage your organization details, accounting preferences, integration status, and notifications.
        </p>

        {savedSuccess && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center gap-2 text-sm animate-in fade-in-50">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Settings saved successfully to database.</span>
          </div>
        )}

        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center gap-2 text-sm animate-in fade-in-50">
            <AlertCircle className="w-4 h-4 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* 1. ORGANIZATION PROFILE */}
        <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 mb-6 shadow-xl">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Company Profile</h2>
              <p className="text-xs text-slate-400">Update company legal title and direct contact information.</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Organization / Company Name
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Acme Holdings LLC"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-teal-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Contact Phone
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(555) 123-4567"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-teal-500 transition-colors"
              />
            </div>
          </div>
        </section>

        {/* 2. QUICKBOOKS ONLINE INTEGRATION STATUS */}
        <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 mb-6 shadow-xl">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-[#2CA01C]/15 border border-[#2CA01C]/30 flex items-center justify-center">
              <Link2 className="w-5 h-5 text-[#2CA01C]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">QuickBooks Online Connection</h2>
              <p className="text-xs text-slate-400">Manage OAuth connection, General Ledger link, and sync state.</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-bold text-white">Intuit QuickBooks Online</span>
                {isQbConnected ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    <CheckCircle2 className="w-3 h-3" /> Live Synchronized
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                    Disconnected
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                {isQbConnected
                  ? `Active connection linking Company ID ${qboCompanyId || 'Verified'}. ${lastSync ? `Last synced: ${lastSync}` : ''}`
                  : 'Connect your Intuit account to enable automated financial sync.'}
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <Link
                href="/connect"
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-teal-300 text-xs font-semibold rounded-xl border border-slate-700 transition-colors whitespace-nowrap"
              >
                {isQbConnected ? 'Manage Integration' : 'Connect QuickBooks'}
              </Link>
            </div>
          </div>
        </section>

        {/* 3. ACCOUNTING PREFERENCES */}
        <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 mb-6 shadow-xl">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <Scale className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Accounting Preferences</h2>
              <p className="text-xs text-slate-400">Choose how metrics and reports are calculated across all dashboards.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-2">
                Reporting Basis
              </label>
              <div className="grid sm:grid-cols-2 gap-3 max-w-md">
                <button
                  type="button"
                  onClick={() => setReportingBasis('cash')}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                    reportingBasis === 'cash'
                      ? 'bg-teal-500/10 border-teal-500/40 text-teal-300'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <p className="text-sm font-bold text-white">Cash Basis (Default)</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Recognizes revenue when received and expenses when paid out.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setReportingBasis('accrual')}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                    reportingBasis === 'accrual'
                      ? 'bg-teal-500/10 border-teal-500/40 text-teal-300'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <p className="text-sm font-bold text-white">Accrual Basis</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Recognizes revenue when earned and expenses when incurred.
                  </p>
                </button>
              </div>
            </div>

            <div className="pt-2">
              <span className="text-xs text-slate-400 block mb-1">Fiscal Year End</span>
              <p className="text-sm text-slate-200 font-semibold">December 31 (Calendar Year)</p>
            </div>
          </div>
        </section>

        {/* 4. NOTIFICATIONS */}
        <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 mb-6 shadow-xl">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
              <Bell className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Notifications &amp; Digests</h2>
              <p className="text-xs text-slate-400">Configure your email frequency and automated alerts.</p>
            </div>
          </div>

          <div className="space-y-4">
            <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 cursor-pointer">
              <div>
                <p className="text-sm font-semibold text-white">Weekly AI Financial Summary</p>
                <p className="text-xs text-slate-400">Plain-English digest of your key numbers delivered every Monday morning.</p>
              </div>
              <input
                type="checkbox"
                checked={weeklyEmail}
                onChange={(e) => setWeeklyEmail(e.target.checked)}
                className="w-4 h-4 rounded text-teal-500 focus:ring-teal-500 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 cursor-pointer">
              <div>
                <p className="text-sm font-semibold text-white">Data Quality &amp; AR Anomaly Alerts</p>
                <p className="text-xs text-slate-400">Get notified when accounts receivable or unclassified expenses spike.</p>
              </div>
              <input
                type="checkbox"
                checked={anomalyAlerts}
                onChange={(e) => setAnomalyAlerts(e.target.checked)}
                className="w-4 h-4 rounded text-teal-500 focus:ring-teal-500 cursor-pointer"
              />
            </label>
          </div>
        </section>

        {/* Save Changes Button */}
        <div className="flex justify-end mb-8">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white font-semibold text-sm rounded-xl shadow-lg shadow-teal-500/25 transition-all cursor-pointer disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{saving ? 'Saving...' : 'Save Preferences'}</span>
          </button>
        </div>
      </div>
    </PortalShell>
  );
}
