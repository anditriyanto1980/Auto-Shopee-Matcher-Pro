import React from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  AlertOctagon,
  Layers,
  Database,
  Check,
  Tag,
  FileSpreadsheet,
} from 'lucide-react';
import { MatchedOrderItem } from '../types/matchingTypes';
import {
  AuditDuplicateItem,
  FinalReportSummary,
  ReconciliationResult,
} from '../types/reportTypes';
import { formatNumber } from '../utils/formatters';

interface AuditPanelProps {
  summary: FinalReportSummary;
  reconciliation: ReconciliationResult;
  duplicates: AuditDuplicateItem[];
  period: string;
  results?: MatchedOrderItem[];
}

export const AuditPanel: React.FC<AuditPanelProps> = ({
  summary,
  reconciliation,
  duplicates,
  period,
  results = [],
}) => {
  const prodNameFallbackItems = results.filter(
    (r) => r.matchStatus === 'PRODUCT_NAME_FALLBACK',
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-orange-600" />
            <h3 className="font-bold text-stone-900 text-lg">
              AUDIT REPORT & INTEGRITAS DATA
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Verifikasi jejak audit matematis deterministik dari hasil pencocokan Shopee periode{' '}
            <strong className="text-stone-800">{period}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border ${
              reconciliation.status === 'SUCCESS'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            {reconciliation.status === 'SUCCESS' ? (
              <>
                <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                REKONSILIASI STATUS: SEIMBANG (100%)
              </>
            ) : (
              <>
                <AlertOctagon className="w-4 h-4 text-rose-600" />
                REKONSILIASI STATUS: GAGAL
              </>
            )}
          </div>
        </div>
      </div>

      {/* 4 Main Audit Cards: A. Exact SKU, B. SKU Induk Fallback, C. Nama Produk Fallback, D. Tidak Ditemukan */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* A. EXACT SKU */}
        <div className="bg-white rounded-3xl p-5 border border-emerald-200 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-full blur-xl -mr-6 -mt-6 pointer-events-none" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
              KATEGORI A
            </span>
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <h4 className="font-bold text-stone-900 text-sm">EXACT SKU</h4>
          <p className="text-xs text-stone-500 mt-1">
            Match prioritas 1 menggunakan:
            <br />
            <code className="text-emerald-700 font-bold">No. Pesanan + Ref SKU</code>
          </p>
          <div className="mt-4 pt-4 border-t border-stone-100 flex items-baseline justify-between">
            <span className="text-2xl font-black text-emerald-700 font-mono">
              {formatNumber(summary.exactSkuCount)}
            </span>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
              {summary.exactSkuPercentage.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* B. SKU INDUK FALLBACK */}
        <div className="bg-white rounded-3xl p-5 border border-amber-200 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-full blur-xl -mr-6 -mt-6 pointer-events-none" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-black uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
              KATEGORI B
            </span>
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
          <h4 className="font-bold text-stone-900 text-sm">SKU INDUK FALLBACK</h4>
          <p className="text-xs text-stone-500 mt-1">
            Match prioritas 2 menggunakan:
            <br />
            <code className="text-amber-700 font-bold">No. Pesanan + SKU Induk</code>
          </p>
          <div className="mt-4 pt-4 border-t border-stone-100 flex items-baseline justify-between">
            <span className="text-2xl font-black text-amber-700 font-mono">
              {formatNumber(summary.skuIndukFallbackCount)}
            </span>
            <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2 py-1 rounded-md border border-amber-100">
              {summary.skuIndukFallbackPercentage.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* C. NAMA PRODUK FALLBACK */}
        <div className="bg-white rounded-3xl p-5 border border-blue-200 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-full blur-xl -mr-6 -mt-6 pointer-events-none" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-black uppercase tracking-wider text-blue-800 bg-blue-100 px-2 py-0.5 rounded-md">
              KATEGORI C
            </span>
            <Tag className="w-5 h-5 text-blue-600" />
          </div>
          <h4 className="font-bold text-stone-900 text-sm">NAMA PRODUK FALLBACK</h4>
          <p className="text-xs text-stone-500 mt-1">
            Match prioritas 3 menggunakan:
            <br />
            <code className="text-blue-700 font-bold">No. Pesanan + Nama Produk</code>
          </p>
          <div className="mt-4 pt-4 border-t border-stone-100 flex items-baseline justify-between">
            <span className="text-2xl font-black text-blue-700 font-mono">
              {formatNumber(summary.productNameFallbackCount)}
            </span>
            <span className="text-xs font-bold text-blue-800 bg-blue-50 px-2 py-1 rounded-md border border-blue-100">
              {summary.productNameFallbackPercentage.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* D. TIDAK DITEMUKAN */}
        <div className="bg-white rounded-3xl p-5 border border-rose-200 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50 rounded-full blur-xl -mr-6 -mt-6 pointer-events-none" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-black uppercase tracking-wider text-rose-800 bg-rose-100 px-2 py-0.5 rounded-md">
              KATEGORI D
            </span>
            <XCircle className="w-5 h-5 text-rose-600" />
          </div>
          <h4 className="font-bold text-stone-900 text-sm">TIDAK DITEMUKAN</h4>
          <p className="text-xs text-stone-500 mt-1">
            Tidak ditemukan pada All Order:
            <br />
            <code className="text-rose-700 font-bold">SKU / Induk / Nama kosong</code>
          </p>
          <div className="mt-4 pt-4 border-t border-stone-100 flex items-baseline justify-between">
            <span className="text-2xl font-black text-rose-700 font-mono">
              {formatNumber(summary.notFoundCount)}
            </span>
            <span className="text-xs font-bold text-rose-800 bg-rose-50 px-2 py-1 rounded-md border border-rose-100">
              {summary.notFoundPercentage.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* RECONCILIATION TABLE & MATHEMATICAL BALANCE */}
      <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-stone-200 pb-3 gap-2">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-stone-500" />
            <h4 className="font-bold text-stone-900 text-sm uppercase tracking-wider">
              REKONSILIASI DATA (JUMLAH BARIS & INTEGRITAS)
            </h4>
          </div>
          <span className="text-[11px] font-mono text-stone-500">
            Formula: Exact ({reconciliation.exactCount}) + Induk ({reconciliation.fallbackCount}) + Nama ({reconciliation.productNameFallbackCount}) + Tidak Ditemukan ({reconciliation.notFoundCount}) = Total ({reconciliation.sumCategories})
          </span>
        </div>

        {reconciliation.errorMessage ? (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm font-semibold flex items-center gap-3">
            <AlertOctagon className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{reconciliation.errorMessage}</span>
          </div>
        ) : (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-medium flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Semua baris Income terhitung seimbang dan tanpa ada baris data yang hilang.</span>
            </div>
            <span className="font-mono font-bold text-xs bg-emerald-100 px-2 py-0.5 rounded">
              VERIFIKASI LOLOS
            </span>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
          <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200">
            <span className="text-[10px] font-bold text-stone-500 block uppercase truncate">
              TOTAL BARIS INCOME
            </span>
            <span className="text-lg font-black text-stone-900 font-mono">
              {formatNumber(reconciliation.totalIncomeRows)}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200">
            <span className="text-[10px] font-bold text-stone-500 block uppercase truncate">
              TOTAL HASIL MATCHING
            </span>
            <span className="text-lg font-black text-stone-900 font-mono">
              {formatNumber(reconciliation.totalMatchingRows)}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-200">
            <span className="text-[10px] font-bold text-emerald-800 block uppercase truncate">
              EXACT MATCH
            </span>
            <span className="text-lg font-black text-emerald-700 font-mono">
              {formatNumber(reconciliation.exactCount)}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-amber-50/60 border border-amber-200">
            <span className="text-[10px] font-bold text-amber-800 block uppercase truncate">
              SKU INDUK FALLBACK
            </span>
            <span className="text-lg font-black text-amber-700 font-mono">
              {formatNumber(reconciliation.fallbackCount)}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-blue-50/60 border border-blue-200">
            <span className="text-[10px] font-bold text-blue-800 block uppercase truncate">
              NAMA PRODUK FALLBACK
            </span>
            <span className="text-lg font-black text-blue-700 font-mono">
              {formatNumber(reconciliation.productNameFallbackCount)}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-rose-50/60 border border-rose-200">
            <span className="text-[10px] font-bold text-rose-800 block uppercase truncate">
              TIDAK DITEMUKAN
            </span>
            <span className="text-lg font-black text-rose-700 font-mono">
              {formatNumber(reconciliation.notFoundCount)}
            </span>
          </div>
        </div>
      </div>

      {/* SECTION AUDIT: NAMA PRODUK FALLBACK DETAILS */}
      <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-stone-200 pb-3">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-blue-600" />
            <h4 className="font-bold text-stone-900 text-sm uppercase tracking-wider">
              AUDIT: LOG TRANSAKSI NAMA PRODUK FALLBACK
            </h4>
          </div>
          <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
            {prodNameFallbackItems.length} transaksi menggunakan Nama Produk
          </span>
        </div>

        <p className="text-xs text-stone-500">
          Daftar transaksi yang berhasil dicocokkan berdasarkan{' '}
          <strong className="text-stone-800">No. Pesanan + Nama Produk</strong> karena kolom{' '}
          <code>Nomor Referensi SKU</code> dan <code>SKU Induk</code> pada All Order kosong.
        </p>

        {prodNameFallbackItems.length > 0 ? (
          <div className="overflow-x-auto border border-stone-200 rounded-2xl max-h-72 overflow-y-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-stone-50 text-stone-600 font-bold sticky top-0 border-b border-stone-200">
                <tr>
                  <th className="px-4 py-2.5">No.</th>
                  <th className="px-4 py-2.5">No. Pesanan</th>
                  <th className="px-4 py-2.5">SKU Income</th>
                  <th className="px-4 py-2.5">Nama Produk</th>
                  <th className="px-4 py-2.5 text-center">Qty</th>
                  <th className="px-4 py-2.5">Source File</th>
                  <th className="px-4 py-2.5">Source Row</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {prodNameFallbackItems.map((item, idx) => (
                  <tr key={idx} className="hover:bg-blue-50/40">
                    <td className="px-4 py-2 text-stone-400 font-mono">{idx + 1}</td>
                    <td className="px-4 py-2 font-mono font-bold text-stone-900">
                      {item.orderNumber}
                    </td>
                    <td className="px-4 py-2 font-mono text-stone-700">
                      <span className="bg-stone-100 px-1.5 py-0.5 rounded border border-stone-200">
                        {item.incomeSku}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-stone-800 max-w-xs truncate" title={item.productName}>
                      {item.productName}
                    </td>
                    <td className="px-4 py-2 text-center font-mono font-bold text-stone-900">
                      <span className="bg-blue-50 text-blue-800 px-2 py-0.5 rounded border border-blue-200">
                        {item.quantity}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-stone-600 truncate max-w-[180px]">
                      {item.sourceFile || (item.sourceMonth === 'current' ? 'All Order Bulan Ini' : 'All Order Bulan Lalu')}
                    </td>
                    <td className="px-4 py-2 font-mono text-stone-500">
                      {item.sourceRowIndex ? `Baris ke-${item.sourceRowIndex}` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 text-center text-xs text-stone-500">
            Tidak ada transaksi yang perlu menggunakan fallback Nama Produk pada file yang dianalisis.
          </div>
        )}
      </div>

      {/* DUPLICATE CHECK SECTION */}
      <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-stone-200 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-stone-500" />
            <h4 className="font-bold text-stone-900 text-sm uppercase tracking-wider">
              DUPLICATE CHECK (PEMERIKSAAN KOMBINASI NO. PESANAN + SKU)
            </h4>
          </div>
          <span className="text-xs font-semibold text-stone-500">
            Jumlah Potensi Duplikat:{' '}
            <strong className={duplicates.length > 0 ? 'text-amber-600' : 'text-stone-800'}>
              {duplicates.length} pola kombinasi
            </strong>
          </span>
        </div>

        <p className="text-xs text-stone-500">
          Shopee Income terkadang memuat baris berulang dengan No. Pesanan dan SKU yang identik (misalnya potongan biaya parsial atau revisi penyesuaian).
          Sistem <strong className="text-stone-800">TIDAK menghapus atau menggabungkan baris data</strong> dan mempertahankan setiap baris transaksi apa adanya untuk akurasi pelaporan.
        </p>

        {duplicates.length > 0 ? (
          <div className="overflow-x-auto border border-stone-200 rounded-2xl max-h-72 overflow-y-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-stone-50 text-stone-600 font-bold sticky top-0 border-b border-stone-200">
                <tr>
                  <th className="px-4 py-2.5">No. Pesanan</th>
                  <th className="px-4 py-2.5">SKU</th>
                  <th className="px-4 py-2.5 text-center">Frekuensi Muncul</th>
                  <th className="px-4 py-2.5">Lokasi Baris Pada Laporan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {duplicates.map((dup, idx) => (
                  <tr key={idx} className="hover:bg-amber-50/50">
                    <td className="px-4 py-2 font-mono font-bold text-stone-900">
                      {dup.orderNumber}
                    </td>
                    <td className="px-4 py-2 font-mono text-stone-700">
                      {dup.sku}
                    </td>
                    <td className="px-4 py-2 text-center font-bold text-amber-700 font-mono">
                      {dup.count}x
                    </td>
                    <td className="px-4 py-2 text-stone-500 font-mono text-[11px]">
                      Baris #{dup.rowIndices.slice(0, 5).join(', #')}
                      {dup.rowIndices.length > 5 && ` (+${dup.rowIndices.length - 5} lainnya)`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 text-stone-600 text-xs flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
            <span>Nihil: Tidak ditemukan kombinasi No. Pesanan + SKU yang berulang di berkas Income.</span>
          </div>
        )}
      </div>
    </div>
  );
};
