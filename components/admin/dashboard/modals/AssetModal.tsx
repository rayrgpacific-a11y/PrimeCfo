'use client';

import React from 'react';
import { X, Save } from 'lucide-react';
import { Asset } from '@/types/admin';

interface AssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  editingAsset: Asset | null;
  assetFormData: Partial<Asset>;
  setAssetFormData: React.Dispatch<React.SetStateAction<Partial<Asset>>>;
}

export default function AssetModal({
  isOpen,
  onClose,
  onSave,
  editingAsset,
  assetFormData,
  setAssetFormData
}: AssetModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl animate-in fade-in-50 zoom-in-95 flex flex-col">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              {editingAsset ? 'Edit Capital Asset' : 'Register New Capital Asset'}
            </h2>
            <p className="text-xs text-slate-400">Configure depreciation schedule and asset metadata</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Asset Name */}
            <div className="col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Asset Name *
              </label>
              <input
                type="text"
                value={assetFormData.name || ''}
                onChange={(e) => setAssetFormData({...assetFormData, name: e.target.value})}
                className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-400 text-xs"
                placeholder="e.g., Primary Production Database Server"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Asset Class *
              </label>
              <select
                value={assetFormData.category || 'fixed'}
                onChange={(e) => setAssetFormData({...assetFormData, category: e.target.value as Asset['category']})}
                className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-teal-400 text-xs cursor-pointer"
              >
                <option value="fixed" className="bg-slate-900 text-white">Fixed Assets</option>
                <option value="intangible" className="bg-slate-900 text-white">Intangible Assets</option>
                <option value="investment" className="bg-slate-900 text-white">Investments</option>
                <option value="inventory" className="bg-slate-900 text-white">Inventory</option>
                <option value="lease" className="bg-slate-900 text-white">Leasehold</option>
              </select>
            </div>

            {/* Subcategory */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Subcategory *
              </label>
              <input
                type="text"
                value={assetFormData.subcategory || ''}
                onChange={(e) => setAssetFormData({...assetFormData, subcategory: e.target.value})}
                className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-400 text-xs"
                placeholder="e.g., IT Hardware, Facilities"
              />
            </div>

            {/* Purchase Date */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Purchase Date *
              </label>
              <input
                type="date"
                value={assetFormData.purchaseDate || ''}
                onChange={(e) => setAssetFormData({...assetFormData, purchaseDate: e.target.value})}
                className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-teal-400 text-xs"
              />
            </div>

            {/* Purchase Price */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Historical Purchase Price *
              </label>
              <input
                type="number"
                value={assetFormData.purchasePrice ?? ''}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  setAssetFormData(prev => ({
                    ...prev, 
                    purchasePrice: val,
                    currentValue: val
                  }));
                }}
                className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-400 text-xs font-mono"
                placeholder="0.00"
              />
            </div>

            {/* Depreciation Method */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Depreciation Schedule
              </label>
              <select
                value={assetFormData.depreciationMethod || 'straight-line'}
                onChange={(e) => setAssetFormData({...assetFormData, depreciationMethod: e.target.value as Asset['depreciationMethod']})}
                className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-teal-400 text-xs cursor-pointer"
              >
                <option value="straight-line" className="bg-slate-900 text-white">Straight Line (SL)</option>
                <option value="declining" className="bg-slate-900 text-white">Declining Balance (DB)</option>
                <option value="units" className="bg-slate-900 text-white">Units of Production</option>
                <option value="none" className="bg-slate-900 text-white">No Depreciation</option>
              </select>
            </div>

            {/* Useful Life */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Useful Life (Years)
              </label>
              <input
                type="number"
                value={assetFormData.usefulLife || 5}
                onChange={(e) => setAssetFormData({...assetFormData, usefulLife: parseInt(e.target.value)})}
                className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-teal-400 text-xs font-mono"
                min="1"
              />
            </div>

            {/* Salvage Value */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Residual Salvage Value
              </label>
              <input
                type="number"
                value={assetFormData.salvageValue || 0}
                onChange={(e) => setAssetFormData({...assetFormData, salvageValue: parseFloat(e.target.value)})}
                className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-teal-400 text-xs font-mono"
                placeholder="0.00"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Lifecycle Status
              </label>
              <select
                value={assetFormData.status || 'active'}
                onChange={(e) => setAssetFormData({...assetFormData, status: e.target.value as Asset['status']})}
                className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-teal-400 text-xs cursor-pointer"
              >
                <option value="active" className="bg-slate-900 text-white">Active in Service</option>
                <option value="disposed" className="bg-slate-900 text-white">Disposed / Written Off</option>
                <option value="impaired" className="bg-slate-900 text-white">Impaired</option>
                <option value="under-maintenance" className="bg-slate-900 text-white">Maintenance Required</option>
              </select>
            </div>

            {/* Location */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Facility / Location
              </label>
              <input
                type="text"
                value={assetFormData.location || ''}
                onChange={(e) => setAssetFormData({...assetFormData, location: e.target.value})}
                className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-400 text-xs"
                placeholder="e.g., HQ - Server Room Rack 4"
              />
            </div>

            {/* Serial Number */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Serial / Tag Number
              </label>
              <input
                type="text"
                value={assetFormData.serialNumber || ''}
                onChange={(e) => setAssetFormData({...assetFormData, serialNumber: e.target.value})}
                className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-400 text-xs font-mono"
                placeholder="e.g., TAG-2024-SERVER-01"
              />
            </div>

            {/* Notes */}
            <div className="col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Accounting Notes & Specs
              </label>
              <textarea
                value={assetFormData.notes || ''}
                onChange={(e) => setAssetFormData({...assetFormData, notes: e.target.value})}
                className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-400 text-xs leading-relaxed"
                rows={3}
                placeholder="Add asset notes or compliance specifications..."
              />
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-800 flex justify-end gap-3 bg-slate-950/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            className="px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-lg shadow-teal-500/20 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            {editingAsset ? 'Update Capital Asset' : 'Save Asset to Register'}
          </button>
        </div>
      </div>
    </div>
  );
}
