'use client';

import React, { useState } from 'react';
import { 
  Upload, 
  Folder, 
  Search, 
  FileText, 
  Eye, 
  Download, 
  Trash2 
} from 'lucide-react';

interface DocumentItem {
  id: string;
  name: string;
  code: string;
  type: string;
  dateAdded: string;
  size: string;
  source: string;
}

export default function DocumentsTab() {
  const [searchQuery, setSearchQuery] = useState('');
  const [documents] = useState<DocumentItem[]>([
    {
      id: '1',
      name: 'Invoice_2024_Q3.pdf',
      code: 'INV-2024-089',
      type: 'Invoice',
      dateAdded: 'Nov 10, 2024',
      size: '2.4 MB',
      source: 'QuickBooks'
    },
    {
      id: '2',
      name: 'Tax_Return_FY2023.pdf',
      code: 'TAX-2023-F',
      type: 'Tax Document',
      dateAdded: 'Oct 15, 2024',
      size: '5.1 MB',
      source: 'Uploaded'
    },
    {
      id: '3',
      name: 'Bank_Statement_Oct2024.pdf',
      code: 'STM-OCT-24',
      type: 'Statement',
      dateAdded: 'Nov 02, 2024',
      size: '1.2 MB',
      source: 'Chase Feed'
    }
  ]);

  const filteredDocs = documents.filter(doc => 
    doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-base font-semibold text-white tracking-tight">Client Financial Documents</h3>
            <p className="text-xs text-slate-400">Vault for statements, tax filings, investor decks, and compliance files</p>
          </div>
          <div className="flex gap-2">
            <button 
              type="button"
              className="px-3.5 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-xl hover:from-teal-400 hover:to-emerald-400 flex items-center gap-1.5 text-xs font-semibold transition-all shadow-lg shadow-teal-500/20 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              Upload Document
            </button>
            <button 
              type="button"
              className="px-3.5 py-2 bg-slate-800 border border-slate-700 text-slate-300 rounded-xl hover:bg-slate-700 flex items-center gap-1.5 text-xs font-semibold transition-colors cursor-pointer"
            >
              <Folder className="w-3.5 h-3.5" />
              New Folder
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-5">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search documents by filename, tag, or document number..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-400 text-xs transition-all"
          />
        </div>

        {/* Document List Table */}
        <div className="border border-slate-800 rounded-xl overflow-hidden">
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
              {filteredDocs.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-white">{doc.name}</p>
                        <p className="text-[11px] text-slate-500 font-mono">{doc.code}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-slate-300">{doc.type}</td>
                  <td className="px-5 py-3.5 text-slate-400 font-mono">{doc.dateAdded}</td>
                  <td className="px-5 py-3.5 text-slate-400 font-mono">{doc.size}</td>
                  <td className="px-5 py-3.5">
                    <span className="px-2 py-0.5 text-[11px] font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full">
                      {doc.source}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex justify-center gap-1.5">
                      <button type="button" className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-lg hover:bg-slate-700 cursor-pointer" title="View Document">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button type="button" className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-lg hover:bg-slate-700 cursor-pointer" title="Download">
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button type="button" className="p-1.5 text-rose-400 hover:text-rose-300 bg-rose-500/10 rounded-lg hover:bg-rose-500/20 cursor-pointer" title="Delete">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredDocs.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-xs text-slate-500">
                    No documents matching your search.
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
