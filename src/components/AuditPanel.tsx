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
} from 'lucide-react';
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
}

export const AuditPanel: React.FC<AuditPanelProps> = ({
  summary,
  reconciliation,
  duplicates,
  period,
}) => {
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

      {/* 3 Main Audit Cards: A. Exact SKU, B. SKU Induk Fallback, C. Tidak Ditemukan */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* A. EXACT SKU */}
        <div className="bg-white rounded-3xl p-5 border border-emerald-200 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-full blur-xl -mr-6 -mt-6 pointer-events-none" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
              KATEGORI A
            </span>
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <h4 className="font-bold text-stone-900 text-base">EXACT SKU</h4>
          <p className="text-xs text-stone-500 mt-1">
            Jumlah transaksi yang berhasil match menggunakan:
            <br />
            <code className="text-emerald-700 font-bold">No. Pesanan + Nomor Referensi SKU</code>
          </p>
          <div className="mt-4 pt-4 border-t border-stone-100 flex items-baseline justify-between">
            <span className="text-2xl font-black text-emerald-700 font-mono">
              {formatNumber(summary.exactSkuCount)}
            </span>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
              {summary.exactSkuPercentage.toFixed(1)}% dari total
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
          <h4 className="font-bold text-stone-900 text-base">SKU INDUK FALLBACK</h4>
          <p className="text-xs text-stone-500 mt-1">
            Jumlah transaksi yang hanya dapat ditemukan melalui:
            <br />
            <code className="text-amber-700 font-bold">No. Pesanan + SKU Induk</code>
          </p>
          <div className="mt-4 pt-4 border-t border-stone-100 flex items-baseline justify-between">
            <span className="text-2xl font-black text-amber-700 font-mono">
              {formatNumber(summary.skuIndukFallbackCount)}
            </span>
            <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2 py-1 rounded-md border border-amber-100">
              {summary.skuIndukFallbackPercentage.toFixed(1)}% dari total
            </span>
          </div>
        </div>

        {/* C. TIDAK DITEMUKAN */}
        <div className="bg-white rounded-3xl p-5 border border-rose-200 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50 rounded-full blur-xl -mr-6 -mt-6 pointer-events-none" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-black uppercase tracking-wider text-rose-800 bg-rose-100 px-2 py-0.5 rounded-md">
              KATEGORI C
            </span>
            <XCircle className="w-5 h-5 text-rose-600" />
          </div>
          <h4 className="font-bold text-stone-900 text-base">TIDAK DITEMUKAN</h4>
          <p className="text-xs text-stone-500 mt-1">
            Transaksi yang <code className="text-rose-700 font-bold">No. Pesanan + SKU</code> tidak ditemukan
            <strong className="block text-stone-700">DAN</strong>
            <code className="text-rose-700 font-bold">No. Pesanan + SKU Induk</code> tidak ditemukan.
          </p>
          <div className="mt-4 pt-4 border-t border-stone-100 flex items-baseline justify-between">
            <span className="text-2xl font-black text-rose-700 font-mono">
              {formatNumber(summary.notFoundCount)}
            </span>
            <span className="text-xs font-bold text-rose-800 bg-rose-50 px-2 py-1 rounded-md border border-rose-100">
              {summary.notFoundPercentage.toFixed(1)}% dari total
            </span>
          </div>
        </div>
      </div>

      {/* RECONCILIATION TABLE & MATHEMATICAL BALANCE */}
      <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-stone-200 pb-3">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-stone-500" />
            <h4 className="font-bold text-stone-900 text-sm uppercase tracking-wider">
              REKONSILIASI DATA (JUMLAH BARIS & INTEGRITAS)
            </h4>
          </div>
          <span className="text-xs font-mono text-stone-500">
            Formula: Exact ({reconciliation.exactCount}) + Fallback ({reconciliation.fallbackCount}) + Tidak Ditemukan ({reconciliation.notFoundCount}) = Total ({reconciliation.sumCategories})
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

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
          <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200">
            <span className="text-[10px] font-bold text-stone-500 block uppercase">
              TOTAL BARIS INCOME SKU
            </span>
            <span className="text-lg font-black text-stone-900 font-mono">
              {formatNumber(reconciliation.totalIncomeRows)}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200">
            <span className="text-[10px] font-bold text-stone-500 block uppercase">
              TOTAL HASIL MATCHING
            </span>
            <span className="text-lg font-black text-stone-900 font-mono">
              {formatNumber(reconciliation.totalMatchingRows)}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-200">
            <span className="text-[10px] font-bold text-emerald-800 block uppercase">
              TOTAL EXACT MATCH
            </span>
            <span className="text-lg font-black text-emerald-700 font-mono">
              {formatNumber(reconciliation.exactCount)}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-amber-50/60 border border-amber-200">
            <span className="text-[10px] font-bold text-amber-800 block uppercase">
              TOTAL FALLBACK
            </span>
            <span className="text-lg font-black text-amber-700 font-mono">
              {formatNumber(reconciliation.fallbackCount)}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-rose-50/60 border border-rose-200">
            <span className="text-[10px] font-bold text-rose-800 block uppercase">
              TOTAL TIDAK DITEMUKAN
            </span>
            <span className="text-lg font-black text-rose-700 font-mono">
              {formatNumber(reconciliation.notFoundCount)}
            </span>
          </div>
        </div>
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
              {duplicates.length}
            </strong>
          </span>
        </div>

        {duplicates.length === 0 ? (
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 text-xs text-stone-600 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>
              Tidak terdeteksi adanya kombinasi <code>No. Pesanan + SKU</code> yang berulang di dalam laporan Income.
            </span>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold">⚠ POTENSI DUPLIKAT DITEMUKAN</strong>
                  <p className="mt-0.5 leading-relaxed text-xs">
                    Terdapat kombinasi <code>No. Pesanan + SKU</code> yang muncul lebih dari satu kali pada baris Income.
                    Sesuai instruksi audit operasional, sistem <strong>TIDAK otomatis menghapus</strong> dan{' '}
                    <strong>TIDAK otomatis menggabungkan</strong> data agar integritas transaksi pembukuan tetap terjaga untuk review manual Anda.
                  </p>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-stone-200">
              <table className="min-w-full text-xs text-left divide-y divide-stone-200">
                <thead className="bg-stone-100 font-semibold text-stone-700">
                  <tr>
                    <th className="px-4 py-2.5">No.</th>
                    <th className="px-4 py-2.5">No. Pesanan</th>
                    <th className="px-4 py-2.5">SKU (ID Produk)</th>
                    <th className="px-4 py-2.5 text-center">Frekuensi Muncul</th>
                    <th className="px-4 py-2.5">Baris di Laporan</th>
                    <th className="px-4 py-2.5 text-right">Status Audit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-mono">
                  {duplicates.map((dup, idx) => (
                    <tr key={dup.key} className="hover:bg-amber-50/40">
                      <td className="px-4 py-2 text-stone-400">{idx + 1}</td>
                      <td className="px-4 py-2 font-bold text-stone-900">{dup.orderNumber}</td>
                      <td className="px-4 py-2 text-stone-800">{dup.sku}</td>
                      <td className="px-4 py-2 text-center">
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-xs">
                          {dup.count}x
                        </span>
                      </td>
                      <td className="px-4 py-2 text-stone-600 text-xs">
                        Baris: {dup.rowIndices.join(', ')}
                      </td>
                      <td className="px-4 py-2 text-right">
                        <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          ⚠ Potensi Duplikat
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
