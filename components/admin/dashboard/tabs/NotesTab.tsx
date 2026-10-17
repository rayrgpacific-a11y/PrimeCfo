'use client';

import React from 'react';
import { Plus, CheckSquare, Clock } from 'lucide-react';

interface NotesTabProps {
  notes: string;
  setNotes: (notes: string) => void;
  editingNotes: boolean;
  setEditingNotes: (editing: boolean) => void;
  onSaveNotes: () => void;
}

export default function NotesTab({
  notes,
  setNotes,
  editingNotes,
  setEditingNotes,
  onSaveNotes
}: NotesTabProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Notes Section */}
      <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-white tracking-tight">CFO Advisory Notes</h3>
            <p className="text-xs text-slate-400">Strategic notes and board preparation items for this client</p>
          </div>
          <button
            type="button"
            onClick={() => setEditingNotes(!editingNotes)}
            className="text-teal-400 hover:text-teal-300 text-xs font-semibold cursor-pointer transition-colors"
          >
            {editingNotes ? 'Cancel Edit' : 'Edit Notes'}
          </button>
        </div>

        {editingNotes ? (
          <div className="space-y-3">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full h-64 p-3.5 bg-slate-800/80 border border-slate-700/80 rounded-xl focus:ring-2 focus:ring-teal-400 focus:border-transparent text-white placeholder-slate-500 text-xs leading-relaxed"
              placeholder="Record executive notes, tax strategies, board meeting comments, or banking covenants..."
            />
            <button
              type="button"
              onClick={onSaveNotes}
              className="px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-xl hover:from-teal-400 hover:to-emerald-400 text-xs font-semibold transition-all shadow-lg shadow-teal-500/20 cursor-pointer"
            >
              Save Advisory Notes
            </button>
          </div>
        ) : (
          <div className="p-4 bg-slate-800/40 border border-slate-800 rounded-xl min-h-[16rem]">
            <p className="text-slate-200 text-xs leading-relaxed whitespace-pre-wrap">
              {notes || 'No notes currently recorded. Click "Edit Notes" above to add executive commentary or financial action plans.'}
            </p>
          </div>
        )}
      </div>

      {/* Tasks Section */}
      <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-white tracking-tight">CFO Action Items & Reminders</h3>
            <p className="text-xs text-slate-400">Quarterly checklist, filings, and audit deliverables</p>
          </div>
          <button type="button" className="text-teal-400 hover:text-teal-300 p-1 cursor-pointer" title="Add Action Item">
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div className="p-3.5 bg-slate-800/50 border border-slate-800 rounded-xl flex items-start gap-3">
            <input type="checkbox" className="mt-1 rounded accent-teal-500 cursor-pointer" defaultChecked />
            <div className="flex-1">
              <p className="text-xs font-semibold text-slate-300 line-through">Audit Q3 general ledger entries</p>
              <p className="text-[11px] text-slate-500">Completed yesterday by Lead CFO</p>
            </div>
            <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-md">Done</span>
          </div>

          <div className="p-3.5 bg-slate-800/50 border border-amber-500/30 rounded-xl flex items-start gap-3">
            <input type="checkbox" className="mt-1 rounded accent-teal-500 cursor-pointer" />
            <div className="flex-1">
              <p className="text-xs font-semibold text-white">Review Q4 board deck & financial projections</p>
              <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                <Clock className="w-3 h-3 text-amber-400" />
                Due tomorrow at 5:00 PM EST
              </p>
            </div>
            <span className="px-2 py-0.5 text-[10px] font-semibold bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-md">High Priority</span>
          </div>

          <div className="p-3.5 bg-slate-800/50 border border-slate-800 rounded-xl flex items-start gap-3">
            <input type="checkbox" className="mt-1 rounded accent-teal-500 cursor-pointer" />
            <div className="flex-1">
              <p className="text-xs font-semibold text-white">Review accounts receivable aging beyond 45 days</p>
              <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                <Clock className="w-3 h-3 text-slate-400" />
                Due Nov 18th
              </p>
            </div>
            <span className="px-2 py-0.5 text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700 rounded-md">Normal</span>
          </div>
        </div>
      </div>
    </div>
  );
}
