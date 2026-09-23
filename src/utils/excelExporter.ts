import * as XLSX from 'xlsx';
import { MatchedOrderItem } from '../types/matchingTypes';
import {
  AuditDuplicateItem,
  FinalReportSummary,
  ReconciliationResult,
} from '../types/reportTypes';
import { formatNumber, formatRupiah } from './formatters';

interface ExportExcelOptions {
  results: MatchedOrderItem[];
  summary: FinalReportSummary;
  reconciliation: ReconciliationResult;
  duplicates: AuditDuplicateItem[];
  period: string;
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
 * Exports complete multi-sheet operational report for Shopee reconciliation
 */
export function exportToExcel({
  results,
  summary,
  reconciliation,
  duplicates,
  period,
}: ExportExcelOptions): { success: boolean; fileName: string; error?: string } {
  try {
    const wb = XLSX.utils.book_new();

    // ==========================================
    // SHEET 1: Summary
    // ==========================================
    const summaryData = [
      ['LAPORAN INCOME SHOPEE'],
      ['Periode:', period],
      ['Tanggal Dibuat:', new Date().toLocaleString('id-ID')],
      [],
      ['RINGKASAN MATCHING', 'JUMLAH', 'PERSENTASE / KETERANGAN'],
      ['Total Data Income SKU', summary.totalIncomeSkuRows, '100.0%'],
      ['Exact SKU (Prioritas 1)', summary.exactSkuCount, `${summary.exactSkuPercentage.toFixed(1)}%`],
      ['SKU Induk Fallback (Prioritas 2)', summary.skuIndukFallbackCount, `${summary.skuIndukFallbackPercentage.toFixed(1)}%`],
      ['Nama Produk Fallback (Prioritas 3)', summary.productNameFallbackCount, `${summary.productNameFallbackPercentage.toFixed(1)}%`],
      ['Tidak Ditemukan', summary.notFoundCount, `${summary.notFoundPercentage.toFixed(1)}%`],
      [],
      ['TOTAL QTY & PENGHASILAN', 'NILAI', 'FORMAT'],
      ['Total Qty Pembelian Ditemukan', summary.totalQuantityFound, `${formatNumber(summary.totalQuantityFound)} pcs`],
      ['Total Penghasilan Shopee', summary.totalIncomeAmount, summary.formattedTotalIncome],
      [],
      ['REKONSILIASI HASIL', 'STATUS', 'VERIFIKASI'],
      ['Status Rekonsiliasi', reconciliation.status === 'SUCCESS' ? '✓ REKONSILIASI SUKSES' : '❌ GAGAL', 'Exact + SKU Induk + Nama Produk + Tidak Ditemukan = Total'],
      ['Total Baris Income', reconciliation.totalIncomeRows, 'Sesuai sumber Income'],
      ['Total Baris Hasil', reconciliation.totalMatchingRows, '100% baris diproses'],
      [],
      ['PEMERIKSAAN DUPLIKAT', 'JUMLAH', 'KETERANGAN'],
      ['Jumlah Potensi Duplikat', duplicates.length, duplicates.length > 0 ? '⚠ Terdapat kombinasi No. Pesanan + SKU berulang' : 'Tidak ada duplikat'],
    ];

    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    wsSummary['!cols'] = [{ wch: 34 }, { wch: 25 }, { wch: 40 }];
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

    // ==========================================
    // SHEET 2: Hasil
    // ==========================================
    const hasilHeaders = [
      'No.',
      'No. Pesanan',
      'SKU',
      'Nama Produk',
      'Total Penghasilan',
      'Qty Pembelian',
      'Status Matching',
      'Sumber All Order',
    ];

    const hasilRows = results.map((item, idx) => {
      const statusLabel =
        item.matchStatus === 'EXACT_SKU'
          ? 'Exact SKU'
          : item.matchStatus === 'SKU_INDUK_FALLBACK'
          ? 'SKU Induk Fallback'
          : item.matchStatus === 'PRODUCT_NAME_FALLBACK'
          ? 'Nama Produk Fallback'
          : 'Tidak Ditemukan';

      const sourceLabel =
        item.sourceMonth === 'current'
          ? 'All Order Bulan Ini'
          : item.sourceMonth === 'previous'
          ? 'All Order Bulan Lalu'
          : '-';

      return [
        idx + 1,
        item.orderNumber,
        item.incomeSku,
        item.productName || '-',
        typeof item.totalIncome === 'number'
          ? item.totalIncome
          : formatRupiah(item.totalIncome),
        item.quantity !== null && item.quantity !== undefined ? item.quantity : '-',
        statusLabel,
        sourceLabel,
      ];
    });

    const hasilSheetData = [hasilHeaders, ...hasilRows];
    const wsHasil = XLSX.utils.aoa_to_sheet(hasilSheetData);
    wsHasil['!cols'] = calculateAutoWidths(hasilSheetData);
    if (hasilRows.length > 0) {
      wsHasil['!autofilter'] = { ref: `A1:H${hasilRows.length + 1}` };
    }
    // Freeze top row
    wsHasil['!freeze'] = { xSplit: 0, ySplit: 1 };
    wsHasil['!views'] = [{ state: 'frozen', ySplit: 1 }];
    XLSX.utils.book_append_sheet(wb, wsHasil, 'Hasil');

    // ==========================================
    // SHEET 3: Tidak Cocok
    // ==========================================
    const tidakCocokHeaders = [
      'No.',
      'No. Pesanan',
      'SKU',
      'Nama Produk',
      'Total Penghasilan',
      'Qty Pembelian',
      'Status Matching',
      'Alasan',
    ];

    const tidakCocokItems = results.filter((r) => r.matchStatus === 'NOT_FOUND');
    const tidakCocokRows = tidakCocokItems.map((item, idx) => [
      idx + 1,
      item.orderNumber,
      item.incomeSku,
      item.productName || '-',
      typeof item.totalIncome === 'number'
        ? item.totalIncome
        : formatRupiah(item.totalIncome),
      '-',
      'Tidak Ditemukan',
      'SKU tidak ditemukan pada All Order bulan ini maupun bulan sebelumnya.',
    ]);

    const tidakCocokSheetData = [tidakCocokHeaders, ...tidakCocokRows];
    const wsTidakCocok = XLSX.utils.aoa_to_sheet(tidakCocokSheetData);
    wsTidakCocok['!cols'] = calculateAutoWidths(tidakCocokSheetData);
    if (tidakCocokRows.length > 0) {
      wsTidakCocok['!autofilter'] = { ref: `A1:H${tidakCocokRows.length + 1}` };
    }
    wsTidakCocok['!freeze'] = { xSplit: 0, ySplit: 1 };
    wsTidakCocok['!views'] = [{ state: 'frozen', ySplit: 1 }];
    XLSX.utils.book_append_sheet(wb, wsTidakCocok, 'Tidak Cocok');

    // ==========================================
    // SHEET 4: SKU Induk Fallback
    // ==========================================
    const fallbackHeaders = [
      'No.',
      'No. Pesanan',
      'SKU Income',
      'Nama Produk',
      'Qty Pembelian',
      'SKU Induk',
      'Sumber All Order',
      'Status Matching',
    ];

    const fallbackItems = results.filter((r) => r.matchStatus === 'SKU_INDUK_FALLBACK');
    const fallbackRows = fallbackItems.map((item, idx) => [
      idx + 1,
      item.orderNumber,
      item.incomeSku,
      item.productName || '-',
      item.quantity !== null && item.quantity !== undefined ? item.quantity : '-',
      item.allOrderParentSku || '-',
      item.sourceMonth === 'current'
        ? 'All Order Bulan Ini'
        : item.sourceMonth === 'previous'
        ? 'All Order Bulan Lalu'
        : '-',
      'SKU Induk Fallback',
    ]);

    const fallbackSheetData = [fallbackHeaders, ...fallbackRows];
    const wsFallback = XLSX.utils.aoa_to_sheet(fallbackSheetData);
    wsFallback['!cols'] = calculateAutoWidths(fallbackSheetData);
    if (fallbackRows.length > 0) {
      wsFallback['!autofilter'] = { ref: `A1:H${fallbackRows.length + 1}` };
    }
    wsFallback['!freeze'] = { xSplit: 0, ySplit: 1 };
    wsFallback['!views'] = [{ state: 'frozen', ySplit: 1 }];
    XLSX.utils.book_append_sheet(wb, wsFallback, 'SKU Induk Fallback');

    // ==========================================
    // SHEET 5: Nama Produk Fallback
    // ==========================================
    const prodFallbackHeaders = [
      'No.',
      'No. Pesanan',
      'SKU Income',
      'Nama Produk',
      'Qty Pembelian',
      'Sumber All Order',
      'Status Matching',
      'Keterangan',
    ];

    const prodFallbackItems = results.filter(
      (r) => r.matchStatus === 'PRODUCT_NAME_FALLBACK',
    );
    const prodFallbackRows = prodFallbackItems.map((item, idx) => [
      idx + 1,
      item.orderNumber,
      item.incomeSku,
      item.productName || '-',
      item.quantity !== null && item.quantity !== undefined ? item.quantity : '-',
      item.sourceMonth === 'current'
        ? 'All Order Bulan Ini'
        : item.sourceMonth === 'previous'
        ? 'All Order Bulan Lalu'
        : '-',
      'Nama Produk Fallback',
      'SKU & SKU Induk All Order kosong, berhasil cocok via Nama Produk identik',
    ]);

    const prodFallbackSheetData = [prodFallbackHeaders, ...prodFallbackRows];
    const wsProdFallback = XLSX.utils.aoa_to_sheet(prodFallbackSheetData);
    wsProdFallback['!cols'] = calculateAutoWidths(prodFallbackSheetData);
    if (prodFallbackRows.length > 0) {
      wsProdFallback['!autofilter'] = { ref: `A1:H${prodFallbackRows.length + 1}` };
    }
    wsProdFallback['!freeze'] = { xSplit: 0, ySplit: 1 };
    wsProdFallback['!views'] = [{ state: 'frozen', ySplit: 1 }];
    XLSX.utils.book_append_sheet(wb, wsProdFallback, 'Nama Produk Fallback');

    // ==========================================
    // SHEET 6: Audit
    // ==========================================
    const auditData: (string | number | boolean | null)[][] = [
      ['AUDIT REPORT & DATA RECONCILIATION'],
      ['Periode Laporan:', period],
      ['Generated At:', new Date().toLocaleString('id-ID')],
      [],
      ['1. MATCHING SUMMARY', 'JUMLAH BARIS', 'PERSENTASE'],
      ['Exact SKU (No. Pesanan + SKU)', summary.exactSkuCount, `${summary.exactSkuPercentage.toFixed(1)}%`],
      ['SKU Induk Fallback (No. Pesanan + SKU Induk)', summary.skuIndukFallbackCount, `${summary.skuIndukFallbackPercentage.toFixed(1)}%`],
      ['Nama Produk Fallback (No. Pesanan + Nama Produk)', summary.productNameFallbackCount, `${summary.productNameFallbackPercentage.toFixed(1)}%`],
      ['Tidak Ditemukan', summary.notFoundCount, `${summary.notFoundPercentage.toFixed(1)}%`],
      ['Total Data Income SKU', summary.totalIncomeSkuRows, '100%'],
      [],
      ['2. DUPLICATE CHECK', 'JUMLAH POTENSI DUPLIKAT', 'KETERANGAN'],
      ['Kombinasi No. Pesanan + SKU berulang', duplicates.length, duplicates.length > 0 ? 'Terdapat potensi duplikat untuk verifikasi manual' : 'Nihil'],
    ];

    if (duplicates.length > 0) {
      auditData.push(['No. Pesanan', 'SKU', 'Frekuensi Muncul', 'Nomor Baris di Laporan']);
      duplicates.forEach((d) => {
        auditData.push([d.orderNumber, d.sku, d.count, d.rowIndices.join(', ')]);
      });
    }

    auditData.push([]);
    auditData.push(['3. RECONCILIATION', 'NILAI', 'STATUS']);
    auditData.push(['Total Baris Income SKU', reconciliation.totalIncomeRows, 'Terdaftar di Income']);
    auditData.push(['Total Baris Hasil Matching', reconciliation.totalMatchingRows, 'Diproses Mesin Matching']);
    auditData.push(['Total Exact Match', reconciliation.exactCount, 'Match Priority 1']);
    auditData.push(['Total SKU Induk Fallback', reconciliation.fallbackCount, 'Match Priority 2']);
    auditData.push(['Total Nama Produk Fallback', reconciliation.productNameFallbackCount, 'Match Priority 3']);
    auditData.push(['Total Tidak Ditemukan', reconciliation.notFoundCount, 'Priority 4']);
    auditData.push([
      'Status Rekonsiliasi (Exact + Fallback1 + Fallback2 + Not Found == Total)',
      reconciliation.sumCategories,
      reconciliation.status === 'SUCCESS' ? '✓ REKONSILIASI BERHASIL (SEIMBANG)' : '❌ GAGAL',
    ]);

    const wsAudit = XLSX.utils.aoa_to_sheet(auditData);
    wsAudit['!cols'] = [{ wch: 35 }, { wch: 25 }, { wch: 35 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(wb, wsAudit, 'Audit');

    // ==========================================
    // Generate clean filename
    // Format: Laporan_Income_Shopee_[PERIODE].xlsx
    // Example: Laporan_Income_Shopee_September_2026.xlsx
    // ==========================================
    const sanitizedPeriod = period.replace(/[^a-zA-Z0-9_-]/g, '_');
    const fileName = `Laporan_Income_Shopee_${sanitizedPeriod}.xlsx`;

    // Trigger file download in browser
    XLSX.writeFile(wb, fileName);

    return { success: true, fileName };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('Export Excel failed:', err);
    return {
      success: false,
      fileName: '',
      error: `Export Excel gagal: ${errorMsg}. Data aplikasi tetap aman. Silakan coba kembali.`,
    };
  }
}
