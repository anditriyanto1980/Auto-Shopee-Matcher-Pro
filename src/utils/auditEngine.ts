import { MatchedOrderItem } from '../types/matchingTypes';
import {
  AuditDuplicateItem,
  ExportValidationResult,
  FinalReportSummary,
  ReconciliationResult,
} from '../types/reportTypes';
import { formatRupiah } from './formatters';

/**
 * Computes summary statistics directly from actual matching results.
 * Strictly uses existing matching results without recalculating matching logic.
 */
export function computeReportSummary(results: MatchedOrderItem[]): FinalReportSummary {
  let exactSkuCount = 0;
  let skuIndukFallbackCount = 0;
  let productNameFallbackCount = 0;
  let notFoundCount = 0;
  let totalQuantityFound = 0;
  let totalIncomeAmount = 0;

  for (const item of results) {
    if (item.matchStatus === 'EXACT_SKU') {
      exactSkuCount++;
    } else if (item.matchStatus === 'SKU_INDUK_FALLBACK') {
      skuIndukFallbackCount++;
    } else if (item.matchStatus === 'PRODUCT_NAME_FALLBACK') {
      productNameFallbackCount++;
    } else {
      notFoundCount++;
    }

    if (item.quantity !== null && item.quantity !== undefined) {
      totalQuantityFound += item.quantity;
    }

    // Safely aggregate income amount for display purposes only
    if (typeof item.totalIncome === 'number') {
      totalIncomeAmount += isNaN(item.totalIncome) ? 0 : item.totalIncome;
    } else if (typeof item.totalIncome === 'string') {
      const cleaned = item.totalIncome.replace(/[^0-9.-]+/g, '');
      const parsed = parseFloat(cleaned);
      if (!isNaN(parsed)) {
        totalIncomeAmount += parsed;
      }
    }
  }

  const totalIncomeSkuRows = results.length;
  const exactSkuPercentage =
    totalIncomeSkuRows > 0 ? (exactSkuCount / totalIncomeSkuRows) * 100 : 0;
  const skuIndukFallbackPercentage =
    totalIncomeSkuRows > 0 ? (skuIndukFallbackCount / totalIncomeSkuRows) * 100 : 0;
  const productNameFallbackPercentage =
    totalIncomeSkuRows > 0 ? (productNameFallbackCount / totalIncomeSkuRows) * 100 : 0;
  const notFoundPercentage =
    totalIncomeSkuRows > 0 ? (notFoundCount / totalIncomeSkuRows) * 100 : 0;

  return {
    totalIncomeSkuRows,
    exactSkuCount,
    exactSkuPercentage,
    skuIndukFallbackCount,
    skuIndukFallbackPercentage,
    productNameFallbackCount,
    productNameFallbackPercentage,
    notFoundCount,
    notFoundPercentage,
    totalQuantityFound,
    totalIncomeAmount,
    formattedTotalIncome: formatRupiah(totalIncomeAmount),
  };
}

/**
 * Checks for duplicate combinations of No. Pesanan + SKU in Income results.
 * Does NOT merge or delete rows - strictly identifies for review/warning.
 */
export function detectDuplicates(
  results: MatchedOrderItem[],
): {
  duplicates: AuditDuplicateItem[];
  duplicateKeySet: Set<string>;
  totalDuplicateRows: number;
} {
  const map = new Map<string, { orderNumber: string; sku: string; indices: number[] }>();

  results.forEach((item, idx) => {
    const key = `${item.orderNumber.trim().toUpperCase()}|||${item.incomeSku.trim().toUpperCase()}`;
    const existing = map.get(key);
    if (existing) {
      existing.indices.push(idx + 1);
    } else {
      map.set(key, {
        orderNumber: item.orderNumber,
        sku: item.incomeSku,
        indices: [idx + 1],
      });
    }
  });

  const duplicates: AuditDuplicateItem[] = [];
  const duplicateKeySet = new Set<string>();
  let totalDuplicateRows = 0;

  map.forEach((val, key) => {
    if (val.indices.length > 1) {
      duplicates.push({
        key,
        orderNumber: val.orderNumber,
        sku: val.sku,
        count: val.indices.length,
        rowIndices: val.indices,
      });
      duplicateKeySet.add(key);
      totalDuplicateRows += val.indices.length;
    }
  });

  return { duplicates, duplicateKeySet, totalDuplicateRows };
}

/**
 * Performs reconciliation check on line items:
 * Exact + SKU Induk Fallback + Nama Produk Fallback + Tidak Ditemukan == Total hasil matching
 */
