'use client';

import React, { useState, useEffect } from 'react';
import { Lock, ShieldCheck, Loader2 } from 'lucide-react';

interface AdminAuthProps {
  children: React.ReactNode;
}

export default function AdminAuth({ children }: AdminAuthProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Check server-side authenticated session via /api/me
    async function checkSession() {
      try {
        const res = await fetch('/api/me');
        if (res.ok) {
          const data = await res.json();
          if (data.isOperator) {
            setIsAuthenticated(true);
          }
        }
      } catch (err) {
        console.warn('Session check failed:', err);
      } finally {
        setIsLoading(false);
      }
    }
    checkSession();
  }, []);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      // Authenticate against the secure server-side API
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@primecfo.ai',
          password: password,
        }),
      });

      const data = await res.json();

      if (res.ok && data.isOperator) {
        setIsAuthenticated(true);
        setError('');
      } else {
        setError(data.error || 'Incorrect operator credentials. Access denied.');
        setPassword('');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-teal-400" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-4 font-sans selection:bg-teal-500/30 selection:text-teal-200">
        <div className="max-w-md w-full bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl p-8 backdrop-blur-xl">
          <div className="flex items-center justify-center w-14 h-14 bg-gradient-to-br from-teal-400/20 to-emerald-500/20 border border-teal-500/30 rounded-2xl mx-auto mb-5 text-teal-400 shadow-lg shadow-teal-500/10">
            <Lock className="w-7 h-7" />
          </div>

          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-300 text-xs font-semibold uppercase tracking-wider mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              Operator Command Center
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Admin Access Required
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Enter operator password to access the PrimeCFO admin portal
            </p>
          </div>
          
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-xs font-medium uppercase tracking-wider text-slate-400 mb-1.5">
                Admin Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
                className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent text-sm transition-all disabled:opacity-50"
                placeholder="Enter operator password"
                autoFocus
              />
              {error && (
                <p className="mt-2 text-xs font-medium text-rose-400">{error}</p>
              )}
            </div>
            
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white font-semibold py-2.5 px-4 rounded-xl transition-all shadow-lg shadow-teal-500/25 cursor-pointer text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying credentials...</span>
                </>
              ) : (
                <span>Access Admin Panel</span>
              )}
            </button>
          </form>
          
          <p className="mt-6 text-xs text-center text-slate-500">
            Authorized CFO operators only &bull; Prime Accounting Solutions
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
