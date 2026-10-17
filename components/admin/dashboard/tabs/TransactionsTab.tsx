'use client';

import React from 'react';
import { 
  ArrowDownRight, 
  ArrowUpRight, 
  AlertCircle, 
  ArrowRightLeft, 
  Users, 
  Building, 
  Package 
} from 'lucide-react';
import { QuickBooksData } from '@/types/admin';
import { formatCurrency, formatDate } from '@/lib/admin-utils';

interface TransactionsTabProps {
  qbData: QuickBooksData | null;
}

export default function TransactionsTab({ qbData }: TransactionsTabProps) {
  const receivablesAmount = qbData?.customer?.balance ?? (qbData?.invoices?.totalAmount ?? 0);
  const payablesAmount = qbData?.expenses?.categories?.['Accounts Payable Liability'] ?? (qbData?.expenses?.totalAmount ?? 0);
  const overdueAmount = qbData?.invoices?.overdueAmount ?? 0;
  const netPosition = receivablesAmount - payablesAmount;

  return (
    <div className="space-y-6">
      {/* Transaction Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 sm:p-5 hover:border-slate-700 transition-all shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">
              Receivables (AR)
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-white tracking-tight tabular-nums">
            {formatCurrency(receivablesAmount)}
          </p>
          <p className="text-xs text-slate-400 mt-2">Outstanding client invoices</p>
        </div>

        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 sm:p-5 hover:border-slate-700 transition-all shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">
              Payables (AP)
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-white tracking-tight tabular-nums">
            {formatCurrency(payablesAmount)}
          </p>
          <p className="text-xs text-slate-400 mt-2">Committed vendor bills</p>
        </div>

        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 sm:p-5 hover:border-slate-700 transition-all shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">
              Overdue Aging
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-amber-400 tracking-tight tabular-nums">
            {formatCurrency(overdueAmount)}
          </p>
          <p className="text-xs text-slate-400 mt-2">Requires collection action</p>
        </div>

        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 sm:p-5 hover:border-slate-700 transition-all shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">
              Net Working Position
            </span>
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
              <ArrowRightLeft className="w-4 h-4" />
            </div>
          </div>
          <p className={`text-2xl sm:text-3xl font-bold tracking-tight tabular-nums ${netPosition >= 0 ? 'text-teal-400' : 'text-rose-400'}`}>
            {formatCurrency(netPosition)}
          </p>
          <p className="text-xs text-slate-400 mt-2">Net AR &minus; AP spread</p>
        </div>
      </div>

      {/* Accounts Receivable */}
      <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 shadow-lg">
        <h3 className="text-base font-semibold text-white tracking-tight mb-4">Accounts Receivable Aging</h3>
        
        {/* Invoice Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-6">
          <div className="bg-slate-800/50 border border-slate-800 rounded-xl p-3.5">
            <p className="text-xs text-slate-400 font-medium">Open Invoices</p>
            <p className="text-xl font-bold text-white tabular-nums mt-0.5">{qbData?.invoices?.total ?? 0}</p>
          </div>
          <div className="bg-slate-800/50 border border-slate-800 rounded-xl p-3.5">
            <p className="text-xs text-slate-400 font-medium">Settled / Paid</p>
            <p className="text-xl font-bold text-emerald-400 tabular-nums mt-0.5">
              {qbData?.invoices?.recentInvoices?.filter(i => i.balance === 0).length ?? 0}
            </p>
          </div>
          <div className="bg-slate-800/50 border border-slate-800 rounded-xl p-3.5">
            <p className="text-xs text-slate-400 font-medium">Overdue Invoices</p>
            <p className="text-xl font-bold text-amber-400 tabular-nums mt-0.5">
              {qbData?.invoices?.recentInvoices?.filter(i => new Date(i.dueDate) < new Date() && i.balance > 0).length ?? 0}
            </p>
          </div>
          <div className="bg-slate-800/50 border border-slate-800 rounded-xl p-3.5">
            <p className="text-xs text-slate-400 font-medium">DSO (Days to Pay)</p>
            <p className="text-xl font-bold text-teal-400 tabular-nums mt-0.5">28 Days</p>
          </div>
        </div>
        
        {/* Recent Invoices Table */}
        {qbData?.invoices?.recentInvoices && qbData.invoices.recentInvoices.length > 0 ? (
          <div className="border border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-4 py-3">Invoice #</th>
                  <th className="px-4 py-3">Issue Date</th>
                  <th className="px-4 py-3">Due Date</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Remaining Balance</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {qbData.invoices.recentInvoices.map(invoice => (
                  <tr key={invoice.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 font-mono font-semibold text-white">#{invoice.id}</td>
                    <td className="px-4 py-3 text-slate-400 font-mono">{formatDate(invoice.date)}</td>
                    <td className="px-4 py-3 text-slate-400 font-mono">{formatDate(invoice.dueDate)}</td>
                    <td className="px-4 py-3 text-white font-mono font-medium">{formatCurrency(invoice.amount)}</td>
                    <td className="px-4 py-3 text-slate-300 font-mono">{formatCurrency(invoice.balance)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 text-[11px] font-semibold rounded-full ${
                        invoice.balance === 0 
                          ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' 
                          : invoice.balance === invoice.amount 
                            ? 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
                            : 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
                      }`}>
                        {invoice.balance === 0 ? 'Settled' : invoice.balance === invoice.amount ? 'Unpaid' : 'Partial'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-6 text-xs text-slate-500">
            No active invoices found for this client account.
          </div>
        )}
      </div>

      {/* Accounts Payable / Expenses */}
      <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 shadow-lg">
        <h3 className="text-base font-semibold text-white tracking-tight mb-4">Accounts Payable & Operating Expenses</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-slate-800/50 border border-slate-800 rounded-xl p-4">
            <p className="text-xs text-slate-400 font-medium">Total Payables &amp; Expenses</p>
            <p className="text-2xl font-bold text-white tabular-nums mt-1">
              {formatCurrency(payablesAmount || (qbData?.expenses?.totalAmount ?? 0))}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">Current GL obligations</p>
          </div>
          <div className="bg-slate-800/50 border border-slate-800 rounded-xl p-4">
            <p className="text-xs text-slate-400 font-medium">Largest Category</p>
            <p className="text-2xl font-bold text-teal-400 mt-1">Accounts Payable</p>
            <p className="text-[11px] text-slate-400 mt-1">General ledger AP liability</p>
          </div>
          <div className="bg-slate-800/50 border border-slate-800 rounded-xl p-4">
            <p className="text-xs text-slate-400 font-medium">Reconciliation Status</p>
            <p className="text-2xl font-bold text-emerald-400 tabular-nums mt-1">Active</p>
            <p className="text-[11px] text-slate-400 mt-1">QuickBooks GL synchronized</p>
          </div>
        </div>
        
        {/* Expense Categories */}
        <div className="space-y-3">
          <div className="p-3.5 bg-slate-800/40 border border-slate-800 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">Accounts Payable (AP Liability)</p>
                <p className="text-[11px] text-slate-400">Current QBO accounts payable balance</p>
              </div>
            </div>
            <p className="text-sm font-bold text-white font-mono">{formatCurrency(payablesAmount)}</p>
          </div>

          <div className="p-3.5 bg-slate-800/40 border border-slate-800 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center">
                <Building className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">Cost of Labor &amp; Payroll</p>
                <p className="text-[11px] text-slate-400">Direct labor, benefits &amp; contractor expenses</p>
              </div>
            </div>
            <p className="text-sm font-bold text-white font-mono">
              {formatCurrency(qbData?.expenses?.categories?.['Cost of Labor'] ?? 0)}
            </p>
          </div>

          <div className="p-3.5 bg-slate-800/40 border border-slate-800 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center">
                <Package className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">Operating &amp; Facilities</p>
                <p className="text-[11px] text-slate-400">Operational facilities &amp; administrative costs</p>
              </div>
            </div>
            <p className="text-sm font-bold text-white font-mono">
              {formatCurrency(qbData?.expenses?.categories?.['Operating & Facilities'] ?? 0)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