export function performReconciliation(
  totalIncomeRows: number,
  results: MatchedOrderItem[],
): ReconciliationResult {
  const exactCount = results.filter((r) => r.matchStatus === 'EXACT_SKU').length;
  const fallbackCount = results.filter((r) => r.matchStatus === 'SKU_INDUK_FALLBACK').length;
  const productNameFallbackCount = results.filter(
    (r) => r.matchStatus === 'PRODUCT_NAME_FALLBACK',
  ).length;
  const notFoundCount = results.filter((r) => r.matchStatus === 'NOT_FOUND').length;
  const totalMatchingRows = results.length;

  const sumCategories =
    exactCount + fallbackCount + productNameFallbackCount + notFoundCount;
  const isCountBalanced = sumCategories === totalMatchingRows;
  const isTotalRowsMatched = totalMatchingRows === totalIncomeRows;

  let status: 'SUCCESS' | 'FAILED' = 'SUCCESS';
  let errorMessage: string | null = null;

  if (!isCountBalanced) {
    status = 'FAILED';
    errorMessage = `Rekonsiliasi jumlah baris gagal: Total kategori (${sumCategories}) tidak sama dengan Total hasil matching (${totalMatchingRows}).`;
  } else if (!isTotalRowsMatched) {
    status = 'FAILED';
    errorMessage = `Rekonsiliasi jumlah baris gagal: Total hasil matching (${totalMatchingRows}) tidak sama dengan Total baris Income SKU (${totalIncomeRows}).`;
  }

  return {
    totalIncomeRows,
    totalMatchingRows,
    exactCount,
    fallbackCount,
    productNameFallbackCount,
    notFoundCount,
    sumCategories,
    isCountBalanced,
    status,
    errorMessage,
  };
}

/**
 * Extracts human-readable period from file names or timestamps
 */
export function extractReportPeriod(
  incomeFileName?: string,
  results?: MatchedOrderItem[],
): string {
  // Try to parse from filename first (e.g. Order.all.20260901_20260930 or Income_September_2026)
  if (incomeFileName) {
    const fn = incomeFileName;
    // Check for months in Indonesian or English
    const monthsId: Record<string, string> = {
      januari: 'Januari',
      februari: 'Februari',
      maret: 'Maret',
      april: 'April',
      mei: 'Mei',
      juni: 'Juni',
      juli: 'Juli',
      agustus: 'Agustus',
      september: 'September',
      oktober: 'Oktober',
      november: 'November',
      desember: 'Desember',
    };

    const fnLower = fn.toLowerCase();
    for (const [mKey, mVal] of Object.entries(monthsId)) {
      if (fnLower.includes(mKey)) {
        const yearMatch = fn.match(/20\d{2}/);
        const year = yearMatch ? yearMatch[0] : new Date().getFullYear();
        return `${mVal} ${year}`;
      }
    }

    // Check for YYYYMM format in filename (e.g. 202609)
    const yyyymm = fn.match(/20(\d{2})(0[1-9]|1[0-2])/);
    if (yyyymm) {
      const year = `20${yyyymm[1]}`;
      const monthNum = parseInt(yyyymm[2], 10);
      const idMonths = [
        '',
        'Januari',
        'Februari',
        'Maret',
        'April',
        'Mei',
        'Juni',
        'Juli',
        'Agustus',
        'September',
        'Oktober',
        'November',
        'Desember',
      ];
      return `${idMonths[monthNum]} ${year}`;
    }
  }

  // Fallback: Default to current date month/year
  const now = new Date();
  const idMonths = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
  ];
  return `${idMonths[now.getMonth()]} ${now.getFullYear()}`;
}

/**
 * Validates report dataset prior to Excel export.
 * If any critical validation fails, export will be cancelled.
 */
export function validateReportForExport(
  results: MatchedOrderItem[],
  summary: FinalReportSummary,
  reconciliation: ReconciliationResult,
): ExportValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Semua hasil matching memiliki No. Pesanan
  const missingOrder = results.filter((r) => !r.orderNumber || !r.orderNumber.trim());
  if (missingOrder.length > 0) {
    errors.push(
      `Terdapat ${missingOrder.length} baris matching tanpa No. Pesanan yang valid.`,
    );
  }

  // 2. Semua hasil matching memiliki status
  const missingStatus = results.filter((r) => !r.matchStatus);
  if (missingStatus.length > 0) {
    errors.push(
      `Terdapat ${missingStatus.length} baris matching tanpa status matching.`,
    );
  }

  // 3. Exact + Fallback + Tidak Ditemukan = Total hasil
  if (reconciliation.status === 'FAILED') {
    errors.push(reconciliation.errorMessage || 'Rekonsiliasi jumlah baris gagal.');
  }

  // 4. Tidak ada data yang hilang saat transformasi
  if (results.length === 0) {
    errors.push('Data hasil matching kosong (0 baris).');
  }

  // 5. Total Penghasilan Final Report sama dengan sumber hasil matching
  let computedIncome = 0;
  for (const item of results) {
    if (typeof item.totalIncome === 'number') {
      computedIncome += isNaN(item.totalIncome) ? 0 : item.totalIncome;
    } else if (typeof item.totalIncome === 'string') {
      const cleaned = item.totalIncome.replace(/[^0-9.-]+/g, '');
      const parsed = parseFloat(cleaned);
      if (!isNaN(parsed)) {
        computedIncome += parsed;
      }
    }
  }

  if (Math.abs(computedIncome - summary.totalIncomeAmount) > 0.01) {
    errors.push(
      `Total Penghasilan Final Report (${computedIncome}) berbeda dengan summary (${summary.totalIncomeAmount}).`,
    );
  }

  // 6. Total Qty Final Report sama dengan hasil Matching Engine
  let computedQty = 0;
  for (const item of results) {
    if (item.quantity !== null && item.quantity !== undefined) {
      computedQty += item.quantity;
    }
  }

  if (computedQty !== summary.totalQuantityFound) {
    errors.push(
      `Total Qty Final Report (${computedQty}) tidak sama dengan summary Matching Engine (${summary.totalQuantityFound}).`,
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
