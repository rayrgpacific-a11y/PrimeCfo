'use client';

import React, { useState } from 'react';
import { Plus, CheckSquare, Clock, Trash2, Loader2, Calendar, AlertCircle, CheckCircle2 } from 'lucide-react';

export interface ActionItemData {
  id: string;
  clientId: string;
  title: string;
  description?: string | null;
  isCompleted: boolean;
  priority: string;
  dueDate?: string | null;
  createdAt?: string;
}

interface NotesTabProps {
  notes: string;
  setNotes: (notes: string) => void;
  editingNotes: boolean;
  setEditingNotes: (editing: boolean) => void;
  onSaveNotes: () => void;
  isSavingNotes?: boolean;
  actionItems?: ActionItemData[];
  onToggleActionItem?: (id: string, isCompleted: boolean) => void;
  onAddActionItem?: (title: string, priority: string, dueDate?: string) => void;
  onDeleteActionItem?: (id: string) => void;
  actionItemsLoading?: boolean;
}

export default function NotesTab({
  notes,
  setNotes,
  editingNotes,
  setEditingNotes,
  onSaveNotes,
  isSavingNotes = false,
  actionItems = [],
  onToggleActionItem,
  onAddActionItem,
  onDeleteActionItem,
  actionItemsLoading = false
}: NotesTabProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState('normal');
  const [newDueDate, setNewDueDate] = useState('');
  const [submittingItem, setSubmittingItem] = useState(false);

  const handleCreateActionItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !onAddActionItem) return;
    setSubmittingItem(true);
    try {
      await onAddActionItem(newTitle.trim(), newPriority, newDueDate || undefined);
      setNewTitle('');
      setNewDueDate('');
      setNewPriority('normal');
      setShowAddForm(false);
    } finally {
      setSubmittingItem(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 1. CFO Advisory Notes Section */}
      <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800/60">
            <div>
              <h3 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
                <span>CFO Strategic Advisory Notes</span>
                <span className="text-[10px] font-medium bg-teal-500/10 border border-teal-500/30 text-teal-400 px-2 py-0.5 rounded-full">
                  Live Client Insights Sync
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Saved workpapers and executive commentary propagate directly to the Client Portal Insights page.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setEditingNotes(!editingNotes)}
              className="text-teal-400 hover:text-teal-300 text-xs font-semibold cursor-pointer transition-colors px-2.5 py-1 rounded-lg hover:bg-slate-800"
            >
              {editingNotes ? 'Cancel' : 'Edit Notes'}
            </button>
          </div>

          {editingNotes ? (
            <div className="space-y-3">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full h-72 p-4 bg-slate-950/80 border border-slate-700/80 rounded-xl focus:ring-2 focus:ring-teal-400 focus:border-transparent text-white placeholder-slate-500 text-xs leading-relaxed font-sans"
                placeholder="Record executive notes, tax strategies, board meeting commentary, banking covenants, or cash flow guidance..."
              />
              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-slate-400">
                  {notes.length} characters &bull; Authored by CFO Lead
                </span>
                <button
                  type="button"
                  onClick={onSaveNotes}
                  disabled={isSavingNotes}
                  className="px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-xl hover:from-teal-400 hover:to-emerald-400 text-xs font-semibold transition-all shadow-lg shadow-teal-500/20 cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {isSavingNotes && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Advisory Notes</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-slate-950/40 border border-slate-800/80 rounded-xl min-h-[18rem] flex flex-col justify-between">
              <p className="text-slate-200 text-xs leading-relaxed whitespace-pre-wrap">
                {notes || 'No advisory notes recorded for this entity yet. Click "Edit Notes" to write strategic recommendations.'}
              </p>
              <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500">
                <span>Direct CPA Workpapers &bull; Visible in Client Portal</span>
                <span className="text-teal-400 font-medium">Auto-Synced</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. Interactive Action Items & Checklist Section */}
      <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 shadow-xl flex flex-col">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800/60">
          <div>
            <h3 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
              <span>CFO Action Items & Checklist</span>
              <span className="text-[10px] font-semibold bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700">
                {actionItems.filter(i => !i.isCompleted).length} Pending
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Quarterly deliverables, audit workflows, and tax compliance</p>
          </div>
          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-500/10 border border-teal-500/30 text-teal-300 hover:bg-teal-500/20 text-xs font-semibold transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{showAddForm ? 'Close' : 'Add Item'}</span>
          </button>
        </div>

        {/* Inline Add Action Item Form */}
        {showAddForm && (
          <form onSubmit={handleCreateActionItem} className="mb-4 p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 animate-in fade-in-50">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Task Title</label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Audit Q3 accounts payable reconciliations..."
                className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Priority</label>
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-teal-500"
                >
                  <option value="high">High Priority</option>
                  <option value="normal">Normal</option>
                  <option value="low">Low Priority</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Target Due Date</label>
                <input
                  type="date"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingItem || !newTitle.trim()}
                className="px-3 py-1.5 bg-teal-500 text-white rounded-lg text-xs font-semibold hover:bg-teal-400 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                {submittingItem && <Loader2 className="w-3 h-3 animate-spin" />}
                <span>Add Task</span>
              </button>
            </div>
          </form>
        )}

        {/* Action Items List */}
        <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[22rem]">
          {actionItemsLoading ? (
            <div className="flex items-center justify-center py-12 text-slate-500 text-xs gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-teal-400" />
              <span>Loading action items...</span>
            </div>
          ) : actionItems.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 bg-slate-950/30 rounded-xl border border-slate-800/40">
              No checklist items recorded. Click "+ Add Item" above to track deliverables.
            </div>
          ) : (
            actionItems.map((item) => (
              <div
                key={item.id}
                className={`p-3 rounded-xl border transition-colors flex items-start gap-3 group ${
                  item.isCompleted
                    ? 'bg-slate-950/40 border-slate-800/60 opacity-75'
                    : item.priority === 'high'
                    ? 'bg-slate-950/70 border-amber-500/30 hover:border-amber-500/50'
                    : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                }`}
              >
                <input
                  type="checkbox"
                  checked={item.isCompleted}
                  onChange={(e) => onToggleActionItem && onToggleActionItem(item.id, e.target.checked)}
                  className="mt-1 w-4 h-4 rounded accent-teal-500 cursor-pointer"
                />
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-semibold truncate ${item.isCompleted ? 'line-through text-slate-400' : 'text-slate-100'}`}>
                    {item.title}
                  </p>
                  {item.description && (
                    <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                      {item.description}
                    </p>
                  )}
                  {item.dueDate && (
                    <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>Due: {new Date(item.dueDate).toLocaleDateString()}</span>
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 text-[10px] font-semibold rounded-md border ${
                      item.isCompleted
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                        : item.priority === 'high'
                        ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {item.isCompleted ? 'Done' : item.priority === 'high' ? 'High Priority' : 'Normal'}
                  </span>
                  {onDeleteActionItem && (
                    <button
                      type="button"
                      onClick={() => onDeleteActionItem(item.id)}
                      className="text-slate-600 hover:text-rose-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      title="Delete Item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
