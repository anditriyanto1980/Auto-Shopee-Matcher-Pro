import React from 'react';
import { FileSpreadsheet, ShieldCheck, Zap, FileText, CheckCircle2 } from 'lucide-react';

interface HeaderProps {
  onLoadSamples: () => void;
  hasAnyFile: boolean;
  onResetAll: () => void;
  currentStage: 'stage1' | 'stage2' | 'stage3';
  onStageChange: (stage: 'stage1' | 'stage2' | 'stage3') => void;
  hasStage2Results: boolean;
  hasStage3Results: boolean;
  isAllFilesValid: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onLoadSamples,
  hasAnyFile,
  onResetAll,
  currentStage,
  onStageChange,
  hasStage2Results,
  hasStage3Results,
  isAllFilesValid,
}) => {
  return (
    <header className="border-b border-stone-200 bg-white shadow-xs sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-orange-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20 shrink-0">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
                  SHOPEE REPORT PROCESSOR
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-stone-100 text-stone-700 border border-stone-200">
                  {currentStage === 'stage1' ? (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5 text-orange-600" />
                      TAHAP 1: VALIDASI
                    </>
                  ) : currentStage === 'stage2' ? (
                    <>
                      <Zap className="w-3.5 h-3.5 text-emerald-600" />
                      TAHAP 2: MATCHING
                    </>
                  ) : (
                    <>
                      <FileText className="w-3.5 h-3.5 text-blue-600" />
                      TAHAP 3: LAPORAN FINAL
                    </>
                  )}
                </span>
              </div>
              <p className="text-stone-500 text-xs sm:text-sm mt-0.5">
                {currentStage === 'stage1'
                  ? 'Upload 3 file Shopee untuk memvalidasi data sebelum proses matching.'
                  : currentStage === 'stage2'
                  ? 'Hasil pencocokan No. Pesanan + SKU untuk menemukan Qty Pembelian.'
                  : 'Laporan Income Shopee yang telah dilengkapi Qty Pembelian dari All Order.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto flex-wrap">
            {/* 3-Stage Stepper Navigation */}
            <div className="inline-flex rounded-xl border border-stone-300 p-1 bg-stone-100 text-xs font-medium">
              <button
                onClick={() => onStageChange('stage1')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  currentStage === 'stage1'
                    ? 'bg-white text-stone-900 font-bold shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-orange-600" />
                Tahap 1: Validasi
                {isAllFilesValid && (
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                )}
              </button>

              <button
                onClick={() => onStageChange('stage2')}
                disabled={!isAllFilesValid && !hasStage2Results}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  currentStage === 'stage2'
                    ? 'bg-white text-emerald-700 font-bold shadow-xs'
                    : !isAllFilesValid && !hasStage2Results
                    ? 'text-stone-400 cursor-not-allowed opacity-60'
                    : 'text-stone-600 hover:text-stone-900 cursor-pointer'
                }`}
                title={
                  !isAllFilesValid && !hasStage2Results
                    ? 'Unggah dan validasi 3 file di Tahap 1 terlebih dahulu'
                    : 'Buka Hasil Matching Tahap 2'
                }
              >
                <Zap className="w-3.5 h-3.5 text-emerald-600" />
                Tahap 2: Matching
                {hasStage2Results && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                )}
              </button>

              <button
                onClick={() => onStageChange('stage3')}
                disabled={!hasStage2Results}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  currentStage === 'stage3'
                    ? 'bg-white text-blue-700 font-bold shadow-xs'
                    : !hasStage2Results
                    ? 'text-stone-400 cursor-not-allowed opacity-60'
                    : 'text-stone-600 hover:text-stone-900 cursor-pointer'
                }`}
                title={
                  !hasStage2Results
                    ? 'Jalankan Tahap 2 Matching terlebih dahulu'
                    : 'Buka Laporan Final Tahap 3'
                }
              >
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                Tahap 3: Laporan
                {hasStage3Results && (
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                )}
              </button>
            </div>

            <button
              onClick={onLoadSamples}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-stone-700 bg-white hover:bg-stone-50 border border-stone-300 transition-colors shadow-2xs cursor-pointer"
              title="Muat 3 contoh file Excel Shopee siap pakai untuk pengujian"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-orange-600" />
              Gunakan File Sampel
            </button>

            {hasAnyFile && (
              <button
                onClick={onResetAll}
                className="px-2.5 py-1.5 text-xs font-medium rounded-lg text-rose-700 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
