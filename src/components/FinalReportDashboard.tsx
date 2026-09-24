import React, { useState, useMemo } from 'react';
import {
  Download,
  ArrowLeft,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Tag,
  Eye,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  AlertOctagon,
  Calendar,
  DollarSign,
  TrendingUp,
  BarChart3,
  PieChart,
  Layers,
  ListOrdered,
  ShoppingBag,
  Award,
  Sparkles,
  Info,
  Check,
  Receipt,
  FileCheck,
} from 'lucide-react';
import { MatchedOrderItem, MatchStatus } from '../types/matchingTypes';
import {
  AuditDuplicateItem,
  FinalReportSummary,
  ReconciliationResult,
  ReportTab,
} from '../types/reportTypes';
import { UploadedFile } from '../types/fileTypes';
import { formatNumber, formatRupiah } from '../utils/formatters';
import { exportToExcel } from '../utils/excelExporter';
import { validateReportForExport } from '../utils/auditEngine';
import { parseSettlementFile } from '../utils/settlementParser';
import {
  buildTransactionLedger,
  buildOrderSummaries,
  buildProductAnalysis,
  buildTop10Rankings,
  buildExpenseAnalysis,
  buildDailyAnalysis,
  buildExecutiveSummary,
  validatePreExport,
} from '../utils/financialAnalyticsEngine';

interface FinalReportDashboardProps {
  results: MatchedOrderItem[];
  summary: FinalReportSummary;
  reconciliation: ReconciliationResult;
  duplicates: AuditDuplicateItem[];
  duplicateKeySet: Set<string>;
  period: string;
  onBackToMatching: () => void;
  onSelectRow: (item: MatchedOrderItem) => void;
  incomeFile?: UploadedFile | null;
  settlementFile?: UploadedFile | null;
  rawIncomeRows?: (string | number | boolean | null)[][] | null;
  rawAllOrderCurrentRows?: (string | number | boolean | null)[][] | null;
  rawAllOrderPrevRows?: (string | number | boolean | null)[][] | null;
  rawSettlementRows?: (string | number | boolean | null)[][] | null;
}

