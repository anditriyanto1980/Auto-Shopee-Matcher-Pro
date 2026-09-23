import React from 'react';
import {
  X,
  FileCheck2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Hash,
  Package,
  Layers,
  Calendar,
  FileSpreadsheet,
} from 'lucide-react';
import { MatchedOrderItem } from '../types/matchingTypes';
import { formatNumber, formatRupiah } from '../utils/formatters';

interface MatchingDetailModalProps {
  item: MatchedOrderItem | null;
  onClose: () => void;
  isDuplicate?: boolean;
}

export const MatchingDetailModal: React.FC<MatchingDetailModalProps> = ({
  item,
  onClose,
  isDuplicate = false,
}) => {
  if (!item) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-stone-200 w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                item.matchStatus === 'EXACT_SKU'
                  ? 'bg-emerald-100 text-emerald-700'
                  : item.matchStatus === 'SKU_INDUK_FALLBACK'
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-rose-100 text-rose-700'
              }`}
            >
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-stone-900 text-base">
                DETAIL MATCHING TRANSAKSI
              </h3>
              <p className="text-xs text-stone-500 font-mono">
                No. Pesanan: {item.orderNumber}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body content */}
        <div className="p-6 space-y-5 text-xs sm:text-sm">
          {/* Status Badge Banner */}
          <div
            className={`p-4 rounded-2xl border flex items-center justify-between ${
              item.matchStatus === 'EXACT_SKU'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : item.matchStatus === 'SKU_INDUK_FALLBACK'
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {item.matchStatus === 'EXACT_SKU' && (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              )}
              {item.matchStatus === 'SKU_INDUK_FALLBACK' && (
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              )}
              {item.matchStatus === 'NOT_FOUND' && (
                <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
              )}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider block opacity-75">
                  STATUS HASIL
                </span>
                <span className="font-extrabold text-sm sm:text-base">
                  {item.matchStatus === 'EXACT_SKU'
                    ? 'EXACT SKU'
                    : item.matchStatus === 'SKU_INDUK_FALLBACK'
                    ? 'SKU INDUK FALLBACK'
                    : 'TIDAK DITEMUKAN'}
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider block opacity-75">
                QTY PEMBELIAN
              </span>
              <span className="font-extrabold text-lg sm:text-xl font-mono">
                {item.quantity !== null ? formatNumber(item.quantity) : '—'}
              </span>
            </div>
          </div>

          {/* Details Table */}
          <div className="bg-stone-50 rounded-2xl border border-stone-200 divide-y divide-stone-200 overflow-hidden text-xs sm:text-sm">
            <div className="p-3.5 flex justify-between items-center">
              <span className="text-stone-500 font-medium flex items-center gap-2">
                <Hash className="w-4 h-4 text-stone-400" />
                No. Pesanan:
              </span>
              <span className="font-mono font-bold text-stone-900 select-all">
                {item.orderNumber}
              </span>
            </div>

            <div className="p-3.5 flex justify-between items-center">
              <span className="text-stone-500 font-medium flex items-center gap-2">
                <Package className="w-4 h-4 text-stone-400" />
                SKU Income (ID Produk):
              </span>
              <span className="font-mono font-bold text-stone-900 bg-white px-2 py-0.5 rounded border border-stone-200">
                {item.incomeSku}
              </span>
            </div>

            <div className="p-3.5 flex justify-between items-center">
              <span className="text-stone-500 font-medium flex items-center gap-2">
                <Layers className="w-4 h-4 text-stone-400" />
                SKU All Order:
              </span>
              <span className="font-mono font-bold text-stone-800">
                {item.allOrderSku || '—'}
              </span>
            </div>

            <div className="p-3.5 flex justify-between items-center">
              <span className="text-stone-500 font-medium flex items-center gap-2">
                <Layers className="w-4 h-4 text-stone-400" />
                SKU Induk:
              </span>
              <span className="font-mono font-bold text-stone-800">
                {item.allOrderParentSku || '—'}
              </span>
            </div>

            <div className="p-3.5 flex justify-between items-start gap-4">
              <span className="text-stone-500 font-medium">Nama Produk:</span>
              <span className="font-semibold text-stone-900 text-right max-w-[280px]">
                {item.productName || '—'}
              </span>
            </div>

            <div className="p-3.5 flex justify-between items-center">
              <span className="text-stone-500 font-medium">Total Penghasilan:</span>
              <span className="font-mono font-bold text-stone-900">
                {formatRupiah(item.totalIncome)}
              </span>
            </div>

            <div className="p-3.5 flex justify-between items-center">
              <span className="text-stone-500 font-medium flex items-center gap-2">
                <Calendar className="w-4 h-4 text-stone-400" />
                Sumber File All Order:
              </span>
              <span className="font-semibold text-stone-800 text-right">
                {item.sourceMonth === 'current'
                  ? 'All Order Bulan Ini'
                  : item.sourceMonth === 'previous'
                  ? 'All Order Bulan Sebelumnya'
                  : 'Tidak Ditemukan'}
              </span>
            </div>

            {item.sourceFile && (
              <div className="p-3.5 flex justify-between items-center">
                <span className="text-stone-500 font-medium flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-stone-400" />
                  Nama Berkas Sumber:
                </span>
                <span className="font-mono text-stone-700 text-xs truncate max-w-[260px]" title={item.sourceFile}>
                  {item.sourceFile}
                </span>
              </div>
            )}

            {item.sourceRowIndex !== undefined && (
              <div className="p-3.5 flex justify-between items-center">
                <span className="text-stone-500 font-medium flex items-center gap-2">
                  <Hash className="w-4 h-4 text-stone-400" />
                  Baris Sumber (Row Index):
                </span>
                <span className="font-mono font-bold text-stone-700 text-xs">
                  Baris ke-{item.sourceRowIndex}
                </span>
              </div>
            )}

            {isDuplicate && (
              <div className="p-3.5 bg-amber-50/80 flex items-center gap-2 text-amber-900 text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>Peringatan Audit:</strong> Kombinasi No. Pesanan dan SKU ini muncul lebih dari 1 kali di laporan Income.
                </span>
              </div>
            )}
          </div>

          {/* Contributing Order Rows if multiple */}
          {item.matchedRowsDetail.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-stone-600">
                <span>Rincian Baris Sumber All Order ({item.matchedRowsDetail.length})</span>
                <span className="text-stone-400 font-normal">Untuk verifikasi audit</span>
              </div>
              <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
                <table className="min-w-full text-xs text-left">
                  <thead className="bg-stone-100 text-stone-600 font-semibold">
                    <tr>
                      <th className="px-3 py-2">Baris #</th>
                      <th className="px-3 py-2">Nomor SKU</th>
                      <th className="px-3 py-2">SKU Induk</th>
                      <th className="px-3 py-2 text-right">Qty</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 font-mono">
                    {item.matchedRowsDetail.map((detail, idx) => (
                      <tr key={idx} className="hover:bg-stone-50">
                        <td className="px-3 py-1.5 text-stone-400">
                          {detail.sourceRowIndex}
                        </td>
                        <td className="px-3 py-1.5 text-stone-800">
                          {detail.sku || '—'}
                        </td>
                        <td className="px-3 py-1.5 text-stone-600">
                          {detail.parentSku || '—'}
                        </td>
                        <td className="px-3 py-1.5 text-right font-bold text-stone-900">
                          {detail.quantity}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-stone-50 border-t border-stone-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white font-medium text-xs sm:text-sm rounded-xl transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
