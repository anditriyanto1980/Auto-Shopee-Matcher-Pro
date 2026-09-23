import React from 'react';
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  Tag,
  XCircle,
  Boxes,
  Coins,
} from 'lucide-react';
import { FinalReportSummary } from '../types/reportTypes';
import { MatchStatus } from '../types/matchingTypes';
import { formatNumber } from '../utils/formatters';

interface SummaryCardsTahap3Props {
  summary: FinalReportSummary;
  selectedStatus: string;
  onSelectStatus?: (status: 'ALL' | MatchStatus) => void;
}

export const SummaryCardsTahap3: React.FC<SummaryCardsTahap3Props> = ({
  summary,
  selectedStatus,
  onSelectStatus,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
      {/* 1. Total Data Income SKU */}
      <div
        onClick={() => onSelectStatus?.('ALL')}
        className={`bg-white rounded-2xl p-4 border transition-all shadow-xs ${
          onSelectStatus ? 'cursor-pointer hover:shadow-md' : ''
        } ${
          selectedStatus === 'ALL'
            ? 'border-orange-500 ring-2 ring-orange-400/30'
            : 'border-stone-200'
        }`}
      >
        <div className="flex items-center justify-between text-stone-500 mb-2">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">
            TOTAL DATA INCOME SKU
          </span>
          <div className="w-7 h-7 rounded-lg bg-stone-100 flex items-center justify-center text-stone-600">
            <FileText className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight font-mono">
          {formatNumber(summary.totalIncomeSkuRows)}
        </div>
        <p className="text-[11px] text-stone-500 mt-1 truncate">
          Baris Income dengan <code>Lihat berdasarkan = Sku</code>
        </p>
      </div>

      {/* 2. Exact SKU */}
      <div
        onClick={() => onSelectStatus?.('EXACT_SKU')}
        className={`bg-white rounded-2xl p-4 border transition-all shadow-xs ${
          onSelectStatus ? 'cursor-pointer hover:shadow-md' : ''
        } ${
          selectedStatus === 'EXACT_SKU'
            ? 'border-emerald-500 ring-2 ring-emerald-400/30'
            : 'border-stone-200'
        }`}
      >
        <div className="flex items-center justify-between text-stone-500 mb-2">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-emerald-700">
            EXACT SKU
          </span>
          <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-xl sm:text-2xl font-black text-emerald-700 tracking-tight font-mono">
            {formatNumber(summary.exactSkuCount)}
          </span>
          <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
            {summary.exactSkuPercentage.toFixed(1)}%
          </span>
        </div>
        <p className="text-[11px] text-stone-500 mt-1 truncate">
          No. Pesanan + SKU cocok
        </p>
      </div>

      {/* 3. SKU Induk Fallback */}
      <div
        onClick={() => onSelectStatus?.('SKU_INDUK_FALLBACK')}
        className={`bg-white rounded-2xl p-4 border transition-all shadow-xs ${
          onSelectStatus ? 'cursor-pointer hover:shadow-md' : ''
        } ${
          selectedStatus === 'SKU_INDUK_FALLBACK'
            ? 'border-amber-500 ring-2 ring-amber-400/30'
            : 'border-stone-200'
        }`}
      >
        <div className="flex items-center justify-between text-stone-500 mb-2">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-amber-700">
            SKU INDUK FALLBACK
          </span>
          <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700">
            <AlertTriangle className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-xl sm:text-2xl font-black text-amber-700 tracking-tight font-mono">
            {formatNumber(summary.skuIndukFallbackCount)}
          </span>
          <span className="text-xs font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">
            {summary.skuIndukFallbackPercentage.toFixed(1)}%
          </span>
        </div>
        <p className="text-[11px] text-stone-500 mt-1 truncate">
          No. Pesanan + SKU Induk
        </p>
      </div>

      {/* 4. Nama Produk Fallback */}
      <div
        onClick={() => onSelectStatus?.('PRODUCT_NAME_FALLBACK')}
        className={`bg-white rounded-2xl p-4 border transition-all shadow-xs ${
          onSelectStatus ? 'cursor-pointer hover:shadow-md' : ''
        } ${
          selectedStatus === 'PRODUCT_NAME_FALLBACK'
            ? 'border-blue-500 ring-2 ring-blue-400/30'
            : 'border-stone-200'
        }`}
      >
        <div className="flex items-center justify-between text-stone-500 mb-2">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-blue-700">
            NAMA PRODUK FALLBACK
          </span>
          <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700">
            <Tag className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-xl sm:text-2xl font-black text-blue-700 tracking-tight font-mono">
            {formatNumber(summary.productNameFallbackCount)}
          </span>
          <span className="text-xs font-bold text-blue-800 bg-blue-100 px-1.5 py-0.5 rounded">
            {summary.productNameFallbackPercentage.toFixed(1)}%
          </span>
        </div>
        <p className="text-[11px] text-stone-500 mt-1 truncate">
          No. Pesanan + Nama Produk
        </p>
      </div>

      {/* 5. Tidak Ditemukan */}
      <div
        onClick={() => onSelectStatus?.('NOT_FOUND')}
        className={`bg-white rounded-2xl p-4 border transition-all shadow-xs ${
          onSelectStatus ? 'cursor-pointer hover:shadow-md' : ''
        } ${
          selectedStatus === 'NOT_FOUND'
            ? 'border-rose-500 ring-2 ring-rose-400/30'
            : 'border-stone-200'
        }`}
      >
        <div className="flex items-center justify-between text-stone-500 mb-2">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-rose-700">
            TIDAK DITEMUKAN
          </span>
          <div className="w-7 h-7 rounded-lg bg-rose-100 flex items-center justify-center text-rose-600">
            <XCircle className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-xl sm:text-2xl font-black text-rose-700 tracking-tight font-mono">
            {formatNumber(summary.notFoundCount)}
          </span>
          <span className="text-xs font-bold text-rose-800 bg-rose-100 px-1.5 py-0.5 rounded">
            {summary.notFoundPercentage.toFixed(1)}%
          </span>
        </div>
        <p className="text-[11px] text-stone-500 mt-1 truncate">
          Tidak ada di All Order
        </p>
      </div>

      {/* 6. Total Qty Pembelian */}
      <div className="bg-stone-900 text-white rounded-2xl p-4 border border-stone-800 shadow-md">
        <div className="flex items-center justify-between text-stone-400 mb-2">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-orange-400">
            TOTAL QTY PEMBELIAN
          </span>
          <div className="w-7 h-7 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center">
            <Boxes className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="text-xl sm:text-2xl font-black text-white tracking-tight font-mono">
          {formatNumber(summary.totalQuantityFound)}
        </div>
        <p className="text-[11px] text-stone-400 mt-1 truncate">
          Total unit barang terjual
        </p>
      </div>

      {/* 7. Total Penghasilan (Rupiah) */}
      <div className="bg-stone-900 text-white rounded-2xl p-4 border border-stone-800 shadow-md">
        <div className="flex items-center justify-between text-stone-400 mb-2">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-emerald-400">
            TOTAL PENGHASILAN
          </span>
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Coins className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="text-lg sm:text-xl font-black text-emerald-400 tracking-tight font-mono truncate" title={summary.formattedTotalIncome}>
          {summary.formattedTotalIncome}
        </div>
        <p className="text-[11px] text-stone-400 mt-1 truncate">
          Akumulasi Income Shopee
        </p>
      </div>
    </div>
  );
};
