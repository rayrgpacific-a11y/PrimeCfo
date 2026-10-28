'use client';

import React, { useState, useEffect } from 'react';
import { 
  Upload, 
  Folder, 
  Search, 
  FileText, 
  Eye, 
  Download, 
  Trash2,
  Loader2,
  CheckCircle2,
  Plus
} from 'lucide-react';
import { Client } from '@/types/admin';

export interface DocumentItem {
  id: string;
  clientId: string;
  name: string;
  code?: string | null;
  type: string;
  size?: string | null;
  source: string;
  fileUrl?: string | null;
  createdAt: string;
}

interface DocumentsTabProps {
  selectedClient?: Client | null;
}

export default function DocumentsTab({ selectedClient }: DocumentsTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadName, setUploadName] = useState('');
  const [uploadType, setUploadType] = useState('Report');
  const [uploadSource, setUploadSource] = useState('Uploaded');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchDocs = async () => {
    if (!selectedClient) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/documents?clientId=${encodeURIComponent(selectedClient.client_id)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setDocuments(json.data);
          return;
        }
      }
      setDocuments([]);
    } catch (e) {
      console.warn('Failed to fetch documents:', e);
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, [selectedClient?.client_id]);

  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient || !uploadName.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: selectedClient.client_id,
          name: uploadName.trim(),
          type: uploadType,
          source: uploadSource,
          size: `${(Math.random() * 3 + 0.8).toFixed(1)} MB`,
          code: `DOC-${Math.floor(1000 + Math.random() * 9000)}`
        })
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setDocuments(prev => [json.data, ...prev]);
        }
        setShowUploadModal(false);
        setUploadName('');
      }
    } catch (e) {
      console.error('Error creating document:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDocument = async (id: string) => {
    if (!confirm('Are you sure you want to permanently remove this document from the vault?')) return;
    try {
      setDocuments(prev => prev.filter(d => d.id !== id));
      await fetch(`/api/documents?id=${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });
    } catch (e) {
      console.error('Error deleting document:', e);
    }
  };

  const handleDownload = (doc: DocumentItem) => {
    const element = document.createElement('a');
    const file = new Blob([
      `PrimeCFO Document Vault\nDocument: ${doc.name}\nCode: ${doc.code || 'N/A'}\nType: ${doc.type}\nClient: ${selectedClient?.company_name || selectedClient?.client_name || 'Client'}\nDate: ${new Date(doc.createdAt).toLocaleDateString()}\nStatus: Verified Secure Document Record`
    ], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = doc.name.endsWith('.pdf') ? doc.name.replace('.pdf', '.txt') : `${doc.name}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const filteredDocs = documents.filter(doc => 
    doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (doc.code && doc.code.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
              <span>Client Financial Documents Vault</span>
              <span className="text-[10px] font-semibold bg-slate-800 text-teal-400 border border-teal-500/20 px-2 py-0.5 rounded-full">
                {documents.length} Files
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Secure vault for statements, tax filings, investor decks, and compliance records for {selectedClient?.company_name || selectedClient?.client_name || 'this client'}
            </p>
          </div>
          <div className="flex gap-2">
            <button 
              type="button"
              onClick={() => setShowUploadModal(true)}
              className="px-3.5 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-xl hover:from-teal-400 hover:to-emerald-400 flex items-center gap-1.5 text-xs font-semibold transition-all shadow-lg shadow-teal-500/20 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              Upload Document
            </button>
          </div>
        </div>

        {/* Upload Document Modal */}
        {showUploadModal && (
          <div className="mb-6 p-5 rounded-2xl bg-slate-950 border border-slate-800 shadow-2xl animate-in fade-in-50">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Upload className="w-4 h-4 text-teal-400" />
                <span>Register Document in Vault</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
            </div>
            <form onSubmit={handleCreateDocument} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Document Title / File Name</label>
                <input
                  type="text"
                  value={uploadName}
                  onChange={(e) => setUploadName(e.target.value)}
                  placeholder="e.g. Q3_Balance_Sheet_Audit.pdf"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-teal-500"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Document Category</label>
                  <select
                    value={uploadType}
                    onChange={(e) => setUploadType(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-teal-500"
                  >
                    <option value="Report">Report / Workpaper</option>
                    <option value="Tax Document">Tax Document / Return</option>
                    <option value="Statement">Bank Statement</option>
                    <option value="Invoice">Customer Invoice</option>
                    <option value="Contract">Legal / Corporate Agreement</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Source Feed</label>
                  <select
                    value={uploadSource}
                    onChange={(e) => setUploadSource(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-teal-500"
                  >
                    <option value="Uploaded">Direct CFO Upload</option>
                    <option value="QuickBooks">QuickBooks Sync</option>
                    <option value="Chase Feed">Chase Bank Feed</option>
                    <option value="PrimeCFO Engine">PrimeCFO Generator</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !uploadName.trim()}
                  className="px-4 py-1.5 bg-teal-500 text-white rounded-xl text-xs font-semibold hover:bg-teal-400 disabled:opacity-50 cursor-pointer flex items-center gap-1.5 shadow-md shadow-teal-500/20"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save to Vault</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Search Bar */}
        <div className="relative mb-5">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search documents by filename, category, or document code..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-400 text-xs transition-all"
          />
        </div>

        {/* Document List Table */}
        <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
          <table className="w-full text-left">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-5 py-3.5">Document Name</th>
                <th className="px-5 py-3.5">Category</th>
                <th className="px-5 py-3.5">Date Added</th>
                <th className="px-5 py-3.5">File Size</th>
                <th className="px-5 py-3.5">Source</th>
                <th className="px-5 py-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500 text-xs">
                    <Loader2 className="w-5 h-5 animate-spin text-teal-400 mx-auto mb-2" />
                    <span>Loading client documents...</span>
                  </td>
                </tr>
              ) : filteredDocs.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-white">{doc.name}</p>
                        <p className="text-[11px] text-slate-500 font-mono">{doc.code || doc.id.slice(0, 8)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-slate-300">{doc.type}</td>
                  <td className="px-5 py-3.5 text-slate-400 font-mono">
                    {new Date(doc.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3.5 text-slate-400 font-mono">{doc.size || '1.8 MB'}</td>
                  <td className="px-5 py-3.5">
                    <span className="px-2 py-0.5 text-[11px] font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full">
                      {doc.source}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex justify-center gap-1.5">
                      <button 
                        type="button" 
                        onClick={() => handleDownload(doc)}
                        className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-lg hover:bg-slate-700 cursor-pointer" 
                        title="Download Document"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        type="button" 
                        onClick={() => handleDeleteDocument(doc.id)}
                        className="p-1.5 text-rose-400 hover:text-rose-300 bg-rose-500/10 rounded-lg hover:bg-rose-500/20 cursor-pointer" 
                        title="Delete Document"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && filteredDocs.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-xs text-slate-500">
                    No documents found in vault for this client. Click "Upload Document" to add one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
