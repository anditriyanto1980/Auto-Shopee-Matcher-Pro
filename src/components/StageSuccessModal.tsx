import React from 'react';
import {
  CheckCircle2,
  FileSpreadsheet,
  ArrowRight,
  ShieldCheck,
  X,
  Layers,
  Sparkles,
} from 'lucide-react';
import { UploadedFile } from '../types/fileTypes';
import { formatNumber, formatFileSize } from '../utils/formatters';

interface StageSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  incomeFile: UploadedFile | null;
  allOrderCurrentFile: UploadedFile | null;
  allOrderPrevFile: UploadedFile | null;
}

export const StageSuccessModal: React.FC<StageSuccessModalProps> = ({
  isOpen,
  onClose,
  incomeFile,
  allOrderCurrentFile,
  allOrderPrevFile,
}) => {
  if (!isOpen) return null;

  const files = [
    { label: 'Income Sudah Dilepas', file: incomeFile, color: 'text-orange-600 bg-orange-50' },
    { label: 'All Order Bulan Ini', file: allOrderCurrentFile, color: 'text-blue-600 bg-blue-50' },
    { label: 'All Order Bulan Sebelumnya', file: allOrderPrevFile, color: 'text-indigo-600 bg-indigo-50' },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-stone-200 w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Top Celebration Header */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-6 sm:p-8 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center mb-4 border border-white/20">
            <CheckCircle2 className="w-8 h-8 text-emerald-100" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-emerald-100 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            VALIDASI TAHAP 1 SELESAI
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            TAHAP 1 BERHASIL!
          </h2>
          <p className="text-emerald-100 text-sm mt-1">
            ✓ Semua file berhasil divalidasi. 3 file siap untuk proses matching.
          </p>
        </div>

        {/* Content body */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="rounded-2xl bg-emerald-50/80 border border-emerald-200/80 p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm text-emerald-950">
                <p className="font-bold text-emerald-900">
                  Data siap untuk Tahap 2.
                </p>
                <p className="text-emerald-800 mt-0.5">
                  Seluruh workbook, sheet, baris data, dan kolom wajib (header) telah berhasil diverifikasi tanpa kesalahan.
                </p>
              </div>
            </div>
          </div>

          {/* Files Summary Cards */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              Ringkasan File yang Divalidasi:
            </h4>

            {files.map(({ label, file, color }) => {
              if (!file) return null;
              return (
                <div
                  key={label}
                  className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${color}`}>
                      <FileSpreadsheet className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-stone-800 block">{label}</span>
                      <span className="font-mono text-stone-500 truncate max-w-[240px] block" title={file.fileName}>
                        {file.fileName}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 self-end sm:self-auto text-stone-600 font-medium">
                    <span>Sheet: <strong className="text-stone-900 font-mono">{file.activeSheetName}</strong></span>
                    <span>•</span>
                    <span><strong className="text-stone-900 font-mono">{formatNumber(file.validation?.rowCount || 0)}</strong> baris</span>
                    <span>•</span>
                    <span className="text-emerald-600 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Semua Kolom Wajib Ada
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Note about scope discipline */}
          <div className="bg-stone-50 rounded-xl p-4 border border-stone-200 text-xs text-stone-500 space-y-1">
            <p className="font-semibold text-stone-700">Catatan Batasan Tahap 1:</p>
            <p>
              Sesuai spesifikasi, pada Tahap 1 tidak dilakukan kalkulasi Qty, pencocokan nomor pesanan/SKU, settlement calculation, maupun penyimpanan permanen ke database.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-stone-100/80 border-t border-stone-200 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-colors shadow-sm cursor-pointer"
          >
            Selesai & Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
