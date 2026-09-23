import * as XLSX from 'xlsx';
import { MatchedOrderItem } from '../types/matchingTypes';
import {
  AuditDuplicateItem,
  FinalReportSummary,
  ReconciliationResult,
  TransactionLedgerRecord,
  OrderSummaryRecord,
  ProductAnalysisRecord,
  Top10Rankings,
  ExpenseAnalysisSummary,
  DailyAnalysisRecord,
  FinancialExecutiveSummary,
} from '../types/reportTypes';
import { formatNumber, formatRupiah } from './formatters';

export interface ProfessionalExportOptions {
  results: MatchedOrderItem[];
  summary: FinalReportSummary;
  reconciliation: ReconciliationResult;
  duplicates: AuditDuplicateItem[];
  period: string;
  ledger: TransactionLedgerRecord[];
  orderSummaries: OrderSummaryRecord[];
  products: ProductAnalysisRecord[];
  top10: Top10Rankings;
  expenses: ExpenseAnalysisSummary;
  daily: DailyAnalysisRecord[];
  executiveSummary: FinancialExecutiveSummary;
  rawIncomeRows?: (string | number | boolean | null)[][];
  rawAllOrderCurrentRows?: (string | number | boolean | null)[][];
  rawAllOrderPrevRows?: (string | number | boolean | null)[][];
  rawSettlementRows?: (string | number | boolean | null)[][];
}

/**
 * Calculates auto column widths based on maximum string length in columns
 */
function calculateAutoWidths(data: (string | number | boolean | null)[][]): { wch: number }[] {
  if (!data || data.length === 0) return [];
  const colCount = Math.max(...data.map((row) => (row ? row.length : 0)));
  const widths: number[] = new Array(colCount).fill(10);

  for (const row of data) {
    if (!row) continue;
    for (let c = 0; c < row.length; c++) {
      const val = row[c];
      if (val !== null && val !== undefined) {
        const strLen = String(val).length;
        if (strLen > widths[c]) {
          widths[c] = Math.min(strLen + 3, 50); // cap max width at 50 for readability
        }
      }
    }
  }

  return widths.map((w) => ({ wch: Math.max(w, 12) }));
}

/**
 * Normalizes period string into safe filename component
 */
function formatFilenamePeriod(period: string): string {
  const clean = period.replace(/[^a-zA-Z0-9_-]/g, '_').replace(/_+/g, '_');
  return clean || 'Periode_Berjalan';
}

/**
 * Exports complete 12-sheet professional financial and analytics workbook
 * Compliant with user specification for Laporan_Shopee_Professional / Shopee_Report_[PERIODE].xlsx
 */
