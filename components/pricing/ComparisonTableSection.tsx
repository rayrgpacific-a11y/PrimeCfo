'use client';

import React from 'react';
import { Check, Minus } from 'lucide-react';
import { comparisonRows } from '@/data/pricing';

export default function ComparisonTableSection() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div className="text-center mb-12">
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
          Detailed Feature Comparison
        </h2>
        <p className="text-sm text-slate-400">
          Compare full capabilities across all four plans side by side.
        </p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-sm shadow-xl">
        <table className="w-full text-left text-sm border-collapse min-w-[640px]">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/90 text-xs uppercase tracking-wider text-slate-400">
              <th className="py-4 px-6 font-semibold">Features</th>
              <th className="py-4 px-4 font-semibold text-center w-28">Starter</th>
              <th className="py-4 px-4 font-semibold text-center w-28">See</th>
              <th className="py-4 px-4 font-semibold text-center w-36 text-teal-400 bg-teal-500/10">
                Understand
              </th>
              <th className="py-4 px-4 font-semibold text-center w-32">Act</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {comparisonRows.map((row, index) => (
              <tr key={index} className="hover:bg-slate-800/30 transition-colors">
                <td className="py-3.5 px-6 font-medium text-slate-200 text-xs sm:text-sm">
                  {row.feature}
                </td>

                {/* Starter */}
                <td className="py-3.5 px-4 text-center">
                  {typeof row.starter === 'boolean' ? (
                    row.starter ? (
                      <Check className="w-4 h-4 text-teal-400 mx-auto" />
                    ) : (
                      <Minus className="w-4 h-4 text-slate-600 mx-auto" />
                    )
                  ) : (
                    <span className="text-xs text-slate-300 font-medium">{row.starter}</span>
                  )}
                </td>

                {/* See */}
                <td className="py-3.5 px-4 text-center">
                  {typeof row.see === 'boolean' ? (
                    row.see ? (
                      <Check className="w-4 h-4 text-teal-400 mx-auto" />
                    ) : (
                      <Minus className="w-4 h-4 text-slate-600 mx-auto" />
                    )
                  ) : (
                    <span className="text-xs text-slate-300 font-medium">{row.see}</span>
                  )}
                </td>

                {/* Understand */}
                <td className="py-3.5 px-4 text-center bg-teal-500/[0.04]">
                  {typeof row.understand === 'boolean' ? (
                    row.understand ? (
                      <Check className="w-4 h-4 text-teal-400 mx-auto" />
                    ) : (
                      <Minus className="w-4 h-4 text-slate-600 mx-auto" />
                    )
                  ) : (
                    <span className="text-xs text-teal-300 font-semibold">{row.understand}</span>
                  )}
                </td>

                {/* Act */}
                <td className="py-3.5 px-4 text-center">
                  {typeof row.act === 'boolean' ? (
                    row.act ? (
                      <Check className="w-4 h-4 text-teal-400 mx-auto" />
                    ) : (
                      <Minus className="w-4 h-4 text-slate-600 mx-auto" />
                    )
                  ) : (
                    <span className="text-xs text-slate-300 font-medium">{row.act}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
