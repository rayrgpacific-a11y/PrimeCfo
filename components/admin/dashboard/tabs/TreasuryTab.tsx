'use client';

import React from 'react';
import { 
  Wallet, 
  CreditCard, 
  ArrowRightLeft, 
  Calendar, 
  ArrowDownRight, 
  ArrowUpRight, 
  TrendingUp, 
  Banknote,
  Plus
} from 'lucide-react';
import { TreasuryData } from '@/types/admin';
import { formatCurrency, formatDate } from '@/lib/admin-utils';

interface TreasuryTabProps {
  treasuryData: TreasuryData;
}

export default function TreasuryTab({ treasuryData }: TreasuryTabProps) {
  const totalCreditLimit = treasuryData.creditLines.reduce((sum, l) => sum + l.limit, 0);
  const totalCreditAvailable = treasuryData.creditLines.reduce((sum, l) => sum + l.available, 0);

  return (
    <div className="space-y-6">
      {/* Cash Position Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 sm:p-5 hover:border-slate-700 transition-all shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">
              Total Cash
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-white tracking-tight tabular-nums">
            {formatCurrency(treasuryData.totalCash)}
          </p>
          <p className="text-xs text-slate-400 mt-2">Across all operating accounts</p>
        </div>

        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 sm:p-5 hover:border-slate-700 transition-all shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">
              Available Credit
            </span>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-white tracking-tight tabular-nums">
            {formatCurrency(totalCreditAvailable)}
          </p>
          <p className="text-xs text-slate-400 mt-2">Across {treasuryData.creditLines.length} credit lines</p>
        </div>

        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 sm:p-5 hover:border-slate-700 transition-all shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">
              Net Cash Flow
            </span>
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
              <ArrowRightLeft className="w-4 h-4" />
            </div>
          </div>
          <p className={`text-2xl sm:text-3xl font-bold tracking-tight tabular-nums ${treasuryData.cashFlow.net >= 0 ? 'text-teal-400' : 'text-rose-400'}`}>
            {formatCurrency(treasuryData.cashFlow.net)}
          </p>
          <p className="text-xs text-slate-400 mt-2">Current period net change</p>
        </div>

        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 sm:p-5 hover:border-slate-700 transition-all shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">
              Days Cash On Hand
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-white tracking-tight tabular-nums">
            {treasuryData.cashFlow.outflows > 0 
              ? `${Math.round(treasuryData.totalCash / (treasuryData.cashFlow.outflows / 30))} Days`
              : treasuryData.totalCash > 0 ? '365+ Days' : '0 Days'}
          </p>
          <p className="text-xs text-slate-400 mt-2">
            {treasuryData.cashFlow.outflows > 0 ? 'At current burn rate' : 'No recorded outflows'}
          </p>
        </div>
      </div>

      {/* Cash Flow Breakdown */}
      <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 shadow-lg">
        <h3 className="text-base font-semibold text-white tracking-tight mb-4">Cash Flow Velocity</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-emerald-300 uppercase tracking-wider">Inflows</span>
              <ArrowDownRight className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-bold text-white tabular-nums">{formatCurrency(treasuryData.cashFlow.inflows)}</p>
            <p className="text-[11px] text-slate-400 mt-1">Customer collections & deposits</p>
          </div>

          <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-rose-300 uppercase tracking-wider">Outflows</span>
              <ArrowUpRight className="w-4 h-4 text-rose-400" />
            </div>
            <p className="text-2xl font-bold text-white tabular-nums">{formatCurrency(treasuryData.cashFlow.outflows)}</p>
            <p className="text-[11px] text-slate-400 mt-1">Payroll, vendors & operations</p>
          </div>

          <div className="bg-teal-500/10 border border-teal-500/20 rounded-xl p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-teal-300 uppercase tracking-wider">Net Position</span>
              <TrendingUp className="w-4 h-4 text-teal-400" />
            </div>
            <p className="text-2xl font-bold text-teal-300 tabular-nums">{formatCurrency(treasuryData.cashFlow.net)}</p>
            <p className="text-[11px] text-slate-400 mt-1">Positive operating trend</p>
          </div>
        </div>

        {/* 30-Day Forecast Bar */}
        <div className="border-t border-slate-800/80 pt-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">30-Day Cash Forecast</span>
            <span className="font-bold text-sm text-teal-300">{formatCurrency(Math.max(0, treasuryData.totalCash + treasuryData.cashFlow.net))}</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
            <div className="bg-gradient-to-r from-teal-500 to-emerald-500 h-2.5 rounded-full" style={{ width: '85%' }}></div>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">Projected end-of-month cash based on historic inflows and committed AP schedules.</p>
        </div>
      </div>

      {/* Bank Accounts Table */}
      <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl overflow-hidden shadow-lg">
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/40">
          <div>
            <h3 className="text-base font-semibold text-white tracking-tight">Active Bank Accounts</h3>
            <p className="text-xs text-slate-400">Connected operating, payroll, and reserve accounts</p>
          </div>
          <button type="button" className="text-teal-400 hover:text-teal-300 text-xs font-semibold flex items-center gap-1 cursor-pointer">
            <Plus className="w-3.5 h-3.5" />
            Connect Account
          </button>
        </div>
        <div className="divide-y divide-slate-800">
          {treasuryData.accountBalances.map((account, idx) => (
            <div key={idx} className="flex items-center justify-between p-4 px-6 hover:bg-slate-800/40 transition-colors">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 bg-teal-500/10 border border-teal-500/20 rounded-xl flex items-center justify-center text-teal-400">
                  <Banknote className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-white">{account.bank} &mdash; {account.accountName}</p>
                  <p className="text-xs text-slate-400">Available: <span className="text-slate-300 font-mono">{formatCurrency(account.available)}</span></p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-base font-bold text-white tabular-nums">{formatCurrency(account.balance)}</p>
                <p className="text-[11px] text-slate-500 uppercase font-mono">{account.currency}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Credit Lines & Upcoming Transactions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Credit Lines */}
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 shadow-lg">
          <h3 className="text-base font-semibold text-white tracking-tight mb-4">Credit Facilities & Revolvers</h3>
          <div className="space-y-4">
            {treasuryData.creditLines.map((line, idx) => (
              <div key={idx} className="p-4 bg-slate-800/50 border border-slate-800 rounded-xl space-y-2.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-white">{line.lender}</span>
                  <span className="text-teal-400 font-mono font-medium">{line.rate}% APR</span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-teal-500 to-cyan-500 h-2 rounded-full" 
                    style={{ width: `${Math.min(100, (line.used / (line.limit || 1)) * 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Used: <strong className="text-slate-300">{formatCurrency(line.used)}</strong></span>
                  <span>Available: <strong className="text-teal-300">{formatCurrency(line.available)}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Transactions */}
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 shadow-lg">
          <h3 className="text-base font-semibold text-white tracking-tight mb-4">Cash Horizon Schedule</h3>
          <div className="space-y-2.5">
            {treasuryData.upcomingTransactions.map((transaction, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-800/60 hover:bg-slate-800/70 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                    transaction.type === 'inflow' 
                      ? 'bg-emerald-500/10 text-emerald-400' 
                      : 'bg-rose-500/10 text-rose-400'
                  }`}>
                    {transaction.type === 'inflow' ? (
                      <ArrowDownRight className="w-3.5 h-3.5" />
                    ) : (
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white truncate max-w-[200px]">{transaction.description}</p>
                    <p className="text-[11px] text-slate-400">{formatDate(transaction.date)}</p>
                  </div>
                </div>
                <span className={`text-xs font-bold tabular-nums ${
                  transaction.type === 'inflow' ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {transaction.type === 'inflow' ? '+' : '-'}{formatCurrency(transaction.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
