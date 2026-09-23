import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  ShieldCheck,
  FileSpreadsheet,
} from 'lucide-react';
import { UploadedFile } from '../types/fileTypes';

interface GlobalStatusBarProps {
  incomeFile: UploadedFile | null;
  allOrderCurrentFile: UploadedFile | null;
  allOrderPrevFile: UploadedFile | null;
  onProcessStage1: () => void;
  onProcessStage2: () => void;
  hasStage2Results: boolean;
}

export const GlobalStatusBar: React.FC<GlobalStatusBarProps> = ({
  incomeFile,
  allOrderCurrentFile,
  allOrderPrevFile,
  onProcessStage1,
  onProcessStage2,
  hasStage2Results,
}) => {
  const uploadedFiles = [incomeFile, allOrderCurrentFile, allOrderPrevFile];
  const uploadedCount = uploadedFiles.filter(Boolean).length;
  const isAllUploaded = uploadedCount === 3;

  const isIncomeValid = incomeFile?.status === 'valid';
  const isOrderCurrentValid = allOrderCurrentFile?.status === 'valid';
  const isOrderPrevValid = allOrderPrevFile?.status === 'valid';

  const isAllValid = isIncomeValid && isOrderCurrentValid && isOrderPrevValid;

  // Has errors or missing columns among uploaded files
  const hasInvalidStructure =
    isAllUploaded &&
    (!isIncomeValid || !isOrderCurrentValid || !isOrderPrevValid);

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5 transition-all">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
        {/* Status Indicator Section */}
        <div className="flex items-start sm:items-center gap-4">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
              isAllValid
                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                : hasInvalidStructure
                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                : 'bg-stone-200 text-stone-600'
            }`}
          >
            {isAllValid ? (
              <CheckCircle2 className="w-7 h-7" />
            ) : hasInvalidStructure ? (
              <AlertTriangle className="w-7 h-7" />
            ) : (
              <Clock className="w-7 h-7" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
                STATUS DATA
              </span>
              <span className="text-xs font-medium text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full border border-stone-200">
                {uploadedCount} / 3 File
              </span>
            </div>

            <div className="mt-0.5">
              {!isAllUploaded ? (
                <div className="flex items-center gap-1.5 text-stone-700 font-bold text-base sm:text-lg">
                  <span className="text-amber-600">⚠ Menunggu 3 file</span>
                  <span className="text-xs font-normal text-stone-500 hidden sm:inline">
                    (Unggah ketiga laporan Shopee untuk melanjutkan)
                  </span>
                </div>
              ) : hasInvalidStructure ? (
                <div className="flex items-center gap-1.5 text-stone-900 font-bold text-base sm:text-lg">
                  <span className="text-amber-600">⚠ Struktur file belum valid</span>
                  <span className="text-xs font-normal text-stone-500 hidden sm:inline">
                    (Periksa kolom wajib pada file yang ditandai)
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-base sm:text-lg">
                  <span className="text-emerald-600">✓ 3 FILE SIAP DIPROSES</span>
                  <span className="text-xs font-normal text-emerald-600 hidden sm:inline">
                    (Semua header wajib terdeteksi dengan tepat)
                  </span>
                </div>
              )}
            </div>

            {/* Checklist of files */}
            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-stone-600">
              <span className="flex items-center gap-1">
                {isIncomeValid ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-stone-300" />
                )}
                Income dilepas
              </span>
              <span className="text-stone-300">•</span>
              <span className="flex items-center gap-1">
                {isOrderCurrentValid ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-stone-300" />
                )}
                All Order bulan ini
              </span>
              <span className="text-stone-300">•</span>
              <span className="flex items-center gap-1">
                {isOrderPrevValid ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-stone-300" />
                )}
                All Order bulan sebelumnya
              </span>
            </div>
          </div>
        </div>

        {/* Action Button Section */}
        <div className="flex flex-wrap items-center gap-2.5 self-end sm:self-auto">
          <button
            type="button"
            disabled={!isAllValid}
            onClick={onProcessStage1}
            className={`inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl font-bold text-xs sm:text-sm tracking-wide transition-all ${
              isAllValid
                ? 'bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-300 cursor-pointer shadow-xs'
                : 'bg-stone-100 text-stone-400 cursor-not-allowed border border-stone-200 shadow-none'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-stone-600" />
            [ PROSES TAHAP 1 ]
          </button>

          <button
            type="button"
            disabled={!isAllValid}
            onClick={onProcessStage2}
            className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-xs sm:text-sm tracking-wide transition-all shadow-md ${
              isAllValid
                ? 'bg-orange-500 hover:bg-orange-600 active:scale-[0.98] text-white shadow-orange-500/25 cursor-pointer ring-2 ring-orange-400/40'
                : 'bg-stone-200 text-stone-400 cursor-not-allowed border border-stone-200 shadow-none'
            }`}
          >
            <span>{hasStage2Results ? '[ LIHAT HASIL TAHAP 2 ]' : '[ PROSES TAHAP 2 ]'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