export function exportToExcel(options: ProfessionalExportOptions): {
  success: boolean;
  fileName: string;
  error?: string;
} {
  try {
    const {
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
      rawIncomeRows,
      rawAllOrderCurrentRows,
      rawAllOrderPrevRows,
      rawSettlementRows,
    } = options;

    const wb = XLSX.utils.book_new();

    // ==============================================================
    // 01_EXECUTIVE_SUMMARY
    // ==============================================================
    const modeLabel =
      executiveSummary.mode === 'FINANCIAL_REPORT'
        ? 'FINANCIAL REPORT (Income + All Order + Settlement Terverifikasi)'
        : 'SALES REPORT (Income + All Order - Settlement Belum Diunggah)';

    const execSummaryData: (string | number | boolean | null)[][] = [
      ['SHOPEE PROFESSIONAL FINANCIAL & SALES REPORT'],
      ['Periode Laporan:', period],
      ['Mode Laporan:', modeLabel],
      ['Waktu Export:', new Date().toLocaleString('id-ID')],
      [],
      ['1. RINGKASAN EKSEKUTIF KINERJA (KPI KEUANGAN & PENJUALAN)', 'NILAI', 'CATATAN AUDIT'],
      ['Total Pesanan (Unique Orders)', executiveSummary.totalOrders, 'Dihitung per No. Pesanan unik'],
      ['Total Ragam SKU Aktif', executiveSummary.totalUniqueSkus, 'Jumlah SKU unik terjual'],
      ['Total Kuantitas Terjual (Total Qty)', executiveSummary.totalQuantity, 'Total unit produk tervalidasi'],
      ['Total Pendapatan Kotor (Gross Revenue)', executiveSummary.totalGrossRevenue, formatRupiah(executiveSummary.totalGrossRevenue)],
      ['Total Diskon & Voucher Penjual', executiveSummary.totalDiscount, formatRupiah(executiveSummary.totalDiscount)],
      ['Total Beban Biaya Platform (Expense)', executiveSummary.totalExpense, formatRupiah(executiveSummary.totalExpense)],
      ['Total Pengembalian Dana (Refund)', executiveSummary.totalRefund, formatRupiah(executiveSummary.totalRefund)],
      [
        'Pendapatan Bersih Setelah Biaya Platform (Net Revenue)',
        executiveSummary.netRevenue,
        formatRupiah(executiveSummary.netRevenue),
      ],
      ['Average Order Value (AOV)', Math.round(executiveSummary.averageOrderValue), formatRupiah(executiveSummary.averageOrderValue)],
      ['Average Revenue per SKU', Math.round(executiveSummary.averageRevenuePerSku), formatRupiah(executiveSummary.averageRevenuePerSku)],
      [],
      ['2. INFORMASI PROFITABILITAS & HPP (COST OF GOODS SOLD)', 'STATUS', 'KETERANGAN'],
      ['HPP (Harga Pokok Penjualan)', '-', 'Tidak tersedia di laporan seller centre Shopee'],
      ['Gross Profit (Laba Kotor Akuntansi)', '-', 'HPP tidak diisi, laba kotor akuntansi tidak diestimasi palsu'],
      ['Gross Margin', '-', 'Tidak dapat dihitung tanpa data HPP akuntansi'],
      [],
      ['3. KINERJA MATCHING ENGINE', 'JUMLAH BARIS', 'PERSENTASE TERHADAP TOTAL INCOME'],
      ['Prioritas 1: Exact SKU Match', summary.exactSkuCount, `${summary.exactSkuPercentage.toFixed(1)}%`],
      ['Prioritas 2: SKU Induk Fallback', summary.skuIndukFallbackCount, `${summary.skuIndukFallbackPercentage.toFixed(1)}%`],
      ['Prioritas 3: Nama Produk Fallback', summary.productNameFallbackCount, `${summary.productNameFallbackPercentage.toFixed(1)}%`],
      ['Tidak Ditemukan (Unmatched)', summary.notFoundCount, `${summary.notFoundPercentage.toFixed(1)}%`],
      ['Tingkat Kecocokan Pesanan (Order Match Rate)', executiveSummary.matchedOrderPercentage, `${executiveSummary.matchedOrderPercentage.toFixed(1)}%`],
      [],
      ['4. STATUS REKONSILIASI KEUANGAN & AUDIT', 'HASIL', 'VERIFIKASI'],
      [
        'Status Integritas Data',
        reconciliation.status === 'SUCCESS' ? '✓ REKONSILIASI BERHASIL (SEIMBANG)' : 'PERLU PEMERIKSAAN',
        'Exact + SKU Induk + Nama Produk + Not Found == Total Income',
      ],
      ['Total Baris Data Income Diproses', reconciliation.totalIncomeRows, '100% baris dipetakan'],
      ['Potensi Duplikasi Data', duplicates.length > 0 ? `${duplicates.length} pola order` : '0 (Bersih)', 'Pemeriksaan integritas baris'],
    ];

    const wsExec = XLSX.utils.aoa_to_sheet(execSummaryData);
    wsExec['!cols'] = [{ wch: 45 }, { wch: 25 }, { wch: 55 }];
    XLSX.utils.book_append_sheet(wb, wsExec, '01_EXECUTIVE_SUMMARY');

    // ==============================================================
    // 02_DETAIL_TRANSAKSI (Normalized Transaction Ledger)
    // ==============================================================
    const ledgerHeaders = [
      'No',
      'No Pesanan',
      'Tanggal',
      'SKU',
      'Nama Produk',
      'Variasi',
      'Qty',
      'Harga Satuan',
      'Pendapatan Kotor',
      'Diskon',
      'Biaya Administrasi',
      'Biaya Pembayaran',
      'Biaya Layanan',
      'Biaya Pengiriman',
      'Biaya Promosi',
      'Biaya Lainnya',
      'Refund',
      'Penyesuaian',
      'Total Beban',
      'Pendapatan Bersih',
      'HPP',
      'Gross Profit',
      'Margin',
      'Match Type',
      'Match Status',
      'Source File',
      'Source Row',
      'Audit Note',
    ];

    const ledgerRows = ledger.map((item) => [
      item.no,
      item.orderNumber,
      item.orderDate,
      item.sku,
      item.productName,
      item.variation,
      item.quantity !== null && item.quantity !== undefined ? item.quantity : '-',
      item.unitPrice !== null && item.unitPrice !== undefined ? Math.round(item.unitPrice) : '-',
      item.grossRevenue,
      item.discount,
      item.adminFee,
      item.paymentFee,
      item.serviceFee,
      item.shippingCost,
      item.promotionFee,
      item.otherFee,
      item.refund,
      item.adjustment,
      item.totalExpense,
      item.netRevenue,
      '-', // HPP kosong
      '-', // Gross Profit kosong
      '-', // Margin kosong
      item.matchType,
      item.matchStatus,
      item.sourceFile,
      item.sourceRow,
      item.auditNote,
    ]);

    // Calculate Ledger Totals
    const totLedgerQty = ledger.reduce((sum, i) => sum + (i.quantity || 0), 0);
    const totLedgerGross = ledger.reduce((sum, i) => sum + i.grossRevenue, 0);
    const totLedgerDiscount = ledger.reduce((sum, i) => sum + i.discount, 0);
    const totLedgerAdmin = ledger.reduce((sum, i) => sum + i.adminFee, 0);
    const totLedgerPay = ledger.reduce((sum, i) => sum + i.paymentFee, 0);
    const totLedgerServ = ledger.reduce((sum, i) => sum + i.serviceFee, 0);
    const totLedgerShip = ledger.reduce((sum, i) => sum + i.shippingCost, 0);
    const totLedgerPromo = ledger.reduce((sum, i) => sum + i.promotionFee, 0);
    const totLedgerOther = ledger.reduce((sum, i) => sum + i.otherFee, 0);
    const totLedgerRefund = ledger.reduce((sum, i) => sum + i.refund, 0);
    const totLedgerAdj = ledger.reduce((sum, i) => sum + i.adjustment, 0);
    const totLedgerExpense = ledger.reduce((sum, i) => sum + i.totalExpense, 0);
    const totLedgerNet = ledger.reduce((sum, i) => sum + i.netRevenue, 0);

    const ledgerTotalRow = [
      'TOTAL',
      '',
      '',
      '',
      '',
      '',
      totLedgerQty,
      '',
      totLedgerGross,
      totLedgerDiscount,
      totLedgerAdmin,
      totLedgerPay,
      totLedgerServ,
      totLedgerShip,
      totLedgerPromo,
      totLedgerOther,
      totLedgerRefund,
      totLedgerAdj,
      totLedgerExpense,
      totLedgerNet,
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      'Total Baris Transaksi Terverifikasi',
    ];

    const ledgerSheetData = [ledgerHeaders, ...ledgerRows, ledgerTotalRow];
    const wsLedger = XLSX.utils.aoa_to_sheet(ledgerSheetData);
    wsLedger['!cols'] = calculateAutoWidths(ledgerSheetData);
    if (ledgerRows.length > 0) {
      wsLedger['!autofilter'] = { ref: `A1:AB${ledgerRows.length + 1}` };
    }
    wsLedger['!freeze'] = { xSplit: 0, ySplit: 1 };
    XLSX.utils.book_append_sheet(wb, wsLedger, '02_DETAIL_TRANSAKSI');

    // ==============================================================
    // 03_ORDER_SUMMARY (1 row per No. Pesanan, No double counting)
    // ==============================================================
    const orderHeaders = [
      'No Pesanan',
      'Tanggal',
      'Jumlah SKU',
      'Total Qty',
      'Pendapatan',
      'Diskon',
      'Total Beban',
      'Refund',
      'Pendapatan Bersih',
      'Margin',
      'Status Matching',
      'Verifikasi Settlement',
    ];

    const orderRows = orderSummaries.map((o) => [
      o.orderNumber,
      o.orderDate || '-',
      o.skuCount,
      o.totalQuantity,
      o.grossRevenue,
      o.discount,
      o.totalExpense,
      o.refund,
      o.netRevenue,
      '-',
      o.matchStatus,
      o.settlementVerified ? 'Terverifikasi Settlement' : 'Belum Ada Settlement',
    ]);

    const totOrderQty = orderSummaries.reduce((sum, o) => sum + o.totalQuantity, 0);
    const totOrderGross = orderSummaries.reduce((sum, o) => sum + o.grossRevenue, 0);
    const totOrderDiscount = orderSummaries.reduce((sum, o) => sum + o.discount, 0);
    const totOrderExpense = orderSummaries.reduce((sum, o) => sum + o.totalExpense, 0);
    const totOrderRefund = orderSummaries.reduce((sum, o) => sum + o.refund, 0);
    const totOrderNet = orderSummaries.reduce((sum, o) => sum + o.netRevenue, 0);

    const orderTotalRow = [
      `TOTAL (${orderSummaries.length} PESANAN)`,
      '',
      '',
      totOrderQty,
      totOrderGross,
      totOrderDiscount,
      totOrderExpense,
      totOrderRefund,
      totOrderNet,
      '',
      '',
      'Zero Double-Count Biaya',
    ];

    const orderSheetData = [orderHeaders, ...orderRows, orderTotalRow];
    const wsOrder = XLSX.utils.aoa_to_sheet(orderSheetData);
    wsOrder['!cols'] = calculateAutoWidths(orderSheetData);
    if (orderRows.length > 0) {
      wsOrder['!autofilter'] = { ref: `A1:L${orderRows.length + 1}` };
    }
    wsOrder['!freeze'] = { xSplit: 0, ySplit: 1 };
    XLSX.utils.book_append_sheet(wb, wsOrder, '03_ORDER_SUMMARY');

    // ==============================================================
    // 04_PRODUCT_ANALYSIS (Grouped by SKU + Nama Produk, Sorted Qty desc)
    // ==============================================================
    const prodHeaders = [
      'No',
      'SKU',
      'Nama Produk',
      'Total Qty',
      'Total Order',
      'Total Revenue',
      'Total Expense',
      'Net Revenue',
      'Average Selling Price (ASP)',
      'HPP',
      'Gross Profit',
      'Gross Margin',
    ];

    const prodRows = products.map((p, idx) => [
      idx + 1,
      p.sku,
      p.productName,
      p.totalQuantity,
      p.totalOrder,
      p.totalRevenue,
      p.totalExpense,
      p.netRevenue,
      Math.round(p.averageSellingPrice),
      '-',
      '-',
      '-',
    ]);

    const totProdQty = products.reduce((sum, p) => sum + p.totalQuantity, 0);
    const totProdRev = products.reduce((sum, p) => sum + p.totalRevenue, 0);
    const totProdExp = products.reduce((sum, p) => sum + p.totalExpense, 0);
    const totProdNet = products.reduce((sum, p) => sum + p.netRevenue, 0);
    const overallAsp = totProdQty > 0 ? Math.round(totProdRev / totProdQty) : 0;

    const prodTotalRow = [
      'TOTAL',
      '',
      `${products.length} Ragam Produk`,
      totProdQty,
      executiveSummary.totalOrders,
      totProdRev,
      totProdExp,
      totProdNet,
      overallAsp,
      '',
      '',
      '',
    ];

    const prodSheetData = [prodHeaders, ...prodRows, prodTotalRow];
    const wsProd = XLSX.utils.aoa_to_sheet(prodSheetData);
    wsProd['!cols'] = calculateAutoWidths(prodSheetData);
    if (prodRows.length > 0) {
      wsProd['!autofilter'] = { ref: `A1:L${prodRows.length + 1}` };
    }
    wsProd['!freeze'] = { xSplit: 0, ySplit: 1 };
    XLSX.utils.book_append_sheet(wb, wsProd, '04_PRODUCT_ANALYSIS');

    // ==============================================================
    // 05_TOP_10 (5 Distinct Rankings as per Section 12 & 22)
    // ==============================================================
    const top10Data: (string | number | boolean | null)[][] = [
      ['RANKING PRODUK TERBAIK SHOPEE (TOP 10 ANALYTICS)'],
      ['Catatan Penting: Ranking terlaris (Qty) dipisahkan secara ketat dari ranking omzet & net revenue.'],
      [],
      ['A. TOP 10 PRODUK BERDASARKAN KUANTITAS (QTY TERLARIS)'],
      ['Peringkat', 'SKU', 'Nama Produk', 'Total Qty', 'Total Order', 'Total Omzet (Revenue)', 'Net Revenue'],
      ...top10.byQty.map((p, idx) => [
        `#${idx + 1}`,
        p.sku,
        p.productName,
        p.totalQuantity,
        p.totalOrder,
        p.totalRevenue,
        p.netRevenue,
      ]),
      [],
      ['B. TOP 10 PRODUK BERDASARKAN OMZET (GROSS REVENUE TERTINGGI)'],
      ['Peringkat', 'SKU', 'Nama Produk', 'Total Omzet', 'Total Qty', 'Total Order', 'Net Revenue'],
      ...top10.byRevenue.map((p, idx) => [
        `#${idx + 1}`,
        p.sku,
        p.productName,
        p.totalRevenue,
        p.totalQuantity,
        p.totalOrder,
        p.netRevenue,
      ]),
      [],
      ['C. TOP 10 PRODUK BERDASARKAN PENDAPATAN BERSIH (NET REVENUE)'],
      ['Peringkat', 'SKU', 'Nama Produk', 'Net Revenue', 'Total Omzet', 'Total Expense', 'Total Qty'],
      ...top10.byNetRevenue.map((p, idx) => [
        `#${idx + 1}`,
        p.sku,
        p.productName,
        p.netRevenue,
        p.totalRevenue,
        p.totalExpense,
        p.totalQuantity,
      ]),
      [],
      ['D. TOP 10 PRODUK BERDASARKAN FREKUENSI ORDER'],
      ['Peringkat', 'SKU', 'Nama Produk', 'Jumlah Order', 'Total Qty', 'Total Omzet'],
      ...top10.byOrderCount.map((p, idx) => [
        `#${idx + 1}`,
        p.sku,
        p.productName,
        p.totalOrder,
        p.totalQuantity,
        p.totalRevenue,
      ]),
      [],
      ['E. TOP 10 PRODUK BERDASARKAN TOTAL BEBAN BIAYA PLATFORM'],
      ['Peringkat', 'SKU', 'Nama Produk', 'Total Beban Biaya', 'Total Omzet', 'Rasio Beban/Omzet'],
      ...top10.byExpense.map((p, idx) => [
        `#${idx + 1}`,
        p.sku,
        p.productName,
        p.totalExpense,
        p.totalRevenue,
        p.totalRevenue > 0 ? `${((p.totalExpense / p.totalRevenue) * 100).toFixed(1)}%` : '0%',
      ]),
    ];

    const wsTop10 = XLSX.utils.aoa_to_sheet(top10Data);
    wsTop10['!cols'] = [{ wch: 12 }, { wch: 22 }, { wch: 45 }, { wch: 18 }, { wch: 18 }, { wch: 22 }, { wch: 22 }];
    XLSX.utils.book_append_sheet(wb, wsTop10, '05_TOP_10');

    // ==============================================================
    // 06_EXPENSE_ANALYSIS (Fee breakdown & % of Gross Revenue)
    // ==============================================================
    const expenseData: (string | number | boolean | null)[][] = [
      ['ANALISIS STRUKTUR BIAYA PLATFORM SHOPEE'],
      ['Status Settlement:', expenses.settlementAvailable ? 'Aktual dari Settlement' : 'Settlement Tidak Diunggah (Sales Report Mode)'],
      ['Total Pendapatan Kotor (Gross Revenue):', executiveSummary.totalGrossRevenue],
      [],
      ['Nama Komponen Biaya', 'Kategori', 'Total Jumlah (Rp)', '% terhadap Gross Revenue', 'Catatan Kebijakan Finansial'],
    ];

    if (expenses.items.length > 0) {
      for (const item of expenses.items) {
        expenseData.push([
          item.feeName,
          item.category,
          item.amount,
          `${item.percentageOfGross.toFixed(2)}%`,
          item.note || '-',
        ]);
      }
      expenseData.push([]);
      expenseData.push([
        'TOTAL BEBAN BIAYA PLATFORM',
        'Semua Kategori',
        expenses.totalExpense,
        `${expenses.percentageOfGross.toFixed(2)}%`,
        'Total potongan resmi biaya seller',
      ]);
    } else {
      expenseData.push([
        'File Settlement belum diunggah',
        '-',
        0,
        '0.00%',
        'Biaya per transaksi tidak diestimasi palsu (Sesuai Aturan Finansial Section 3 & 25)',
      ]);
    }

    const wsExpense = XLSX.utils.aoa_to_sheet(expenseData);
    wsExpense['!cols'] = [{ wch: 38 }, { wch: 25 }, { wch: 22 }, { wch: 25 }, { wch: 55 }];
    XLSX.utils.book_append_sheet(wb, wsExpense, '06_EXPENSE_ANALYSIS');

    // ==============================================================
    // 07_DAILY_ANALYSIS (Grouped by Date with AOV and Totals)
    // ==============================================================
    const dailyHeaders = [
      'Tanggal',
      'Jumlah Order',
      'Total Qty',
      'Gross Revenue',
      'Total Expense',
      'Net Revenue',
      'Average Order Value (AOV)',
    ];

    const dailyRows = daily.map((d) => [
      d.date,
      d.orderCount,
      d.totalQuantity,
      d.grossRevenue,
      d.totalExpense,
      d.netRevenue,
      Math.round(d.averageOrderValue),
    ]);

    const totDailyOrders = daily.reduce((sum, d) => sum + d.orderCount, 0);
    const totDailyQty = daily.reduce((sum, d) => sum + d.totalQuantity, 0);
    const totDailyGross = daily.reduce((sum, d) => sum + d.grossRevenue, 0);
    const totDailyExp = daily.reduce((sum, d) => sum + d.totalExpense, 0);
    const totDailyNet = daily.reduce((sum, d) => sum + d.netRevenue, 0);
    const avgDailyAov = totDailyOrders > 0 ? Math.round(totDailyGross / totDailyOrders) : 0;

    const dailyTotalRow = [
      'TOTAL PERIODE',
      totDailyOrders,
      totDailyQty,
      totDailyGross,
      totDailyExp,
      totDailyNet,
      avgDailyAov,
    ];

    const dailySheetData = [dailyHeaders, ...dailyRows, dailyTotalRow];
    const wsDaily = XLSX.utils.aoa_to_sheet(dailySheetData);
    wsDaily['!cols'] = calculateAutoWidths(dailySheetData);
    if (dailyRows.length > 0) {
      wsDaily['!autofilter'] = { ref: `A1:G${dailyRows.length + 1}` };
    }
    wsDaily['!freeze'] = { xSplit: 0, ySplit: 1 };
    XLSX.utils.book_append_sheet(wb, wsDaily, '07_DAILY_ANALYSIS');

    // ==============================================================
    // 08_MATCHING_AUDIT (Audit Trail & 4-Category Reconciliation)
    // ==============================================================
    const auditData: (string | number | boolean | null)[][] = [
      ['AUDIT REPORT & DATA RECONCILIATION'],
      ['Waktu Audit:', new Date().toLocaleString('id-ID')],
      [],
      ['1. REKONSILIASI HASIL MATCHING', 'JUMLAH BARIS', 'PERSENTASE TERHADAP TOTAL'],
      ['Prioritas 1: Exact SKU (No. Pesanan + Nomor Referensi SKU)', summary.exactSkuCount, `${summary.exactSkuPercentage.toFixed(1)}%`],
      ['Prioritas 2: SKU Induk Fallback (No. Pesanan + SKU Induk)', summary.skuIndukFallbackCount, `${summary.skuIndukFallbackPercentage.toFixed(1)}%`],
      ['Prioritas 3: Nama Produk Fallback (No. Pesanan + Nama Produk)', summary.productNameFallbackCount, `${summary.productNameFallbackPercentage.toFixed(1)}%`],
      ['Status 4: Tidak Ditemukan di All Order (Unmatched)', summary.notFoundCount, `${summary.notFoundPercentage.toFixed(1)}%`],
      ['Total Baris Data Income Diproses', summary.totalIncomeSkuRows, '100%'],
      [],
      ['2. FORMULA VALIDASI KESETARAAN MATEMATIS', 'NILAI', 'STATUS VERIFIKASI'],
      ['Jumlah Kategori (Exact + P2 + P3 + Not Found)', reconciliation.sumCategories, reconciliation.isCountBalanced ? '✓ SEIMBANG 100%' : '❌ TIDAK SEIMBANG'],
      ['Total Baris Masukan Income', reconciliation.totalIncomeRows, 'Sesuai File Sumber'],
      ['Selisih Baris', reconciliation.totalIncomeRows - reconciliation.sumCategories, 'Harus 0'],
      [],
      ['3. PEMERIKSAAN DUPLIKASI DATA', 'JUMLAH POLA', 'KETERANGAN'],
      ['Pola Duplikat (Order + SKU Identik)', duplicates.length, duplicates.length === 0 ? 'Bersih (Tidak Ada Duplikasi)' : 'Periksa Detail di Bawah'],
    ];

    if (duplicates.length > 0) {
      auditData.push([]);
      auditData.push(['DAFTAR POLA DUPLIKAT TERDETEKSI']);
      auditData.push(['No. Pesanan', 'SKU', 'Frekuensi Muncul', 'Baris ke-']);
      for (const dup of duplicates.slice(0, 100)) {
        auditData.push([dup.orderNumber, dup.sku, dup.count, dup.rowIndices.join(', ')]);
      }
    }

    const wsAudit = XLSX.utils.aoa_to_sheet(auditData);
    wsAudit['!cols'] = [{ wch: 50 }, { wch: 25 }, { wch: 45 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(wb, wsAudit, '08_MATCHING_AUDIT');

    // ==============================================================
    // 09_UNMATCHED (Section 16: All transactions that failed matching)
    // ==============================================================
    const unmatchedHeaders = [
      'No',
      'No Pesanan',
      'SKU Income',
      'Nama Produk Income',
      'Total Penghasilan',
      'Qty',
      'Status Matching',
      'Alasan & Catatan Audit',
    ];

    const unmatchedItems = results.filter((r) => r.matchStatus === 'NOT_FOUND');
    const unmatchedRows = unmatchedItems.map((item, idx) => [
      idx + 1,
      item.orderNumber,
      item.incomeSku,
      item.productName,
      item.incomeAmount !== undefined ? item.incomeAmount : item.totalIncome,
      '-',
      'Tidak Ditemukan',
      'No. Pesanan / SKU / Nama Produk tidak terdaftar pada All Order Bulan Ini maupun Bulan Lalu',
    ]);

    const unmatchedSheetData = [unmatchedHeaders, ...unmatchedRows];
    const wsUnmatched = XLSX.utils.aoa_to_sheet(unmatchedSheetData);
    wsUnmatched['!cols'] = calculateAutoWidths(unmatchedSheetData);
    if (unmatchedRows.length > 0) {
      wsUnmatched['!autofilter'] = { ref: `A1:H${unmatchedRows.length + 1}` };
    }
    wsUnmatched['!freeze'] = { xSplit: 0, ySplit: 1 };
    XLSX.utils.book_append_sheet(wb, wsUnmatched, '09_UNMATCHED');

    // ==============================================================
    // 10_SOURCE_INCOME (Traceability: Raw Income sample / rows)
    // ==============================================================
    let incomeSheetData: (string | number | boolean | null)[][] = [];
    if (rawIncomeRows && rawIncomeRows.length > 0) {
      incomeSheetData = rawIncomeRows.slice(0, 500); // cap max 500 rows for size efficiency
    } else {
      incomeSheetData = [
        ['DOKUMENTASI SUMBER DATA INCOME'],
        ['Total Baris Diproses:', results.length],
        ['Status:', 'Data Income terekonsiliasi penuh pada Sheet 02_DETAIL_TRANSAKSI.'],
      ];
    }
    const wsSrcIncome = XLSX.utils.aoa_to_sheet(incomeSheetData);
    wsSrcIncome['!cols'] = calculateAutoWidths(incomeSheetData);
    XLSX.utils.book_append_sheet(wb, wsSrcIncome, '10_SOURCE_INCOME');

    // ==============================================================
    // 11_SOURCE_ALL_ORDER (Traceability: Raw All Order rows)
    // ==============================================================
    let orderSrcData: (string | number | boolean | null)[][] = [];
    if (rawAllOrderCurrentRows && rawAllOrderCurrentRows.length > 0) {
      orderSrcData = rawAllOrderCurrentRows.slice(0, 500);
    } else {
      orderSrcData = [
        ['DOKUMENTASI SUMBER DATA ALL ORDER'],
        ['Keterangan:', 'Laporan pesanan bulan berjalan & bulan sebelumnya tervalidasi.'],
      ];
    }
    const wsSrcOrder = XLSX.utils.aoa_to_sheet(orderSrcData);
    wsSrcOrder['!cols'] = calculateAutoWidths(orderSrcData);
    XLSX.utils.book_append_sheet(wb, wsSrcOrder, '11_SOURCE_ALL_ORDER');

    // ==============================================================
    // 12_SOURCE_SETTLEMENT (Traceability: Settlement rows or notice)
    // ==============================================================
    let settlementSheetData: (string | number | boolean | null)[][] = [];
    if (rawSettlementRows && rawSettlementRows.length > 0) {
      settlementSheetData = rawSettlementRows.slice(0, 500);
    } else {
      settlementSheetData = [
        ['DOKUMENTASI SUMBER DATA SETTLEMENT'],
        ['Status File:', expenses.settlementAvailable ? 'Aktif' : 'Tidak Diunggah'],
        [
          'Catatan:',
          expenses.settlementAvailable
            ? 'Rincian pelepasan dana tervalidasi pada Sheet 06_EXPENSE_ANALYSIS.'
            : 'Laporan diekspor dalam Mode 1: Sales Report. Biaya per transaksi tidak diestimasi sesuai Aturan Finansial Section 3 & 25.',
        ],
      ];
    }
    const wsSrcSettlement = XLSX.utils.aoa_to_sheet(settlementSheetData);
    wsSrcSettlement['!cols'] = calculateAutoWidths(settlementSheetData);
    XLSX.utils.book_append_sheet(wb, wsSrcSettlement, '12_SOURCE_SETTLEMENT');

    // ==============================================================
    // WRITE FILE (Section 27: Shopee_Report_[PERIODE].xlsx)
    // ==============================================================
    const safePeriod = formatFilenamePeriod(period);
    const fileName = `Shopee_Report_${safePeriod}.xlsx`;

    XLSX.writeFile(wb, fileName, {
      bookType: 'xlsx',
      type: 'binary',
      compression: true,
    });

    return {
      success: true,
      fileName,
    };
  } catch (error) {
    console.error('Error exporting professional Excel report:', error);
    return {
      success: false,
      fileName: 'Laporan_Shopee_Professional.xlsx',
      error: error instanceof Error ? error.message : 'Gagal menghasilkan file Excel.',
    };
  }
}
