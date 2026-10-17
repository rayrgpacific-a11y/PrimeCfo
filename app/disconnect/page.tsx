'use client';

import { useState } from 'react';
import Link from 'next/link';
import PortalShell from '@/components/portal/PortalShell';

export default function DisconnectQuickBooks() {
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isDisconnected, setIsDisconnected] = useState(false);

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      const clientId = params?.get('clientId') || '';
      const url = clientId ? `/api/quickbooks/disconnect?clientId=${encodeURIComponent(clientId)}` : '/api/quickbooks/disconnect';
      const res = await fetch(url, { method: 'POST' });
      if (res.ok) {
        setIsDisconnected(true);
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || 'Failed to disconnect QuickBooks');
      }
    } catch (error) {
      console.error('Disconnect failed:', error);
      alert('Network error while disconnecting QuickBooks');
    } finally {
      setIsDisconnecting(false);
    }
  };

  return (
    <PortalShell activeView="connect">
      <div className="max-w-xl mx-auto py-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-8 md:p-10 shadow-2xl">
          
          {isDisconnected ? (
            // Success State
            <>
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              
              <h1 className="text-2xl font-semibold text-center mb-3">
                Successfully Disconnected
              </h1>
              
              <p className="text-white/60 text-center mb-8 leading-relaxed">
                Your QuickBooks Online account has been disconnected from PrimeCFO. 
                We have revoked access and will no longer sync your financial data.
              </p>

              <div className="space-y-3">
                <Link
                  href="/connect"
                  className="w-full py-3 px-6 rounded-xl font-medium text-white bg-[#2CA01C] hover:bg-[#248516] transition-all duration-200 flex items-center justify-center gap-2"
                >
                  Reconnect QuickBooks
                </Link>
                
                <Link
                  href="/dashboard"
                  className="w-full py-3 px-6 rounded-xl font-medium text-white/70 bg-white/5 hover:bg-white/10 transition-all duration-200 flex items-center justify-center"
                >
                  Return to Dashboard
                </Link>
              </div>
            </>
          ) : (
            // Disconnect Confirmation
            <>
              <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              
              <h1 className="text-2xl font-semibold text-center mb-3">
                Disconnect QuickBooks
              </h1>
              
              <p className="text-white/60 text-center mb-8 leading-relaxed">
                Are you sure you want to disconnect your QuickBooks Online account from PrimeCFO?
              </p>

              {/* What happens section */}
              <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5 mb-8">
                <p className="text-sm font-medium mb-3">What happens when you disconnect:</p>
                <ul className="space-y-2 text-sm text-white/60">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-white/40 mt-1.5 flex-shrink-0"></span>
                    PrimeCFO will no longer have access to your QuickBooks data
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-white/40 mt-1.5 flex-shrink-0"></span>
                    Real-time syncing and financial analysis will stop
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-white/40 mt-1.5 flex-shrink-0"></span>
                    You can reconnect at any time to restore access
                  </li>
                </ul>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleDisconnect}
                  disabled={isDisconnecting}
                  className="w-full py-3 px-6 rounded-xl font-medium text-white bg-red-600 hover:bg-red-700 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isDisconnecting ? (
                    <>
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Disconnecting...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Yes, Disconnect QuickBooks
                    </>
                  )}
                </button>
                
                <Link
                  href="/dashboard"
                  className="w-full py-3 px-6 rounded-xl font-medium text-white/70 bg-white/5 hover:bg-white/10 transition-all duration-200 flex items-center justify-center"
                >
                  Cancel
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </PortalShell>
  );
}