'use client';

import React from 'react';
import { 
  Building2, 
  Activity, 
  Plus, 
  Edit2, 
  Trash2, 
  DollarSign as ValueIcon, 
  TrendingDown as DepreciationIcon 
} from 'lucide-react';
import { Asset } from '@/types/admin';
import { 
  formatCurrency, 
  formatDate, 
  calculateDepreciation, 
  calculateAssetTotals, 
  getAssetIcon, 
  getAssetCategoryColor 
} from '@/lib/admin-utils';

interface AssetsTabProps {
  assets: Asset[];
  assetTotals: ReturnType<typeof calculateAssetTotals>;
  onAddAsset: () => void;
  onEditAsset: (asset: Asset) => void;
  onDeleteAsset: (id: string) => void;
  onSyncQboAssets?: () => void;
  qboFixedAssetsCount?: number;
  isQboConnected?: boolean;
}

export default function AssetsTab({
  assets,
  assetTotals,
  onAddAsset,
  onEditAsset,
  onDeleteAsset,
  onSyncQboAssets,
  qboFixedAssetsCount = 0,
  isQboConnected = false
}: AssetsTabProps) {
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);

  const filteredAssets = selectedCategory 
    ? assets.filter(a => a.category === selectedCategory) 
    : assets;

  const activeAssetsCount = assets.filter(a => a.status === 'active').length;

  return (
    <div className="space-y-6">
      {/* Asset Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 sm:p-5 hover:border-slate-700 transition-all shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">
              Total Assets
            </span>
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-white tracking-tight tabular-nums">
            {formatCurrency(assetTotals.totalCurrentValue)}
          </p>
          <p className="text-xs text-slate-400 mt-2">Current net book value</p>
        </div>

        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 sm:p-5 hover:border-slate-700 transition-all shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">
              Original Cost
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ValueIcon className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-white tracking-tight tabular-nums">
            {formatCurrency(assetTotals.totalOriginalValue)}
          </p>
          <p className="text-xs text-slate-400 mt-2">Historic purchase price</p>
        </div>

        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 sm:p-5 hover:border-slate-700 transition-all shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">
              Depreciation
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <DepreciationIcon className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-rose-400 tracking-tight tabular-nums">
            {formatCurrency(assetTotals.totalDepreciation)}
          </p>
          <p className="text-xs text-slate-400 mt-2">Accumulated allowance</p>
        </div>

        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 sm:p-5 hover:border-slate-700 transition-all shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">
              Active Assets
            </span>
            <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-white tracking-tight tabular-nums">
            {activeAssetsCount} of {assets.length}
          </p>
          <p className="text-xs text-slate-400 mt-2">In current deployment</p>
        </div>
      </div>

      {/* Asset Categories Breakdown - Interactive Filter */}
      <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-white tracking-tight">Asset Categories</h3>
          {selectedCategory && (
            <button
              type="button"
              onClick={() => setSelectedCategory(null)}
              className="text-xs font-semibold text-teal-400 hover:text-teal-300 transition-colors cursor-pointer"
            >
              Clear filter (showing {selectedCategory})
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
          {(['fixed', 'intangible', 'investment', 'inventory', 'lease'] as const).map(key => {
            const labels = {
              fixed: 'Fixed Assets',
              intangible: 'Intangibles',
              investment: 'Investments',
              inventory: 'Inventory',
              lease: 'Leasehold'
            };
            const isSelected = selectedCategory === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedCategory(isSelected ? null : key)}
                className={`p-3.5 rounded-xl text-center transition-all cursor-pointer ${
                  isSelected 
                    ? 'bg-teal-500/20 border-2 border-teal-400 shadow-md shadow-teal-500/20' 
                    : 'bg-slate-800/50 border border-slate-800 hover:border-slate-700 hover:bg-slate-800'
                }`}
              >
                <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl mb-2.5 ${
                  isSelected ? 'bg-teal-500/30 text-white' : 'bg-slate-800 border border-slate-700 text-teal-400'
                }`}>
                  {getAssetIcon(key)}
                </div>
                <p className={`text-xs font-medium ${isSelected ? 'text-teal-200 font-bold' : 'text-slate-400'}`}>
                  {labels[key]}
                </p>
                <p className="text-base font-bold text-white tabular-nums mt-0.5">
                  {formatCurrency(assetTotals.byCategory[key])}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Asset Register Table */}
      <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl overflow-hidden shadow-lg">
        <div className="px-6 py-4 border-b border-slate-800 flex flex-wrap gap-3 justify-between items-center bg-slate-950/40">
          <div>
            <h3 className="text-base font-semibold text-white tracking-tight">Asset Register</h3>
            <p className="text-xs text-slate-400">
              Catalog of hardware, facilities, software, and capital items &bull; {filteredAssets.length} records
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isQboConnected && onSyncQboAssets && qboFixedAssetsCount > 0 && (
              <button
                type="button"
                onClick={onSyncQboAssets}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl hover:bg-emerald-500/20 font-semibold text-xs transition-all cursor-pointer"
                title="Sync fixed assets from QuickBooks General Ledger"
              >
                <span>Sync QBO GL Assets ({qboFixedAssetsCount})</span>
              </button>
            )}
            <button
              type="button"
              onClick={onAddAsset}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-xl hover:from-teal-400 hover:to-emerald-400 font-semibold text-xs transition-all shadow-lg shadow-teal-500/20 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Asset
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-6 py-3.5">Asset</th>
                <th className="px-6 py-3.5">Category</th>
                <th className="px-6 py-3.5">Purchase Date</th>
                <th className="px-6 py-3.5">Original Cost</th>
                <th className="px-6 py-3.5">Current Value</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                      <Building2 className="w-8 h-8 text-slate-600 mb-3" />
                      <p className="font-semibold text-slate-300">No assets registered yet</p>
                      <p className="text-xs text-slate-500 mt-1 mb-4">
                        Add client assets or sync from QuickBooks GL to track book values and depreciation.
                      </p>
                      <div className="flex items-center gap-2">
                        {isQboConnected && onSyncQboAssets && qboFixedAssetsCount > 0 && (
                          <button
                            type="button"
                            onClick={onSyncQboAssets}
                            className="px-3.5 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-lg hover:bg-emerald-500/20 text-xs font-semibold cursor-pointer"
                          >
                            Sync QBO GL ({qboFixedAssetsCount})
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={onAddAsset}
                          className="px-3.5 py-1.5 bg-teal-500/10 border border-teal-500/30 text-teal-300 rounded-lg hover:bg-teal-500/20 text-xs font-semibold cursor-pointer"
                        >
                          + Add First Asset
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAssets.map(asset => {
                  const currentDeprecVal = calculateDepreciation(asset);
                  const percentDepreciated = asset.purchasePrice > 0 
                    ? Math.round(((asset.purchasePrice - currentDeprecVal) / asset.purchasePrice) * 100) 
                    : 0;
                  return (
                  <tr key={asset.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700/80 flex items-center justify-center text-teal-400 flex-shrink-0">
                          {getAssetIcon(asset.category)}
                        </div>
                        <div>
                          <p className="font-semibold text-white">{asset.name}</p>
                          <p className="text-[11px] text-slate-400">{asset.subcategory}</p>
                          {asset.location && (
                            <p className="text-[10px] text-slate-500">{asset.location}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-slate-800 border border-slate-700 text-slate-300 capitalize">
                        {asset.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400 font-mono">
                      {formatDate(asset.purchaseDate)}
                    </td>
                    <td className="px-6 py-4 text-white font-mono font-medium">
                      {formatCurrency(asset.purchasePrice)}
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-white font-mono font-bold">
                          {formatCurrency(currentDeprecVal)}
                        </p>
                        {asset.depreciationMethod !== 'none' && (
                          <p className="text-[11px] text-slate-500">
                            {percentDepreciated}% depreciated
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-[11px] font-semibold rounded-full capitalize ${
                        asset.status === 'active' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' :
                        asset.status === 'disposed' ? 'bg-slate-800 text-slate-400' :
                        asset.status === 'impaired' ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400' :
                        'bg-blue-500/10 border border-blue-500/20 text-blue-400'
                      }`}>
                        {asset.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => onEditAsset(asset)}
                          className="p-1.5 text-slate-400 hover:text-white bg-slate-800/80 rounded-lg hover:bg-slate-700 cursor-pointer transition-colors"
                          title="Edit Asset"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteAsset(asset.id)}
                          className="p-1.5 text-rose-400 hover:text-rose-300 bg-rose-500/10 rounded-lg hover:bg-rose-500/20 cursor-pointer transition-colors"
                          title="Delete Asset"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Depreciation Summary */}
      <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 shadow-lg">
        <h3 className="text-base font-semibold text-white tracking-tight mb-4">Depreciation & Tax Allowance</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 bg-slate-800/40 border border-slate-800 rounded-xl">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">By Method</p>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Straight-line</span>
                <span className="font-semibold text-white">{assets.filter(a => a.depreciationMethod === 'straight-line').length} assets</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Declining balance</span>
                <span className="font-semibold text-white">{assets.filter(a => a.depreciationMethod === 'declining').length} assets</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>No depreciation</span>
                <span className="font-semibold text-white">{assets.filter(a => a.depreciationMethod === 'none').length} assets</span>
              </div>
            </div>
          </div>
          <div className="p-4 bg-slate-800/40 border border-slate-800 rounded-xl">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Annual Depreciation Rate</p>
            <p className="text-2xl font-bold text-white tabular-nums">{formatCurrency(assetTotals.totalDepreciation / 3)}</p>
            <p className="text-xs text-slate-500 mt-1">Estimated annual amortization expense</p>
          </div>
          <div className="p-4 bg-slate-800/40 border border-slate-800 rounded-xl">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Book Value Retention</p>
            <p className="text-2xl font-bold text-teal-400 tabular-nums">
              {assetTotals.totalOriginalValue > 0 
                ? Math.round((assetTotals.totalCurrentValue / assetTotals.totalOriginalValue) * 100) 
                : 100}%
            </p>
            <p className="text-xs text-slate-500 mt-1">Of initial purchase price remaining</p>
          </div>
        </div>
      </div>
    </div>
  );
}
