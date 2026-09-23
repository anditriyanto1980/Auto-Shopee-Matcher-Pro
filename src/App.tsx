import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  AlertCircle,
  Zap,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  RefreshCw,
  Info,
  FileText,
} from 'lucide-react';
import { FileCategory, UploadedFile } from './types/fileTypes';
import {
  processUploadedFile,
  REQUIRED_INCOME_HEADERS,
  REQUIRED_ALL_ORDER_HEADERS,
} from './utils/excelParser';
import {
  createSampleIncomeFile,
  createSampleAllOrderCurrentFile,
  createSampleAllOrderPreviousFile,
} from './utils/sampleData';
import { runMatchingEngine } from './utils/matchingEngine';
import { MatchedOrderItem, MatchingSummary, MatchStatus } from './types/matchingTypes';
import {
  computeReportSummary,
  detectDuplicates,
  performReconciliation,
  extractReportPeriod,
} from './utils/auditEngine';

import { Header } from './components/Header';
import { FileUploadCard } from './components/FileUploadCard';
import { FileInfoPanel } from './components/FileInfoPanel';
import { GlobalStatusBar } from './components/GlobalStatusBar';
import { DataPreviewModal } from './components/DataPreviewModal';
import { StageSuccessModal } from './components/StageSuccessModal';
import { MatchingSummaryCards } from './components/MatchingSummaryCards';
import { MatchingResultTable } from './components/MatchingResultTable';
import { MatchingDetailModal } from './components/MatchingDetailModal';
import { FinalReportDashboard } from './components/FinalReportDashboard';

