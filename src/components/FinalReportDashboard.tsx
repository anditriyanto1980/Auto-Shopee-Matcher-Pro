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
} from 'lucide-react';
import { MatchedOrderItem, MatchStatus } from '../types/matchingTypes';
import {
  AuditDuplicateItem,
  FinalReportSummary,
  ReconciliationResult,
  ReportTab,
} from '../types/reportTypes';
import { formatNumber, formatRupiah } from '../utils/formatters';
import { SummaryCardsTahap3 } from './SummaryCardsTahap3';
import { AuditPanel } from './AuditPanel';
import { exportToExcel } from '../utils/excelExporter';
import { validateReportForExport } from '../utils/auditEngine';

interface FinalReportDashboardProps {
  results: MatchedOrderItem[];
  summary: FinalReportSummary;
  reconciliation: ReconciliationResult;
  duplicates: AuditDuplicateItem[];
  duplicateKeySet: Set<string>;
  period: string;
  onBackToMatching: () => void;
  onSelectRow: (item: MatchedOrderItem) => void;
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
}) => {
  const [activeTab, setActiveTab] = useState<ReportTab>('hasil');
  const [statusFilter, setStatusFilter] = useState<'ALL' | MatchStatus>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportSuccessMessage, setExportSuccessMessage] = useState<string | null>(null);

  // Filtered dataset for Tab 1 (Hasil Final Report)
  const filteredResults = useMemo(() => {
    let list = results;

    if (statusFilter !== 'ALL') {
      list = list.filter((item) => item.matchStatus === statusFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((item) => {
        return (
          item.orderNumber.toLowerCase().includes(q) ||
          item.incomeSku.toLowerCase().includes(q) ||
          item.productName.toLowerCase().includes(q) ||
          (item.allOrderSku && item.allOrderSku.toLowerCase().includes(q)) ||
          (item.allOrderParentSku && item.allOrderParentSku.toLowerCase().includes(q))
        );
      });
    }

    return list;
  }, [results, statusFilter, searchQuery]);

  // Dataset for Tab 2 (Tidak Cocok)
  const tidakCocokResults = useMemo(() => {
    let list = results.filter((r) => r.matchStatus === 'NOT_FOUND');
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (item) =>
          item.orderNumber.toLowerCase().includes(q) ||
          item.incomeSku.toLowerCase().includes(q) ||
          item.productName.toLowerCase().includes(q),
      );
    }
    return list;
  }, [results, searchQuery]);

  // Dataset for Tab 3 (SKU Induk Fallback)
  const fallbackResults = useMemo(() => {
    let list = results.filter((r) => r.matchStatus === 'SKU_INDUK_FALLBACK');
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (item) =>
          item.orderNumber.toLowerCase().includes(q) ||
          item.incomeSku.toLowerCase().includes(q) ||
          item.productName.toLowerCase().includes(q) ||
          (item.allOrderParentSku && item.allOrderParentSku.toLowerCase().includes(q)),
      );
    }
    return list;
  }, [results, searchQuery]);

  // Dataset for Tab 4 (Nama Produk Fallback)
  const prodNameFallbackResults = useMemo(() => {
    let list = results.filter((r) => r.matchStatus === 'PRODUCT_NAME_FALLBACK');
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (item) =>
          item.orderNumber.toLowerCase().includes(q) ||
          item.incomeSku.toLowerCase().includes(q) ||
          item.productName.toLowerCase().includes(q),
      );
    }
    return list;
  }, [results, searchQuery]);

  // Determine current active list based on tab
  const activeDataset = useMemo(() => {
    if (activeTab === 'hasil') return filteredResults;
    if (activeTab === 'tidak_cocok') return tidakCocokResults;
    if (activeTab === 'sku_induk_fallback') return fallbackResults;
    if (activeTab === 'nama_produk_fallback') return prodNameFallbackResults;
    return [];
  }, [
    activeTab,
    filteredResults,
    tidakCocokResults,
    fallbackResults,
    prodNameFallbackResults,
  ]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(activeDataset.length / pageSize));
  const validPage = Math.min(currentPage, totalPages);

  const paginatedDataset = useMemo(() => {
    const start = (validPage - 1) * pageSize;
    return activeDataset.slice(start, start + pageSize);
  }, [activeDataset, validPage, pageSize]);

  // Handle Export Excel with strict validation
  const handleExportExcel = () => {
    setExportError(null);
    setExportSuccessMessage(null);

    // Validate before export
    const validation = validateReportForExport(results, summary, reconciliation);
    if (!validation.isValid) {
      setExportError(
        `Export dibatalkan karena validasi laporan gagal: ${validation.errors.join('; ')}`,
      );
      return;
    }

    const exportRes = exportToExcel({
      results,
      summary,
      reconciliation,
      duplicates,
      period,
    });

    if (exportRes.success) {
      setExportSuccessMessage(
        `✓ File Excel "${exportRes.fileName}" berhasil dibuat dan diunduh. Silakan buka di Microsoft Excel.`,
      );
      setTimeout(() => setExportSuccessMessage(null), 8000);
    } else {
      setExportError(exportRes.error || 'Export Excel gagal. Data aplikasi tetap aman. Silakan coba kembali.');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Action & Navigation Banner */}
      <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
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
              FINAL REPORT
            </h2>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-800 border border-orange-200">
              <Calendar className="w-3.5 h-3.5 text-orange-600" />
              Periode: {period}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Laporan Income Shopee yang telah dilengkapi Qty Pembelian dari All Order.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto flex-wrap">
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-xs sm:text-sm text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>DOWNLOAD LAPORAN EXCEL (.XLSX)</span>
          </button>
        </div>
      </div>

      {/* Export Notifications */}
      {exportSuccessMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center justify-between animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-medium">{exportSuccessMessage}</span>
          </div>
          <button
            onClick={() => setExportSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold text-xs p-1"
          >
            ✕
          </button>
        </div>
      )}

      {exportError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center justify-between animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <AlertOctagon className="w-5 h-5 text-rose-600 shrink-0" />
            <span className="font-semibold">{exportError}</span>
          </div>
          <button
            onClick={() => setExportError(null)}
            className="text-rose-700 hover:text-rose-900 font-bold text-xs p-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Section 2: SUMMARY DASHBOARD */}
      <SummaryCardsTahap3
        summary={summary}
        selectedStatus={statusFilter}
        onSelectStatus={(status) => {
          if (status === 'SKU_INDUK_FALLBACK') {
            setActiveTab('sku_induk_fallback');
            setStatusFilter('SKU_INDUK_FALLBACK');
          } else if (status === 'PRODUCT_NAME_FALLBACK') {
            setActiveTab('nama_produk_fallback');
            setStatusFilter('PRODUCT_NAME_FALLBACK');
          } else if (status === 'NOT_FOUND') {
            setActiveTab('tidak_cocok');
            setStatusFilter('NOT_FOUND');
          } else {
            setActiveTab('hasil');
            setStatusFilter(status);
          }
          setCurrentPage(1);
        }}
      />

      {/* Tab Navigation Container */}
      <div className="space-y-4">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-stone-200 overflow-x-auto pb-px">
          <div className="flex items-center gap-2 min-w-max">
            <button
              onClick={() => {
                setActiveTab('hasil');
                setCurrentPage(1);
              }}
              className={`px-4 py-2.5 rounded-t-2xl text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === 'hasil'
                  ? 'border-orange-500 text-orange-600 bg-white shadow-2xs'
                  : 'border-transparent text-stone-500 hover:text-stone-800 hover:bg-stone-50'
              }`}
            >
              LAPORAN FINAL ({results.length})
            </button>

            <button
              onClick={() => {
                setActiveTab('tidak_cocok');
                setCurrentPage(1);
              }}
              className={`px-4 py-2.5 rounded-t-2xl text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === 'tidak_cocok'
                  ? 'border-rose-500 text-rose-600 bg-white shadow-2xs'
                  : 'border-transparent text-stone-500 hover:text-stone-800 hover:bg-stone-50'
              }`}
            >
              TIDAK COCOK ({summary.notFoundCount})
            </button>

            <button
              onClick={() => {
                setActiveTab('sku_induk_fallback');
                setCurrentPage(1);
              }}
              className={`px-4 py-2.5 rounded-t-2xl text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === 'sku_induk_fallback'
                  ? 'border-amber-500 text-amber-700 bg-white shadow-2xs'
                  : 'border-transparent text-stone-500 hover:text-stone-800 hover:bg-stone-50'
              }`}
            >
              SKU INDUK FALLBACK ({summary.skuIndukFallbackCount})
            </button>

            <button
              onClick={() => {
                setActiveTab('nama_produk_fallback');
                setCurrentPage(1);
              }}
              className={`px-4 py-2.5 rounded-t-2xl text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === 'nama_produk_fallback'
                  ? 'border-blue-600 text-blue-700 bg-white shadow-2xs'
                  : 'border-transparent text-stone-500 hover:text-stone-800 hover:bg-stone-50'
              }`}
            >
              NAMA PRODUK FALLBACK ({summary.productNameFallbackCount})
            </button>

            <button
              onClick={() => {
                setActiveTab('audit');
              }}
              className={`px-4 py-2.5 rounded-t-2xl text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === 'audit'
                  ? 'border-stone-900 text-stone-900 bg-white shadow-2xs'
                  : 'border-transparent text-stone-500 hover:text-stone-800 hover:bg-stone-50'
              }`}
            >
              AUDIT & REKONSILIASI
            </button>
          </div>
        </div>

        {/* Tab 5: AUDIT VIEW */}
        {activeTab === 'audit' && (
          <AuditPanel
            summary={summary}
            reconciliation={reconciliation}
            duplicates={duplicates}
            period={period}
            results={results}
          />
        )}

        {/* Tab 1, 2, 3: TABLE VIEWS */}
        {activeTab !== 'audit' && (
          <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden flex flex-col">
            {/* Search and Filters Header */}
            <div className="p-5 border-b border-stone-200 bg-stone-50/50 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                {/* Status Filter for Main Tab */}
                {activeTab === 'hasil' ? (
                  <div className="flex flex-wrap items-center gap-1.5 bg-stone-200/70 p-1 rounded-2xl">
                    <button
                      onClick={() => {
                        setStatusFilter('ALL');
                        setCurrentPage(1);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        statusFilter === 'ALL'
                          ? 'bg-white text-stone-900 shadow-xs'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      Semua ({results.length})
                    </button>

                    <button
                      onClick={() => {
                        setStatusFilter('EXACT_SKU');
                        setCurrentPage(1);
                      }}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        statusFilter === 'EXACT_SKU'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-stone-600 hover:text-emerald-700'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Exact SKU ({summary.exactSkuCount})
                    </button>

                    <button
                      onClick={() => {
                        setStatusFilter('SKU_INDUK_FALLBACK');
                        setCurrentPage(1);
                      }}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        statusFilter === 'SKU_INDUK_FALLBACK'
                          ? 'bg-amber-500 text-white shadow-xs'
                          : 'text-stone-600 hover:text-amber-700'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      SKU Induk Fallback ({summary.skuIndukFallbackCount})
                    </button>

                    <button
                      onClick={() => {
                        setStatusFilter('PRODUCT_NAME_FALLBACK');
                        setCurrentPage(1);
                      }}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        statusFilter === 'PRODUCT_NAME_FALLBACK'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-stone-600 hover:text-blue-700'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-blue-400" />
                      Nama Produk Fallback ({summary.productNameFallbackCount})
                    </button>

                    <button
                      onClick={() => {
                        setStatusFilter('NOT_FOUND');
                        setCurrentPage(1);
                      }}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        statusFilter === 'NOT_FOUND'
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'text-stone-600 hover:text-rose-700'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-rose-400" />
                      Tidak Ditemukan ({summary.notFoundCount})
                    </button>
                  </div>
                ) : (
                  <div className="text-xs text-stone-500">
                    {activeTab === 'tidak_cocok' && (
                      <span className="text-rose-700 font-semibold bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200">
                        Menampilkan transaksi dengan status TIDAK DITEMUKAN untuk tindak lanjut
                      </span>
                    )}
                    {activeTab === 'sku_induk_fallback' && (
                      <span className="text-amber-800 font-semibold bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
                        Menampilkan transaksi yang berhasil dicocokkan via fallback SKU Induk
                      </span>
                    )}
                    {activeTab === 'nama_produk_fallback' && (
                      <span className="text-blue-800 font-semibold bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200">
                        Menampilkan transaksi yang berhasil dicocokkan via fallback Nama Produk (SKU All Order kosong)
                      </span>
                    )}
                  </div>
                )}

                {/* Search Box */}
                <div className="relative w-full md:w-80">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="Cari No. Pesanan / SKU / Nama Produk..."
                    className="w-full pl-9 pr-4 py-2 bg-white border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Rows counter & Page Size dropdown (25, 50, 100, 250, 500) */}
              <div className="flex items-center justify-between text-xs text-stone-500 pt-1">
                <span>
                  Menampilkan <strong className="text-stone-800">{activeDataset.length}</strong> data baris
                  {searchQuery && <span> untuk kata kunci <em>"{searchQuery}"</em></span>}
                </span>

                <div className="flex items-center gap-2">
                  <span>Baris per halaman:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="bg-white border border-stone-300 rounded-lg px-2 py-1 text-xs text-stone-700 font-medium cursor-pointer"
                  >
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={250}>250</option>
                    <option value={500}>500</option>
                  </select>
                </div>
              </div>
            </div>

            {/* TAB 1: LAPORAN FINAL TABLE */}
            {activeTab === 'hasil' && (
              <div className="overflow-x-auto flex-1">
                <table className="min-w-full divide-y divide-stone-200 text-xs sm:text-sm text-left">
                  <thead className="bg-stone-100/90 text-stone-700 font-semibold tracking-wide uppercase text-[11px]">
                    <tr>
                      <th className="px-4 py-3 text-center w-12 text-stone-400">No.</th>
                      <th className="px-4 py-3">No. Pesanan</th>
                      <th className="px-4 py-3">SKU</th>
                      <th className="px-4 py-3">Nama Produk</th>
                      <th className="px-4 py-3 text-right">Total Penghasilan</th>
                      <th className="px-4 py-3 text-center">Qty Pembelian</th>
                      <th className="px-4 py-3 text-center">Status Matching</th>
                      <th className="px-4 py-3">Sumber All Order</th>
                      <th className="px-4 py-3 text-center w-16">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200">
                    {paginatedDataset.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-6 py-16 text-center text-stone-400">
                          <FileSpreadsheet className="w-10 h-10 mx-auto mb-2 text-stone-300" />
                          <p className="font-semibold text-stone-600">Tidak ada data untuk kriteria ini</p>
                        </td>
                      </tr>
                    ) : (
                      paginatedDataset.map((item, idx) => {
                        const globalIndex = (validPage - 1) * pageSize + idx + 1;
                        const compositeKey = `${item.orderNumber.trim().toUpperCase()}|||${item.incomeSku.trim().toUpperCase()}`;
                        const isDuplicate = duplicateKeySet.has(compositeKey);

                        return (
                          <tr
                            key={item.id}
                            onClick={() => onSelectRow(item)}
                            className="hover:bg-orange-50/50 cursor-pointer transition-colors group"
                          >
                            <td className="px-4 py-3 text-center text-stone-400 font-mono text-xs">
                              {globalIndex}
                            </td>

                            <td className="px-4 py-3 font-mono font-semibold text-stone-900 select-all whitespace-nowrap">
                              <div className="flex items-center gap-1.5">
                                <span>{item.orderNumber}</span>
                                {isDuplicate && (
                                  <span
                                    className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200"
                                    title="Peringatan: Kombinasi No. Pesanan + SKU ini muncul lebih dari 1 kali di Income (Review saja)"
                                  >
                                    ⚠ Duplikat
                                  </span>
                                )}
                              </div>
                            </td>

                            <td className="px-4 py-3 font-mono text-stone-800 whitespace-nowrap">
                              <span className="bg-stone-100 px-2 py-0.5 rounded border border-stone-200">
                                {item.incomeSku}
                              </span>
                            </td>

                            <td className="px-4 py-3 max-w-[260px] truncate text-stone-700" title={item.productName}>
                              {item.productName || '—'}
                            </td>

                            <td className="px-4 py-3 text-right font-mono font-medium text-stone-900 whitespace-nowrap">
                              {formatRupiah(item.totalIncome)}
                            </td>

                            <td className="px-4 py-3 text-center font-mono font-bold whitespace-nowrap">
                              {item.quantity !== null && item.quantity !== undefined ? (
                                <span className="inline-flex items-center justify-center min-w-8 px-2 py-0.5 rounded-md bg-stone-100 text-stone-900 text-xs font-black border border-stone-200">
                                  {formatNumber(item.quantity)}
                                </span>
                              ) : (
                                <span className="text-stone-400 font-bold">—</span>
                              )}
                            </td>

                            <td className="px-4 py-3 text-center whitespace-nowrap">
                              {item.matchStatus === 'EXACT_SKU' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                  Exact SKU
                                </span>
                              )}
                              {item.matchStatus === 'SKU_INDUK_FALLBACK' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                                  SKU Induk Fallback
                                </span>
                              )}
                              {item.matchStatus === 'PRODUCT_NAME_FALLBACK' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                                  <Tag className="w-3.5 h-3.5 text-blue-600" />
                                  Nama Produk Fallback
                                </span>
                              )}
                              {item.matchStatus === 'NOT_FOUND' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                                  <XCircle className="w-3.5 h-3.5 text-rose-600" />
                                  Tidak Ditemukan
                                </span>
                              )}
                            </td>

                            <td className="px-4 py-3 text-stone-600 text-xs whitespace-nowrap">
                              {item.sourceMonth === 'current' && (
                                <span className="font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                                  All Order Bulan Ini
                                </span>
                              )}
                              {item.sourceMonth === 'previous' && (
                                <span className="font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                                  All Order Bulan Lalu
                                </span>
                              )}
                              {!item.sourceMonth && (
                                <span className="text-stone-400 italic">—</span>
                              )}
                            </td>

                            <td className="px-4 py-3 text-center">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSelectRow(item);
                                }}
                                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors cursor-pointer"
                                title="Lihat detail audit"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Detail</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB 2: TIDAK COCOK TABLE */}
            {activeTab === 'tidak_cocok' && (
              <div className="overflow-x-auto flex-1">
                <table className="min-w-full divide-y divide-stone-200 text-xs sm:text-sm text-left">
                  <thead className="bg-rose-50/80 text-rose-900 font-semibold tracking-wide uppercase text-[11px]">
                    <tr>
                      <th className="px-4 py-3 text-center w-12 text-rose-400">No.</th>
                      <th className="px-4 py-3">No. Pesanan</th>
                      <th className="px-4 py-3">SKU</th>
                      <th className="px-4 py-3">Nama Produk</th>
                      <th className="px-4 py-3 text-right">Total Penghasilan</th>
                      <th className="px-4 py-3 text-center">Qty Pembelian</th>
                      <th className="px-4 py-3 text-center">Status</th>
                      <th className="px-4 py-3">Alasan</th>
                      <th className="px-4 py-3 text-center w-16">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200">
                    {paginatedDataset.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-6 py-16 text-center text-stone-400">
                          <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-emerald-500" />
                          <p className="font-semibold text-stone-700">Luar biasa! Tidak ada data yang tidak cocok.</p>
                          <p className="text-xs text-stone-400 mt-0.5">Semua SKU berhasil ditemukan pada All Order.</p>
                        </td>
                      </tr>
                    ) : (
                      paginatedDataset.map((item, idx) => {
                        const globalIndex = (validPage - 1) * pageSize + idx + 1;
                        return (
                          <tr
                            key={item.id}
                            onClick={() => onSelectRow(item)}
                            className="hover:bg-rose-50/40 cursor-pointer transition-colors"
                          >
                            <td className="px-4 py-3 text-center text-stone-400 font-mono text-xs">
                              {globalIndex}
                            </td>

                            <td className="px-4 py-3 font-mono font-semibold text-stone-900 select-all whitespace-nowrap">
                              {item.orderNumber}
                            </td>

                            <td className="px-4 py-3 font-mono text-stone-800 whitespace-nowrap">
                              <span className="bg-rose-100/70 text-rose-900 px-2 py-0.5 rounded border border-rose-200 font-bold">
                                {item.incomeSku}
                              </span>
                            </td>

                            <td className="px-4 py-3 max-w-[240px] truncate text-stone-700" title={item.productName}>
                              {item.productName || '—'}
                            </td>

                            <td className="px-4 py-3 text-right font-mono font-medium text-stone-900 whitespace-nowrap">
                              {formatRupiah(item.totalIncome)}
                            </td>

                            <td className="px-4 py-3 text-center font-mono font-bold text-stone-400">
                              -
                            </td>

                            <td className="px-4 py-3 text-center whitespace-nowrap">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
                                <XCircle className="w-3.5 h-3.5 text-rose-600" />
                                Tidak Ditemukan
                              </span>
                            </td>

                            <td className="px-4 py-3 text-xs text-stone-600 max-w-[280px]">
                              SKU tidak ditemukan pada All Order bulan ini maupun bulan sebelumnya.
                            </td>

                            <td className="px-4 py-3 text-center">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSelectRow(item);
                                }}
                                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-rose-700 hover:text-rose-900 bg-rose-100/60 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Detail</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB 3: SKU INDUK FALLBACK TABLE */}
            {activeTab === 'sku_induk_fallback' && (
              <div className="overflow-x-auto flex-1">
                <table className="min-w-full divide-y divide-stone-200 text-xs sm:text-sm text-left">
                  <thead className="bg-amber-50/80 text-amber-900 font-semibold tracking-wide uppercase text-[11px]">
                    <tr>
                      <th className="px-4 py-3 text-center w-12 text-amber-500">No.</th>
                      <th className="px-4 py-3">No. Pesanan</th>
                      <th className="px-4 py-3">SKU Income</th>
                      <th className="px-4 py-3">Nama Produk</th>
                      <th className="px-4 py-3 text-center">Qty</th>
                      <th className="px-4 py-3">SKU Induk (All Order)</th>
                      <th className="px-4 py-3">Sumber All Order</th>
                      <th className="px-4 py-3 text-center">Status</th>
                      <th className="px-4 py-3 text-center w-16">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200">
                    {paginatedDataset.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-6 py-16 text-center text-stone-400">
                          <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-emerald-500" />
                          <p className="font-semibold text-stone-700">Tidak ada fallback SKU Induk.</p>
                          <p className="text-xs text-stone-400 mt-0.5">Semua data berhasil match di tingkat Exact SKU atau tidak ada fallback.</p>
                        </td>
                      </tr>
                    ) : (
                      paginatedDataset.map((item, idx) => {
                        const globalIndex = (validPage - 1) * pageSize + idx + 1;
                        return (
                          <tr
                            key={item.id}
                            onClick={() => onSelectRow(item)}
                            className="hover:bg-amber-50/40 cursor-pointer transition-colors"
                          >
                            <td className="px-4 py-3 text-center text-stone-400 font-mono text-xs">
                              {globalIndex}
                            </td>

                            <td className="px-4 py-3 font-mono font-semibold text-stone-900 select-all whitespace-nowrap">
                              {item.orderNumber}
                            </td>

                            <td className="px-4 py-3 font-mono text-stone-800 whitespace-nowrap">
                              <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded border border-amber-200 font-bold">
                                {item.incomeSku}
                              </span>
                            </td>

                            <td className="px-4 py-3 max-w-[220px] truncate text-stone-700" title={item.productName}>
                              {item.productName || '—'}
                            </td>

                            <td className="px-4 py-3 text-center font-mono font-bold whitespace-nowrap">
                              <span className="inline-flex items-center justify-center min-w-8 px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 text-xs font-black border border-amber-200">
                                {item.quantity !== null && item.quantity !== undefined
                                  ? formatNumber(item.quantity)
                                  : '-'}
                              </span>
                            </td>

                            <td className="px-4 py-3 font-mono text-amber-800 font-bold whitespace-nowrap">
                              {item.allOrderParentSku || '—'}
                            </td>

                            <td className="px-4 py-3 text-stone-600 text-xs whitespace-nowrap">
                              {item.sourceMonth === 'current'
                                ? 'All Order Bulan Ini'
                                : item.sourceMonth === 'previous'
                                ? 'All Order Bulan Lalu'
                                : '-'}
                            </td>

                            <td className="px-4 py-3 text-center whitespace-nowrap">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                                SKU Induk Fallback
                              </span>
                            </td>

                            <td className="px-4 py-3 text-center">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSelectRow(item);
                                }}
                                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-amber-800 hover:text-amber-950 bg-amber-100/70 hover:bg-amber-100 rounded-lg transition-colors cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Detail</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-stone-200 bg-stone-50 flex items-center justify-between text-xs text-stone-600">
                <div>
                  Halaman <strong className="text-stone-900">{validPage}</strong> dari{' '}
                  <strong className="text-stone-900">{totalPages}</strong> ({activeDataset.length} total)
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={validPage <= 1}
                    className={`p-1.5 rounded-lg border border-stone-300 transition-colors ${
                      validPage <= 1
                        ? 'text-stone-300 border-stone-200 cursor-not-allowed'
                        : 'text-stone-700 hover:bg-white cursor-pointer'
                    }`}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNumber = validPage;
                    if (totalPages <= 5) {
                      pageNumber = i + 1;
                    } else if (validPage <= 3) {
                      pageNumber = i + 1;
                    } else if (validPage >= totalPages - 2) {
                      pageNumber = totalPages - 4 + i;
                    } else {
                      pageNumber = validPage - 2 + i;
                    }

                    return (
                      <button
                        key={pageNumber}
                        onClick={() => setCurrentPage(pageNumber)}
                        className={`min-w-8 h-8 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                          pageNumber === validPage
                            ? 'bg-orange-500 text-white'
                            : 'text-stone-700 hover:bg-stone-200/70 border border-stone-200 bg-white'
                        }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={validPage >= totalPages}
                    className={`p-1.5 rounded-lg border border-stone-300 transition-colors ${
                      validPage >= totalPages
                        ? 'text-stone-300 border-stone-200 cursor-not-allowed'
                        : 'text-stone-700 hover:bg-white cursor-pointer'
                    }`}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