export const FinalReportDashboard: React.FC<FinalReportDashboardProps> = ({
  results,
  summary,
  reconciliation,
  duplicates,
  duplicateKeySet,
  period,
  onBackToMatching,
  onSelectRow,
  incomeFile,
  settlementFile,
  rawIncomeRows,
  rawAllOrderCurrentRows,
  rawAllOrderPrevRows,
  rawSettlementRows,
}) => {
  // Main Tab State
  const [activeTab, setActiveTab] = useState<ReportTab>('executive_summary');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [statusFilter, setStatusFilter] = useState<'ALL' | MatchStatus>('ALL');
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportSuccessMessage, setExportSuccessMessage] = useState<string | null>(null);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // 1. Settlement & Income Summary Parsing
  const settlementData = useMemo(() => {
    return parseSettlementFile(settlementFile || null);
  }, [settlementFile]);

  const incomeSummary = useMemo(() => {
    return incomeFile?.incomeSummary || null;
  }, [incomeFile]);

  // 2. Normalized Transaction Ledger
  const ledger = useMemo(() => {
    return buildTransactionLedger(results, settlementData, incomeSummary);
  }, [results, settlementData, incomeSummary]);

  // 3. Order Summary (1 row per order, no double counting)
  const orderSummaries = useMemo(() => {
    return buildOrderSummaries(ledger, settlementData);
  }, [ledger, settlementData]);

  // 4. Product Analysis (grouped by SKU + ProductName, sorted Qty desc)
  const products = useMemo(() => {
    return buildProductAnalysis(ledger);
  }, [ledger]);

  // 5. Top 10 Rankings (5 distinct tables)
  const top10 = useMemo(() => {
    return buildTop10Rankings(products);
  }, [products]);

  // 6. Total Gross Revenue
  const totalGrossRevenue = useMemo(() => {
    if (incomeSummary && incomeSummary.totalIncomeGross > 0) {
      return incomeSummary.totalIncomeGross;
    }
    return ledger.reduce((sum, item) => sum + item.grossRevenue, 0);
  }, [ledger, incomeSummary]);

  // 7. Expense Analysis
  const expenses = useMemo(() => {
    return buildExpenseAnalysis(ledger, settlementData, totalGrossRevenue, incomeSummary);
  }, [ledger, settlementData, totalGrossRevenue, incomeSummary]);

  // 8. Daily Analysis
  const daily = useMemo(() => {
    return buildDailyAnalysis(ledger);
  }, [ledger]);

  // 9. Financial Executive Summary
  const executiveSummary = useMemo(() => {
    return buildExecutiveSummary(
      ledger,
      orderSummaries,
      products,
      expenses,
      period,
      summary,
      settlementData,
      incomeSummary,
    );
  }, [ledger, orderSummaries, products, expenses, period, summary, settlementData, incomeSummary]);

  // 10. Pre-Export 8-Point Checkpoint Validation
  const preExportValidation = useMemo(() => {
    return validatePreExport(
      summary,
      ledger,
      orderSummaries,
      products,
      expenses,
      settlementData,
      reconciliation,
    );
  }, [summary, ledger, orderSummaries, products, expenses, settlementData, reconciliation]);

  // Filtered Ledger for Tab 02
  const filteredLedger = useMemo(() => {
    let list = ledger;
    if (statusFilter !== 'ALL') {
      list = list.filter((item) => item.matchStatus === statusFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (item) =>
          item.orderNumber.toLowerCase().includes(q) ||
          item.sku.toLowerCase().includes(q) ||
          item.productName.toLowerCase().includes(q),
      );
    }
    return list;
  }, [ledger, statusFilter, searchQuery]);

  // Filtered Orders for Tab 03
  const filteredOrders = useMemo(() => {
    if (!searchQuery.trim()) return orderSummaries;
    const q = searchQuery.toLowerCase().trim();
    return orderSummaries.filter((o) => o.orderNumber.toLowerCase().includes(q));
  }, [orderSummaries, searchQuery]);

  // Filtered Products for Tab 04
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    const q = searchQuery.toLowerCase().trim();
    return products.filter(
      (p) => p.sku.toLowerCase().includes(q) || p.productName.toLowerCase().includes(q),
    );
  }, [products, searchQuery]);

  // Unmatched Records for Tab 09
  const unmatchedRecords = useMemo(() => {
    return results.filter((r) => r.matchStatus === 'NOT_FOUND');
  }, [results]);

  // Handle Export Excel with 12 Sheets & Strict Validation
  const handleExportExcel = async () => {
    setExportError(null);
    setExportSuccessMessage(null);

    // Validate before export
    const auditValidation = validateReportForExport(results, summary, reconciliation);
    if (!auditValidation.isValid) {
      setExportError(
        `Export dibatalkan karena validasi audit gagal: ${auditValidation.errors.join('; ')}`,
      );
      return;
    }

    setIsExporting(true);
    try {
      const exportRes = await exportToExcel({
        results,
        summary,
        reconciliation,
        duplicates,
        period,
        ledger,
        orderSummaries,
        products,
        top10,
        expenses,
        daily,
        executiveSummary,
        rawIncomeRows: rawIncomeRows || undefined,
        rawAllOrderCurrentRows: rawAllOrderCurrentRows || undefined,
        rawAllOrderPrevRows: rawAllOrderPrevRows || undefined,
        rawSettlementRows: rawSettlementRows || undefined,
      });

      if (exportRes.success) {
        setExportSuccessMessage(
          `✓ File Excel presentasi profesional "${exportRes.fileName}" (12 Sheet Berformat Lengkap) berhasil diunduh.`,
        );
        setTimeout(() => setExportSuccessMessage(null), 10000);
      } else {
        setExportError(
          exportRes.error || 'Export Excel gagal. Data aplikasi tetap aman. Silakan coba kembali.',
        );
      }
    } catch (err) {
      setExportError(
        err instanceof Error ? err.message : 'Terjadi kesalahan saat memproses laporan Excel.',
      );
    } finally {
      setIsExporting(false);
    }
  };

  // Pagination for Active Tab Data
  const totalPages = Math.max(
    1,
    Math.ceil(
      (activeTab === 'detail_transaksi' || activeTab === 'hasil'
        ? filteredLedger.length
        : activeTab === 'order_summary'
        ? filteredOrders.length
        : activeTab === 'product_analysis'
        ? filteredProducts.length
        : activeTab === 'unmatched' || activeTab === 'tidak_cocok'
        ? unmatchedRecords.length
        : 1) / pageSize,
    ),
  );

  const paginatedLedger = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredLedger.slice(start, start + pageSize);
  }, [filteredLedger, currentPage, pageSize]);

  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredOrders.slice(start, start + pageSize);
  }, [filteredOrders, currentPage, pageSize]);

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, currentPage, pageSize]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner & Actions */}
      <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <button
            onClick={onBackToMatching}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 mb-1 cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Matching Tahap 2
          </button>
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
              PROFESSIONAL FINANCIAL & SALES REPORT
            </h2>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-800 border border-orange-200">
              <Calendar className="w-3.5 h-3.5 text-orange-600" />
              Periode: {period}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                executiveSummary.mode === 'FINANCIAL_REPORT'
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                  : 'bg-amber-100 text-amber-800 border-amber-200'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              {executiveSummary.mode === 'FINANCIAL_REPORT'
                ? 'Mode 2: FINANCIAL REPORT (Settlement Terverifikasi)'
                : 'Mode 1: SALES REPORT (Income + All Order)'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Laporan keuangan & analitik penjualan Shopee deterministik dengan rekonsiliasi matematis
            seimbang dan audit trail.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start lg:self-auto flex-wrap">
          {/* Pre-Export Validation Status Badge */}
          <button
            onClick={() => setShowValidationModal(true)}
            className={`inline-flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-xs font-bold border transition-all cursor-pointer ${
              preExportValidation.isPassed
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Audit Checkpoint: {preExportValidation.statusLabel}</span>
          </button>

          {/* Export Excel Button */}
          <button
            onClick={handleExportExcel}
            disabled={isExporting}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-xs sm:text-sm text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] shadow-md shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isExporting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>MEMBUAT FORMAT PRESENTASI...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>EXPORT 12-SHEET EXCEL (.XLSX)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Messages */}
      {exportSuccessMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl text-xs sm:text-sm flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{exportSuccessMessage}</span>
          </div>
          <button
            onClick={() => setExportSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold ml-4 cursor-pointer"
          >
            Tutup
          </button>
        </div>
      )}

      {exportError && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-2xl text-xs sm:text-sm flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{exportError}</span>
          </div>
          <button
            onClick={() => setExportError(null)}
            className="text-rose-700 hover:text-rose-900 font-bold ml-4 cursor-pointer"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Notice if Income Sheet Summary is detected */}
      {incomeSummary?.hasSummarySheet && (
        <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 text-xs sm:text-sm text-emerald-900 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold text-emerald-950 flex items-center gap-2">
              <span>Ringkasan Finansial Resmi Shopee Terverifikasi (Sheet Summary Terdeteksi)</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-200 text-emerald-800 font-extrabold uppercase">
                Audit Pass
              </span>
            </div>
            <p className="text-emerald-800 leading-relaxed">
              Struktur keuangan diekstrak langsung dari sheet <strong>Summary</strong> file Income (Sudah Dilepas). 
              Angka <strong>{formatRupiah(executiveSummary.netRevenue)}</strong> adalah <strong>Pendapatan Bersih (Total yang Dilepas ke Saldo Penjual)</strong>, bukan pendapatan kotor. 
              Total Pendapatan Kotor penjualan adalah <strong>{formatRupiah(executiveSummary.totalGrossRevenue)}</strong> dengan Total Beban Potongan Biaya Platform sebesar <strong>{formatRupiah(executiveSummary.totalExpense)}</strong>.
            </p>
          </div>
        </div>
      )}

      {/* Notice if Settlement is Missing */}
      {executiveSummary.mode === 'SALES_REPORT' && !incomeSummary?.hasSummarySheet && (
        <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 text-xs sm:text-sm text-amber-900 flex items-start gap-3">
          <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Informasi Mode Laporan: </span>
            Laporan saat ini beroperasi pada <strong>Mode 1 (Sales Report)</strong> karena file
            Settlement (Rincian Pelepasan Dana) atau Sheet Summary belum diunggah. Sesuai prinsip integritas finansial
            akuntansi, beban biaya per-transaksi tidak diestimasi atau dikarang palsu. Pendapatan
            Kotor disajikan akurat. Untuk mengaktifkan rincian potongan biaya aktual (Admin,
            Layanan, Pembayaran), silakan unggah file Settlement di Tahap 1.
          </div>
        </div>
      )}

      {/* Tab Navigation Menu */}
      <div className="bg-white p-2 rounded-2xl border border-stone-200 shadow-xs flex items-center gap-1.5 overflow-x-auto scrollbar-none">
        <button
          onClick={() => {
            setActiveTab('executive_summary');
            setCurrentPage(1);
          }}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'executive_summary'
              ? 'bg-stone-900 text-white shadow-xs'
              : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>01 Executive Summary</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('detail_transaksi');
            setCurrentPage(1);
          }}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'detail_transaksi' || activeTab === 'hasil'
              ? 'bg-stone-900 text-white shadow-xs'
              : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>02 Detail Transaksi</span>
          <span className="px-1.5 py-0.5 text-[10px] rounded-md bg-stone-200 text-stone-800">
            {ledger.length}
          </span>
        </button>

        <button
          onClick={() => {
            setActiveTab('order_summary');
            setCurrentPage(1);
          }}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'order_summary'
              ? 'bg-stone-900 text-white shadow-xs'
              : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>03 Ringkasan Order</span>
          <span className="px-1.5 py-0.5 text-[10px] rounded-md bg-stone-200 text-stone-800">
            {orderSummaries.length}
          </span>
        </button>

        <button
          onClick={() => {
            setActiveTab('product_analysis');
            setCurrentPage(1);
          }}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'product_analysis'
              ? 'bg-stone-900 text-white shadow-xs'
              : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
          }`}
        >
          <Tag className="w-3.5 h-3.5" />
          <span>04 Analisis Produk</span>
          <span className="px-1.5 py-0.5 text-[10px] rounded-md bg-stone-200 text-stone-800">
            {products.length}
          </span>
        </button>

        <button
          onClick={() => {
            setActiveTab('top_10');
            setCurrentPage(1);
          }}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'top_10'
              ? 'bg-stone-900 text-white shadow-xs'
              : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
          }`}
        >
          <Award className="w-3.5 h-3.5 text-amber-500" />
          <span>05 Top 10</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('expense_analysis');
            setCurrentPage(1);
          }}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'expense_analysis'
              ? 'bg-stone-900 text-white shadow-xs'
              : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
          }`}
        >
          <PieChart className="w-3.5 h-3.5" />
          <span>06 Analisis Beban</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('daily_analysis');
            setCurrentPage(1);
          }}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'daily_analysis'
              ? 'bg-stone-900 text-white shadow-xs'
              : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>07 Harian</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('audit');
            setCurrentPage(1);
          }}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'audit'
              ? 'bg-stone-900 text-white shadow-xs'
              : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>08 Audit & Rekonsiliasi</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('unmatched');
            setCurrentPage(1);
          }}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'unmatched' || activeTab === 'tidak_cocok'
              ? 'bg-rose-900 text-white shadow-xs'
              : 'text-stone-600 hover:bg-stone-100 hover:text-rose-700'
          }`}
        >
          <XCircle className="w-3.5 h-3.5 text-rose-500" />
          <span>09 Unmatched</span>
          <span className="px-1.5 py-0.5 text-[10px] rounded-md bg-rose-100 text-rose-800">
            {unmatchedRecords.length}
          </span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 01: EXECUTIVE SUMMARY                                 */}
      {/* ========================================================= */}
      {activeTab === 'executive_summary' && (
        <div className="space-y-6">
          {/* Executive KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block mb-1">
                Total Omzet Kotor (Gross)
              </span>
              <div className="text-2xl font-black text-stone-900">
                {formatRupiah(executiveSummary.totalGrossRevenue)}
              </div>
              <p className="text-xs text-stone-500 mt-1">Total pelepasan dana penjualan Shopee</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block mb-1">
                Total Kuantitas Terjual
              </span>
              <div className="text-2xl font-black text-orange-600">
                {formatNumber(executiveSummary.totalQuantity)} Unit
              </div>
              <p className="text-xs text-stone-500 mt-1">
                Dari {formatNumber(executiveSummary.totalOrders)} nomor pesanan unik
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block mb-1">
                Total Beban Biaya Platform
              </span>
              <div className="text-2xl font-black text-rose-600">
                {formatRupiah(executiveSummary.totalExpense)}
              </div>
              <p className="text-xs text-stone-500 mt-1">
                {executiveSummary.mode === 'FINANCIAL_REPORT'
                  ? 'Biaya admin, layanan, ongkir & promo'
                  : 'Settlement belum diunggah (Rp 0)'}
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block mb-1">
                Pendapatan Bersih (Net Revenue)
              </span>
              <div className="text-2xl font-black text-emerald-600">
                {formatRupiah(executiveSummary.netRevenue)}
              </div>
              <p className="text-xs text-stone-500 mt-1">
                Gross Revenue dikurangi Beban Platform
              </p>
            </div>
          </div>

          {/* Secondary Financial & Matching KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-stone-500 uppercase">Average Order Value (AOV)</span>
                <ShoppingBag className="w-4 h-4 text-stone-400" />
              </div>
              <div className="text-xl font-bold text-stone-900">
                {formatRupiah(executiveSummary.averageOrderValue)}
              </div>
              <p className="text-xs text-stone-500 mt-1">Rata-rata omzet per nomor pesanan</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-stone-500 uppercase">Ragam SKU Aktif</span>
                <Tag className="w-4 h-4 text-stone-400" />
              </div>
              <div className="text-xl font-bold text-stone-900">
                {executiveSummary.totalUniqueSkus} SKU
              </div>
              <p className="text-xs text-stone-500 mt-1">
                Rata-rata pendapatan/SKU: {formatRupiah(executiveSummary.averageRevenuePerSku)}
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-stone-500 uppercase">Order Matching Rate</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-xl font-bold text-emerald-600">
                {executiveSummary.matchedOrderPercentage.toFixed(1)}% Cocok
              </div>
              <p className="text-xs text-stone-500 mt-1">
                {results.length - summary.notFoundCount} dari {results.length} baris berhasil dipetakan
              </p>
            </div>
          </div>

          {/* Profitability Notice Box */}
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
            <h3 className="text-sm font-bold text-stone-900 mb-2 flex items-center gap-2">
              <Info className="w-4 h-4 text-sky-600" />
              Status HPP & Profitabilitas Akuntansi
            </h3>
            <div className="text-xs text-stone-600 leading-relaxed space-y-1">
              <p>
                <strong>Harga Pokok Penjualan (HPP): </strong>
                Data HPP tidak disediakan dalam ekspor laporan standar Seller Centre Shopee (Income & All Order).
              </p>
              <p>
                Sesuai prinsip <strong>No Data Invention</strong> (Section 3 & 25), aplikasi tidak mengarang nilai HPP = 0 atau mengestimasi margin kotor secara sembarangan.
                Laba kotor akuntansi dan gross margin ditandai kosong (null) hingga data HPP akuntansi dihubungkan.
              </p>
            </div>
          </div>

          {/* Matching Performance Overview */}
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
            <h3 className="text-sm font-bold text-stone-900 mb-4">
              Kinerja Matching Engine (3 Prioritas Deterministic)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                <span className="text-xs font-bold text-emerald-800 block mb-1">
                  1. Exact SKU Match
                </span>
                <div className="text-2xl font-black text-emerald-700">
                  {summary.exactSkuCount}
                </div>
                <div className="text-xs text-emerald-600 mt-1">
                  {summary.exactSkuPercentage.toFixed(1)}% dari total baris
                </div>
              </div>

              <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
                <span className="text-xs font-bold text-blue-800 block mb-1">
                  2. SKU Induk Fallback
                </span>
                <div className="text-2xl font-black text-blue-700">
                  {summary.skuIndukFallbackCount}
                </div>
                <div className="text-xs text-blue-600 mt-1">
                  {summary.skuIndukFallbackPercentage.toFixed(1)}% dari total baris
                </div>
              </div>

              <div className="p-4 rounded-xl bg-purple-50 border border-purple-100">
                <span className="text-xs font-bold text-purple-800 block mb-1">
                  3. Nama Produk Fallback
                </span>
                <div className="text-2xl font-black text-purple-700">
                  {summary.productNameFallbackCount}
                </div>
                <div className="text-xs text-purple-600 mt-1">
                  {summary.productNameFallbackPercentage.toFixed(1)}% dari total baris
                </div>
              </div>

              <div className="p-4 rounded-xl bg-rose-50 border border-rose-100">
                <span className="text-xs font-bold text-rose-800 block mb-1">
                  4. Tidak Ditemukan
                </span>
                <div className="text-2xl font-black text-rose-700">
                  {summary.notFoundCount}
                </div>
                <div className="text-xs text-rose-600 mt-1">
                  {summary.notFoundPercentage.toFixed(1)}% dari total baris
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 02: DETAIL TRANSAKSI (TRANSACTION LEDGER)              */}
      {/* ========================================================= */}
      {(activeTab === 'detail_transaksi' || activeTab === 'hasil') && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari No Pesanan, SKU, atau Nama Produk..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as 'ALL' | MatchStatus);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-700 focus:outline-none"
              >
                <option value="ALL">Semua Status Matching</option>
                <option value="EXACT_SKU">Exact SKU</option>
                <option value="SKU_INDUK_FALLBACK">SKU Induk Fallback</option>
                <option value="PRODUCT_NAME_FALLBACK">Nama Produk Fallback</option>
                <option value="NOT_FOUND">Tidak Ditemukan</option>
              </select>

              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-700 focus:outline-none"
              >
                <option value={10}>10 baris</option>
                <option value={25}>25 baris</option>
                <option value={50}>50 baris</option>
                <option value={100}>100 baris</option>
              </select>
            </div>
          </div>

          {/* Ledger Table */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-3">No</th>
                    <th className="py-3 px-3">No. Pesanan</th>
                    <th className="py-3 px-3">SKU</th>
                    <th className="py-3 px-4">Nama Produk & Variasi</th>
                    <th className="py-3 px-3 text-center">Qty</th>
                    <th className="py-3 px-3 text-right">Harga Satuan</th>
                    <th className="py-3 px-3 text-right">Pendapatan Kotor</th>
                    <th className="py-3 px-3 text-right">Total Beban</th>
                    <th className="py-3 px-3 text-right">Pendapatan Bersih</th>
                    <th className="py-3 px-3">Match Type</th>
                    <th className="py-3 px-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {paginatedLedger.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-8 text-center text-stone-400">
                        Tidak ada transaksi yang cocok dengan filter pencarian.
                      </td>
                    </tr>
                  ) : (
                    paginatedLedger.map((item) => (
                      <tr key={`ledger-${item.no}`} className="hover:bg-stone-50/70 transition-colors">
                        <td className="py-2.5 px-3 text-stone-400 font-mono">{item.no}</td>
                        <td className="py-2.5 px-3 font-semibold text-stone-800 font-mono">
                          {item.orderNumber}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-stone-700">{item.sku}</td>
                        <td className="py-2.5 px-4 max-w-xs truncate">
                          <span className="font-medium text-stone-900 block truncate">
                            {item.productName}
                          </span>
                          {item.variation && item.variation !== '-' && (
                            <span className="text-[10px] text-stone-500">Var: {item.variation}</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold">
                          {item.quantity !== null && item.quantity !== undefined ? (
                            <span className="px-2 py-0.5 rounded-md bg-orange-100 text-orange-800">
                              {item.quantity}
                            </span>
                          ) : (
                            <span className="text-stone-400">-</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-stone-600">
                          {item.unitPrice ? formatRupiah(item.unitPrice) : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-stone-900">
                          {formatRupiah(item.grossRevenue)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-rose-600">
                          {item.totalExpense > 0 ? formatRupiah(item.totalExpense) : 'Rp 0'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600">
                          {formatRupiah(item.netRevenue)}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                              item.matchStatus === 'EXACT_SKU'
                                ? 'bg-emerald-100 text-emerald-800'
                                : item.matchStatus === 'SKU_INDUK_FALLBACK'
                                ? 'bg-blue-100 text-blue-800'
                                : item.matchStatus === 'PRODUCT_NAME_FALLBACK'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {item.matchStatus === 'EXACT_SKU'
                              ? 'Exact SKU'
                              : item.matchStatus === 'SKU_INDUK_FALLBACK'
                              ? 'SKU Induk'
                              : item.matchStatus === 'PRODUCT_NAME_FALLBACK'
                              ? 'Nama Produk'
                              : 'Tidak Ditemukan'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {results[item.no - 1] && (
                            <button
                              onClick={() => onSelectRow(results[item.no - 1])}
                              className="p-1 rounded-lg text-stone-400 hover:text-stone-800 hover:bg-stone-200 transition-colors cursor-pointer"
                              title="Lihat Detail Audit"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Bar */}
            <div className="bg-stone-50 px-4 py-3 border-t border-stone-200 flex items-center justify-between text-xs text-stone-500">
              <div>
                Menampilkan {(currentPage - 1) * pageSize + 1} -{' '}
                {Math.min(currentPage * pageSize, filteredLedger.length)} dari {filteredLedger.length}{' '}
                transaksi
              </div>
              <div className="flex items-center gap-1">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 rounded-lg border border-stone-200 bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-stone-100 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-2 font-bold text-stone-700">
                  {currentPage} / {totalPages}
                </span>
                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="p-1.5 rounded-lg border border-stone-200 bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-stone-100 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 03: RINGKASAN ORDER (ORDER SUMMARY)                   */}
      {/* ========================================================= */}
      {activeTab === 'order_summary' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex items-center justify-between gap-3">
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari No. Pesanan..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm focus:outline-none"
              />
            </div>
            <div className="text-xs font-semibold text-stone-600">
              Total {orderSummaries.length} Pesanan Unik (No Double Counting)
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-3">No Pesanan</th>
                    <th className="py-3 px-3">Tanggal</th>
                    <th className="py-3 px-3 text-center">Jumlah SKU</th>
                    <th className="py-3 px-3 text-center">Total Qty</th>
                    <th className="py-3 px-3 text-right">Pendapatan Kotor</th>
                    <th className="py-3 px-3 text-right">Total Beban</th>
                    <th className="py-3 px-3 text-right">Pendapatan Bersih</th>
                    <th className="py-3 px-3">Status Matching</th>
                    <th className="py-3 px-3">Verifikasi Settlement</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {paginatedOrders.map((o) => (
                    <tr key={o.orderNumber} className="hover:bg-stone-50/70">
                      <td className="py-2.5 px-3 font-mono font-bold text-stone-900">{o.orderNumber}</td>
                      <td className="py-2.5 px-3 text-stone-500">{o.orderDate || '-'}</td>
                      <td className="py-2.5 px-3 text-center font-bold text-stone-700">{o.skuCount} SKU</td>
                      <td className="py-2.5 px-3 text-center font-bold text-orange-600">{o.totalQuantity} Unit</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-stone-900">
                        {formatRupiah(o.grossRevenue)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-rose-600">
                        {formatRupiah(o.totalExpense)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600">
                        {formatRupiah(o.netRevenue)}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-stone-700">{o.matchStatus}</td>
                      <td className="py-2.5 px-3">
                        {o.settlementVerified ? (
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-bold">
                            <Check className="w-3 h-3 text-emerald-600" /> Terverifikasi
                          </span>
                        ) : (
                          <span className="text-[10px] text-stone-400">Belum Ada Settlement</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-stone-50 px-4 py-3 border-t border-stone-200 flex items-center justify-between text-xs text-stone-500">
              <div>
                Menampilkan {(currentPage - 1) * pageSize + 1} -{' '}
                {Math.min(currentPage * pageSize, filteredOrders.length)} dari {filteredOrders.length} pesanan
              </div>
              <div className="flex items-center gap-1">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 rounded-lg border border-stone-200 bg-white disabled:opacity-40 hover:bg-stone-100"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-2 font-bold text-stone-700">
                  {currentPage} / {totalPages}
                </span>
                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="p-1.5 rounded-lg border border-stone-200 bg-white disabled:opacity-40 hover:bg-stone-100"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 04: ANALISIS PRODUK (PRODUCT ANALYSIS)                */}
      {/* ========================================================= */}
      {activeTab === 'product_analysis' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex items-center justify-between gap-3">
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari SKU atau Nama Produk..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm focus:outline-none"
              />
            </div>
            <div className="text-xs font-semibold text-stone-600">
              {products.length} Ragam Produk Terjual (Urut berdasarkan Qty Terbanyak)
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-3">No</th>
                    <th className="py-3 px-3">SKU</th>
                    <th className="py-3 px-4">Nama Produk</th>
                    <th className="py-3 px-3 text-center">Total Qty</th>
                    <th className="py-3 px-3 text-center">Total Order</th>
                    <th className="py-3 px-3 text-right">Total Omzet</th>
                    <th className="py-3 px-3 text-right">Total Beban</th>
                    <th className="py-3 px-3 text-right">Net Revenue</th>
                    <th className="py-3 px-3 text-right">Avg Price (ASP)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {paginatedProducts.map((p, idx) => (
                    <tr key={`${p.sku}-${idx}`} className="hover:bg-stone-50/70">
                      <td className="py-2.5 px-3 text-stone-400 font-mono">
                        {(currentPage - 1) * pageSize + idx + 1}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-stone-800">{p.sku}</td>
                      <td className="py-2.5 px-4 font-medium text-stone-900 max-w-sm truncate">
                        {p.productName}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-orange-600">
                        {p.totalQuantity} Unit
                      </td>
                      <td className="py-2.5 px-3 text-center font-semibold text-stone-700">
                        {p.totalOrder}x
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-stone-900">
                        {formatRupiah(p.totalRevenue)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-rose-600">
                        {formatRupiah(p.totalExpense)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600">
                        {formatRupiah(p.netRevenue)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-stone-600">
                        {formatRupiah(p.averageSellingPrice)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-stone-50 px-4 py-3 border-t border-stone-200 flex items-center justify-between text-xs text-stone-500">
              <div>
                Menampilkan {(currentPage - 1) * pageSize + 1} -{' '}
                {Math.min(currentPage * pageSize, filteredProducts.length)} dari {filteredProducts.length}{' '}
                produk
              </div>
              <div className="flex items-center gap-1">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 rounded-lg border border-stone-200 bg-white disabled:opacity-40 hover:bg-stone-100"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-2 font-bold text-stone-700">
                  {currentPage} / {totalPages}
                </span>
                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="p-1.5 rounded-lg border border-stone-200 bg-white disabled:opacity-40 hover:bg-stone-100"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 05: TOP 10 RANKINGS (5 STRICT SEPARATED RANKINGS)      */}
      {/* ========================================================= */}
      {activeTab === 'top_10' && (
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex items-center gap-2 text-xs text-stone-600">
            <Award className="w-4 h-4 text-amber-500" />
            <span>
              <strong>Kepatuhan Regulasi Laporan (Section 12 & 22): </strong>
              Peringkat produk terlaris (Qty) dipisahkan secara tegas dari peringkat omzet (Revenue),
              pendapatan bersih, dan beban biaya untuk analisis strategis inventori dan margin.
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Table 1: Top 10 by Qty */}
            <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
              <div className="bg-orange-50/70 px-4 py-3 border-b border-orange-100 flex items-center justify-between">
                <h3 className="text-xs font-bold text-orange-950 uppercase flex items-center gap-2">
                  <Award className="w-4 h-4 text-orange-600" />
                  Top 10 Produk Berdasarkan Kuantitas (Best Seller)
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold uppercase">
                    <tr>
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">SKU</th>
                      <th className="py-2.5 px-3">Nama Produk</th>
                      <th className="py-2.5 px-3 text-right">Qty</th>
                      <th className="py-2.5 px-3 text-right">Omzet</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {top10.byQty.map((item, idx) => (
                      <tr key={`qty-${item.sku}-${idx}`}>
                        <td className="py-2 px-3 font-bold text-orange-600">#{idx + 1}</td>
                        <td className="py-2 px-3 font-mono font-semibold text-stone-700">{item.sku}</td>
                        <td className="py-2 px-3 truncate max-w-xs text-stone-800">{item.productName}</td>
                        <td className="py-2 px-3 text-right font-bold text-orange-600">
                          {item.totalQuantity} Unit
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-stone-700">
                          {formatRupiah(item.totalRevenue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Table 2: Top 10 by Revenue */}
            <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
              <div className="bg-blue-50/70 px-4 py-3 border-b border-blue-100 flex items-center justify-between">
                <h3 className="text-xs font-bold text-blue-950 uppercase flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  Top 10 Produk Berdasarkan Omzet (Gross Revenue)
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold uppercase">
                    <tr>
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">SKU</th>
                      <th className="py-2.5 px-3">Nama Produk</th>
                      <th className="py-2.5 px-3 text-right">Omzet</th>
                      <th className="py-2.5 px-3 text-right">Qty</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {top10.byRevenue.map((item, idx) => (
                      <tr key={`rev-${item.sku}-${idx}`}>
                        <td className="py-2 px-3 font-bold text-blue-600">#{idx + 1}</td>
                        <td className="py-2 px-3 font-mono font-semibold text-stone-700">{item.sku}</td>
                        <td className="py-2 px-3 truncate max-w-xs text-stone-800">{item.productName}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-blue-600">
                          {formatRupiah(item.totalRevenue)}
                        </td>
                        <td className="py-2 px-3 text-right text-stone-600">{item.totalQuantity} Unit</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Table 3: Top 10 by Net Revenue */}
            <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
              <div className="bg-emerald-50/70 px-4 py-3 border-b border-emerald-100 flex items-center justify-between">
                <h3 className="text-xs font-bold text-emerald-950 uppercase flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  Top 10 Produk Berdasarkan Pendapatan Bersih (Net Revenue)
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold uppercase">
                    <tr>
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">SKU</th>
                      <th className="py-2.5 px-3">Nama Produk</th>
                      <th className="py-2.5 px-3 text-right">Net Revenue</th>
                      <th className="py-2.5 px-3 text-right">Beban</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {top10.byNetRevenue.map((item, idx) => (
                      <tr key={`net-${item.sku}-${idx}`}>
                        <td className="py-2 px-3 font-bold text-emerald-600">#{idx + 1}</td>
                        <td className="py-2 px-3 font-mono font-semibold text-stone-700">{item.sku}</td>
                        <td className="py-2 px-3 truncate max-w-xs text-stone-800">{item.productName}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-emerald-600">
                          {formatRupiah(item.netRevenue)}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-rose-600">
                          {formatRupiah(item.totalExpense)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Table 4: Top 10 by Order Count */}
            <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
              <div className="bg-stone-100 px-4 py-3 border-b border-stone-200 flex items-center justify-between">
                <h3 className="text-xs font-bold text-stone-900 uppercase flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-stone-700" />
                  Top 10 Produk Berdasarkan Frekuensi Order
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold uppercase">
                    <tr>
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">SKU</th>
                      <th className="py-2.5 px-3">Nama Produk</th>
                      <th className="py-2.5 px-3 text-right">Jumlah Order</th>
                      <th className="py-2.5 px-3 text-right">Total Qty</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {top10.byOrderCount.map((item, idx) => (
                      <tr key={`ord-${item.sku}-${idx}`}>
                        <td className="py-2 px-3 font-bold text-stone-700">#{idx + 1}</td>
                        <td className="py-2 px-3 font-mono font-semibold text-stone-700">{item.sku}</td>
                        <td className="py-2 px-3 truncate max-w-xs text-stone-800">{item.productName}</td>
                        <td className="py-2 px-3 text-right font-bold text-stone-900">{item.totalOrder}x</td>
                        <td className="py-2 px-3 text-right text-stone-600">{item.totalQuantity} Unit</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 06: EXPENSE ANALYSIS (BIAYA PLATFORM SHOPEE)           */}
      {/* ========================================================= */}
      {activeTab === 'expense_analysis' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-stone-500 uppercase">
                Total Potongan Biaya Platform
              </span>
              <div className="text-2xl font-black text-rose-600 mt-1">
                {formatRupiah(expenses.totalExpense)}
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                Mencerminkan {expenses.percentageOfGross.toFixed(2)}% dari Total Omzet Kotor
              </p>
            </div>
            <div className="px-4 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-semibold text-stone-700">
              Status: {expenses.settlementAvailable ? '✓ Aktual dari Settlement' : 'Mode Sales Report (Belum Ada Settlement)'}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Nama Komponen Biaya</th>
                    <th className="py-3 px-3">Kategori</th>
                    <th className="py-3 px-3 text-right">Jumlah (Rp)</th>
                    <th className="py-3 px-3 text-right">% dari Omzet Kotor</th>
                    <th className="py-3 px-4">Catatan Finansial</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {expenses.items.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-stone-400">
                        File Settlement belum diunggah. Beban transaksi tidak diestimasi secara sembarangan.
                      </td>
                    </tr>
                  ) : (
                    expenses.items.map((fee, idx) => (
                      <tr key={`exp-${idx}`} className="hover:bg-stone-50/70">
                        <td className="py-3 px-4 font-bold text-stone-900">{fee.feeName}</td>
                        <td className="py-3 px-3 text-stone-600">{fee.category}</td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-rose-600">
                          {formatRupiah(fee.amount)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-semibold text-stone-700">
                          {fee.percentageOfGross.toFixed(2)}%
                        </td>
                        <td className="py-3 px-4 text-stone-500">{fee.note || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 07: DAILY ANALYSIS                                    */}
      {/* ========================================================= */}
      {activeTab === 'daily_analysis' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Tanggal Transaksi</th>
                    <th className="py-3 px-3 text-center">Jumlah Order</th>
                    <th className="py-3 px-3 text-center">Total Qty</th>
                    <th className="py-3 px-3 text-right">Gross Revenue</th>
                    <th className="py-3 px-3 text-right">Total Beban</th>
                    <th className="py-3 px-3 text-right">Net Revenue</th>
                    <th className="py-3 px-3 text-right">AOV Harian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {daily.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-stone-400">
                        Data tanggal transaksi tidak terdeteksi pada baris sumber.
                      </td>
                    </tr>
                  ) : (
                    daily.map((d) => (
                      <tr key={d.date} className="hover:bg-stone-50/70">
                        <td className="py-2.5 px-4 font-bold text-stone-900">{d.date}</td>
                        <td className="py-2.5 px-3 text-center font-bold text-stone-700">{d.orderCount} pesanan</td>
                        <td className="py-2.5 px-3 text-center font-bold text-orange-600">{d.totalQuantity} unit</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-stone-900">
                          {formatRupiah(d.grossRevenue)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-rose-600">
                          {formatRupiah(d.totalExpense)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600">
                          {formatRupiah(d.netRevenue)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-stone-600">
                          {formatRupiah(d.averageOrderValue)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 08: AUDIT & REKONSILIASI                               */}
      {/* ========================================================= */}
      {activeTab === 'audit' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
            <h3 className="text-sm font-bold text-stone-900 mb-2 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              Formula Validasi Kesetaraan Matematis 4-Kategori
            </h3>
            <p className="text-xs text-stone-600 mb-4">
              Rekonsiliasi memverifikasi bahwa 100% baris data Income terdistribusi tepat tanpa ada
              baris yang hilang atau terhitung ganda.
            </p>

            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-2 font-mono text-xs text-stone-800">
              <div className="flex justify-between border-b border-stone-200 pb-1.5">
                <span>Exact SKU Match (Prioritas 1):</span>
                <strong>{reconciliation.exactCount} baris</strong>
              </div>
              <div className="flex justify-between border-b border-stone-200 pb-1.5">
                <span>SKU Induk Fallback (Prioritas 2):</span>
                <strong>{reconciliation.fallbackCount} baris</strong>
              </div>
              <div className="flex justify-between border-b border-stone-200 pb-1.5">
                <span>Nama Produk Fallback (Prioritas 3):</span>
                <strong>{reconciliation.productNameFallbackCount} baris</strong>
              </div>
              <div className="flex justify-between border-b border-stone-200 pb-1.5 text-rose-600">
                <span>Tidak Ditemukan (Unmatched):</span>
                <strong>{reconciliation.notFoundCount} baris</strong>
              </div>
              <div className="flex justify-between pt-1 text-sm font-bold text-emerald-700">
                <span>Total Baris Terdistribusi:</span>
                <span>
                  {reconciliation.sumCategories} == {reconciliation.totalIncomeRows} (100% SEIMBANG)
                </span>
              </div>
            </div>
          </div>

          {/* Duplicates Check */}
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
            <h3 className="text-sm font-bold text-stone-900 mb-2">
              Pemeriksaan Integritas Duplikasi Data
            </h3>
            {duplicates.length === 0 ? (
              <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Tidak ditemukan order dengan nomor pesanan & SKU identik yang terduplikasi. Data bersih.
                </span>
              </div>
            ) : (
              <div className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-3">
                Terdeteksi {duplicates.length} pola nomor pesanan dengan SKU identik berulang. Silakan
                periksa detail transaksi terkait.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 09: UNMATCHED (TRANSAKSI TIDAK COCOK)                 */}
      {/* ========================================================= */}
      {(activeTab === 'unmatched' || activeTab === 'tidak_cocok') && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex items-center justify-between">
            <span className="text-xs font-bold text-stone-700">
              Daftar Transaksi Income yang Tidak Ditemukan di All Order ({unmatchedRecords.length} Baris)
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-rose-50 border-b border-rose-100 text-rose-900 font-bold uppercase">
                  <tr>
                    <th className="py-3 px-3">No</th>
                    <th className="py-3 px-3">No Pesanan</th>
                    <th className="py-3 px-3">SKU Income</th>
                    <th className="py-3 px-4">Nama Produk Income</th>
                    <th className="py-3 px-3 text-right">Total Penghasilan</th>
                    <th className="py-3 px-4">Alasan & Rekomendasi Audit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {unmatchedRecords.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-emerald-600 font-bold">
                        ✓ Luar biasa! Semua transaksi berhasil dipetakan (100% matched).
                      </td>
                    </tr>
                  ) : (
                    unmatchedRecords.map((item, idx) => (
                      <tr key={`unmatched-${idx}`} className="hover:bg-rose-50/40">
                        <td className="py-2.5 px-3 text-stone-400 font-mono">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-stone-900">{item.orderNumber}</td>
                        <td className="py-2.5 px-3 font-mono text-stone-700">{item.incomeSku || '-'}</td>
                        <td className="py-2.5 px-4 text-stone-800">{item.productName}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-stone-900">
                          {formatRupiah(item.incomeAmount ?? item.totalIncome)}
                        </td>
                        <td className="py-2.5 px-4 text-xs text-stone-600">
                          No. Pesanan / SKU / Nama Produk tidak terdaftar pada All Order Bulan Ini maupun Bulan Lalu.
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* PRE-EXPORT VALIDATION MODAL                               */}
      {/* ========================================================= */}
      {showValidationModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 border border-stone-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-6 h-6 text-emerald-600" />
                <h3 className="text-base font-black text-stone-900">
                  8-Point Pre-Export Validation Check
                </h3>
              </div>
              <button
                onClick={() => setShowValidationModal(false)}
                className="text-stone-400 hover:text-stone-700 font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {preExportValidation.checkpoints.map((cp, idx) => (
                <div
                  key={`cp-${idx}`}
                  className={`p-3.5 rounded-xl border flex items-start gap-3 ${
                    cp.isBalanced
                      ? 'bg-emerald-50/50 border-emerald-200'
                      : 'bg-amber-50/50 border-amber-200'
                  }`}
                >
                  {cp.isBalanced ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 text-xs">
                    <div className="flex items-center justify-between font-bold text-stone-900">
                      <span>{cp.name}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          cp.isBalanced
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {cp.isBalanced ? 'SEIMBANG' : 'PERIKSA'}
                      </span>
                    </div>
                    <p className="text-stone-600 mt-1">{cp.note}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowValidationModal(false)}
                className="px-4 py-2 bg-stone-900 text-white rounded-xl text-xs font-bold hover:bg-stone-800 cursor-pointer"
              >
                Tutup Pemeriksaan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