export default function App() {
  // --- TAHAP 1 STATE ---
  const [incomeFile, setIncomeFile] = useState<UploadedFile | null>(null);
  const [allOrderCurrentFile, setAllOrderCurrentFile] = useState<UploadedFile | null>(null);
  const [allOrderPrevFile, setAllOrderPrevFile] = useState<UploadedFile | null>(null);

  const [rawFiles, setRawFiles] = useState<{
    income?: File;
    all_order_current?: File;
    all_order_previous?: File;
  }>({});

  const [previewFile, setPreviewFile] = useState<UploadedFile | null>(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [activeStage1Tab, setActiveStage1Tab] = useState<'cards' | 'details'>('cards');

  // --- STAGE NAVIGATION STATE ---
  const [currentStage, setCurrentStage] = useState<'stage1' | 'stage2' | 'stage3'>('stage1');

  // --- TAHAP 2 STATE ---
  const [stage2Results, setStage2Results] = useState<MatchedOrderItem[] | null>(null);
  const [stage2Summary, setStage2Summary] = useState<MatchingSummary | null>(null);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'ALL' | MatchStatus>('ALL');
  const [selectedDetailItem, setSelectedDetailItem] = useState<MatchedOrderItem | null>(null);
  const [isMatchingLoading, setIsMatchingLoading] = useState(false);

  // Check if all 3 files are valid
  const isIncomeValid = incomeFile?.status === 'valid';
  const isOrderCurrentValid = allOrderCurrentFile?.status === 'valid';
  const isOrderPrevValid = allOrderPrevFile?.status === 'valid';
  const isAllFilesValid = !!(isIncomeValid && isOrderCurrentValid && isOrderPrevValid);

  // --- TAHAP 3 MEMOIZED DERIVED STATES (STRICTLY FROM STAGE 2 RESULTS) ---
  const reportSummary = useMemo(() => {
    if (!stage2Results) return null;
    return computeReportSummary(stage2Results);
  }, [stage2Results]);

  const duplicateCheck = useMemo(() => {
    if (!stage2Results) {
      return { duplicates: [], duplicateKeySet: new Set<string>(), totalDuplicateRows: 0 };
    }
    return detectDuplicates(stage2Results);
  }, [stage2Results]);

  const reconciliationResult = useMemo(() => {
    if (!stage2Results) return null;
    return performReconciliation(stage2Results.length, stage2Results);
  }, [stage2Results]);

  const reportPeriod = useMemo(() => {
    return extractReportPeriod(incomeFile?.fileName, stage2Results || undefined);
  }, [incomeFile?.fileName, stage2Results]);

  // File upload handler
  const handleFileUpload = async (file: File, category: FileCategory) => {
    setRawFiles((prev) => ({ ...prev, [category]: file }));

    try {
      const parsed = await processUploadedFile(file, category);
      if (category === 'income') setIncomeFile(parsed);
      else if (category === 'all_order_current') setAllOrderCurrentFile(parsed);
      else if (category === 'all_order_previous') setAllOrderPrevFile(parsed);

      // Invalidate existing stage 2 results if a file changes
      setStage2Results(null);
      setStage2Summary(null);
    } catch (err) {
      const errorFile: UploadedFile = {
        category,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type || 'unknown',
        status: 'error',
        errorMessage: 'File gagal dibaca atau file rusak.',
        sheets: [],
        activeSheetName: '',
        validation: null,
        uploadedAt: new Date(),
      };
      if (category === 'income') setIncomeFile(errorFile);
      else if (category === 'all_order_current') setAllOrderCurrentFile(errorFile);
      else if (category === 'all_order_previous') setAllOrderPrevFile(errorFile);
    }
  };

  // Sheet change handler
  const handleSheetChange = async (sheetName: string, category: FileCategory) => {
    const rawFile = rawFiles[category];
    if (!rawFile) return;

    try {
      const parsed = await processUploadedFile(rawFile, category, sheetName);
      if (category === 'income') setIncomeFile(parsed);
      else if (category === 'all_order_current') setAllOrderCurrentFile(parsed);
      else if (category === 'all_order_previous') setAllOrderPrevFile(parsed);

      setStage2Results(null);
      setStage2Summary(null);
    } catch (err) {
      console.error('Error changing sheet:', err);
    }
  };

  // Remove file handler
  const handleRemoveFile = (category: FileCategory) => {
    setRawFiles((prev) => {
      const copy = { ...prev };
      delete copy[category];
      return copy;
    });

    if (category === 'income') setIncomeFile(null);
    else if (category === 'all_order_current') setAllOrderCurrentFile(null);
    else if (category === 'all_order_previous') setAllOrderPrevFile(null);

    setStage2Results(null);
    setStage2Summary(null);
    if (currentStage !== 'stage1') {
      setCurrentStage('stage1');
    }
  };

  // Reset all files
  const handleResetAll = () => {
    setIncomeFile(null);
    setAllOrderCurrentFile(null);
    setAllOrderPrevFile(null);
    setRawFiles({});
    setStage2Results(null);
    setStage2Summary(null);
    setCurrentStage('stage1');
  };

  // Load sample files
  const handleLoadSamples = async () => {
    const sampleIncome = createSampleIncomeFile();
    const sampleCurrent = createSampleAllOrderCurrentFile();
    const samplePrev = createSampleAllOrderPreviousFile();

    await handleFileUpload(sampleIncome, 'income');
    await handleFileUpload(sampleCurrent, 'all_order_current');
    await handleFileUpload(samplePrev, 'all_order_previous');
  };

  // Run Stage 2 Matching Engine
  const handleProcessStage2 = () => {
    if (!incomeFile || !allOrderCurrentFile || !allOrderPrevFile) return;

    setIsMatchingLoading(true);
    try {
      const { results, summary } = runMatchingEngine(
        incomeFile,
        allOrderCurrentFile,
        allOrderPrevFile,
      );
      setStage2Results(results);
      setStage2Summary(summary);
      setCurrentStage('stage2');
    } catch (err) {
      console.error('Error running matching engine:', err);
    } finally {
      setIsMatchingLoading(false);
    }
  };

  const hasAnyFile = !!(incomeFile || allOrderCurrentFile || allOrderPrevFile);

  return (
    <div className="min-h-screen bg-stone-100/70 text-stone-900 font-sans flex flex-col selection:bg-orange-200">
      {/* Navigation Header */}
      <Header
        onLoadSamples={handleLoadSamples}
        hasAnyFile={hasAnyFile}
        onResetAll={handleResetAll}
        currentStage={currentStage}
        onStageChange={(stage) => setCurrentStage(stage)}
        hasStage2Results={!!stage2Results}
        hasStage3Results={!!stage2Results}
        isAllFilesValid={isAllFilesValid}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* ========================================================= */}
        {/* TAHAP 1 VIEW: FILE UPLOAD & STRUCTURE VALIDATOR           */}
        {/* ========================================================= */}
        {currentStage === 'stage1' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* Scope Guidance Banner */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-orange-50 text-orange-600 border border-orange-100 shrink-0">
                  <Info className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-stone-900 text-sm sm:text-base">
                    Tahap 1: Validasi Kolom & Struktur File Excel
                  </h2>
                  <p className="text-xs sm:text-sm text-stone-600 mt-0.5 leading-relaxed">
                    Unggah 3 file Shopee (XLSX, XLS, atau CSV). Pastikan seluruh kolom wajib terdeteksi
                    sebelum menjalankan mesin matching Tahap 2.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
                <div className="inline-flex rounded-xl border border-stone-200 p-1 bg-stone-100 text-xs font-medium">
                  <button
                    onClick={() => setActiveStage1Tab('cards')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      activeStage1Tab === 'cards'
                        ? 'bg-white text-stone-900 shadow-xs font-semibold'
                        : 'text-stone-500 hover:text-stone-800'
                    }`}
                  >
                    Upload Cards
                  </button>
                  <button
                    onClick={() => setActiveStage1Tab('details')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      activeStage1Tab === 'details'
                        ? 'bg-white text-stone-900 shadow-xs font-semibold'
                        : 'text-stone-500 hover:text-stone-800'
                    }`}
                  >
                    File Information ({hasAnyFile ? [incomeFile, allOrderCurrentFile, allOrderPrevFile].filter(Boolean).length : 0})
                  </button>
                </div>
              </div>
            </div>

            {/* 3 Upload Cards Grid */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-stone-800 text-sm uppercase tracking-wider">
                  3 Berkas Laporan Shopee yang Dibutuhkan
                </h3>
                <span className="text-xs text-stone-500">
                  Format: <strong className="text-stone-700">.XLSX</strong>, <strong>.XLS</strong>, <strong>.CSV</strong>
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Card 1: Income Shopee Sudah Dilepas */}
                <FileUploadCard
                  category="income"
                  cardNumber={1}
                  title="INCOME SUDAH DILEPAS"
                  description="Upload laporan Income Shopee yang sudah dilepas."
                  requiredColumnsNotice={REQUIRED_INCOME_HEADERS}
                  file={incomeFile}
                  onFileUpload={handleFileUpload}
                  onRemoveFile={handleRemoveFile}
                  onPreview={(f) => setPreviewFile(f)}
                />

                {/* Card 2: All Order Bulan Ini */}
                <FileUploadCard
                  category="all_order_current"
                  cardNumber={2}
                  title="ALL ORDER BULAN INI"
                  description="Upload file All Order untuk bulan berjalan."
                  requiredColumnsNotice={REQUIRED_ALL_ORDER_HEADERS}
                  file={allOrderCurrentFile}
                  onFileUpload={handleFileUpload}
                  onRemoveFile={handleRemoveFile}
                  onPreview={(f) => setPreviewFile(f)}
                />

                {/* Card 3: All Order Bulan Sebelumnya */}
                <FileUploadCard
                  category="all_order_previous"
                  cardNumber={3}
                  title="ALL ORDER BULAN SEBELUMNYA"
                  description="Upload file All Order untuk bulan sebelumnya."
                  requiredColumnsNotice={REQUIRED_ALL_ORDER_HEADERS}
                  file={allOrderPrevFile}
                  onFileUpload={handleFileUpload}
                  onRemoveFile={handleRemoveFile}
                  onPreview={(f) => setPreviewFile(f)}
                />
              </div>
            </div>

            {/* Section 9 & 10: FILE INFORMATION PANELS */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                <div>
                  <h3 className="font-bold text-stone-900 text-base">
                    FILE INFORMATION & DETECTED COLUMNS
                  </h3>
                  <p className="text-xs text-stone-500">
                    Pemeriksaan otomatis struktur workbook, baris data, dan pencocokan kolom wajib.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FileInfoPanel
                  title="Income Sudah Dilepas"
                  categoryLabel="File 1: Income"
                  file={incomeFile}
                  onPreview={(f) => setPreviewFile(f)}
                  onSheetChange={(sheet) => handleSheetChange(sheet, 'income')}
                />
                <FileInfoPanel
                  title="All Order Bulan Ini"
                  categoryLabel="File 2: All Order Berjalan"
                  file={allOrderCurrentFile}
                  onPreview={(f) => setPreviewFile(f)}
                  onSheetChange={(sheet) => handleSheetChange(sheet, 'all_order_current')}
                />
                <FileInfoPanel
                  title="All Order Bulan Sebelumnya"
                  categoryLabel="File 3: All Order Sebelumnya"
                  file={allOrderPrevFile}
                  onPreview={(f) => setPreviewFile(f)}
                  onSheetChange={(sheet) => handleSheetChange(sheet, 'all_order_previous')}
                />
              </div>
            </div>

            {/* Global Bottom Status Bar with Process Buttons */}
            <div className="pt-2 sticky bottom-4 z-20">
              <GlobalStatusBar
                incomeFile={incomeFile}
                allOrderCurrentFile={allOrderCurrentFile}
                allOrderPrevFile={allOrderPrevFile}
                onProcessStage1={() => setIsSuccessModalOpen(true)}
                onProcessStage2={handleProcessStage2}
                hasStage2Results={!!stage2Results}
              />
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAHAP 2 VIEW: MATCHING RESULT                            */}
        {/* ========================================================= */}
        {currentStage === 'stage2' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* Top Back / Action Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-3xl border border-stone-200 shadow-xs">
              <div>
                <button
                  onClick={() => setCurrentStage('stage1')}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 mb-1 cursor-pointer transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Kembali ke Pengaturan File (Tahap 1)
                </button>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
                    MATCHING RESULT
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Pencocokan Selesai
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-stone-500 mt-1">
                  Pencarian Qty Pembelian berdasarkan No. Pesanan + SKU dari Income terhadap All Order Bulan Ini & Bulan Sebelumnya.
                </p>
              </div>

              <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
                <button
                  onClick={handleProcessStage2}
                  disabled={isMatchingLoading}
                  className="inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-white hover:bg-stone-50 text-stone-700 border border-stone-300 shadow-2xs transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isMatchingLoading ? 'animate-spin' : ''}`} />
                  Hitung Ulang Matching
                </button>

                {/* Tombol Buat Laporan Final (Tahap 3) */}
                <button
                  onClick={() => setCurrentStage('stage3')}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold rounded-xl bg-orange-500 hover:bg-orange-600 text-white shadow-md shadow-orange-500/20 active:scale-[0.98] transition-all cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  <span>BUAT LAPORAN FINAL</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Summary Cards */}
            {stage2Summary && (
              <MatchingSummaryCards
                summary={stage2Summary}
                selectedStatus={selectedStatusFilter}
                onSelectStatus={(status) => setSelectedStatusFilter(status)}
              />
            )}

            {/* Result Table */}
            {stage2Results && (
              <MatchingResultTable
                results={stage2Results}
                selectedStatus={selectedStatusFilter}
                onStatusChange={(status) => setSelectedStatusFilter(status)}
                onSelectRow={(item) => setSelectedDetailItem(item)}
              />
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAHAP 3 VIEW: FINAL REPORT + AUDIT + EXPORT EXCEL         */}
        {/* ========================================================= */}
        {currentStage === 'stage3' && stage2Results && reportSummary && reconciliationResult && (
          <FinalReportDashboard
            results={stage2Results}
            summary={reportSummary}
            reconciliation={reconciliationResult}
            duplicates={duplicateCheck.duplicates}
            duplicateKeySet={duplicateCheck.duplicateKeySet}
            period={reportPeriod}
            onBackToMatching={() => setCurrentStage('stage2')}
            onSelectRow={(item) => setSelectedDetailItem(item)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-stone-200 bg-white py-4 text-center text-xs text-stone-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Shopee Report Processor • Tahap 1: Validasi • Tahap 2: Matching Engine • Tahap 3: Final Report & Export XLSX</span>
          <span>Pemrosesan lokal deterministik • Tanpa OCR • Tanpa database eksternal</span>
        </div>
      </footer>

      {/* Data Preview Modal (Tahap 1) */}
      <DataPreviewModal
        file={previewFile}
        onClose={() => setPreviewFile(null)}
      />

      {/* Stage 1 Complete Success Modal */}
      <StageSuccessModal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        incomeFile={incomeFile}
        allOrderCurrentFile={allOrderCurrentFile}
        allOrderPrevFile={allOrderPrevFile}
      />

      {/* Detail Audit Modal (Tahap 2 & Tahap 3) */}
      <MatchingDetailModal
        item={selectedDetailItem}
        onClose={() => setSelectedDetailItem(null)}
        isDuplicate={
          selectedDetailItem
            ? duplicateCheck.duplicateKeySet.has(
                `${selectedDetailItem.orderNumber.trim().toUpperCase()}|||${selectedDetailItem.incomeSku.trim().toUpperCase()}`,
              )
            : false
        }
      />
    </div>
  );
}
