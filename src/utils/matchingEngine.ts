import { UploadedFile } from '../types/fileTypes';
import {
  MatchedOrderItem,
  MatchingSummary,
  MatchStatus,
  OrderRowDetail,
} from '../types/matchingTypes';
import { normalizeHeader } from './excelParser';

/**
 * Normalizes keys for order number and SKU:
 * - trim whitespace
 * - convert to string
 * - uppercase
 * - remove trailing '.0' only if it represents an integer number from Excel
 */
export function normalizeKey(val: unknown): string {
  if (val === null || val === undefined) return '';
  let str = String(val).trim();
  if (/^-?\d+\.0$/.test(str)) {
    str = str.slice(0, -2);
  }
  return str.toUpperCase();
}

/**
 * Safely parse quantity from string or number
 */
export function parseQuantity(val: unknown): number {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  const cleaned = String(val).trim().replace(/,/g, '.');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

interface InternalOrderRow {
  sourceMonth: 'current' | 'previous';
  sourceFileName: string;
  sourceRowIndex: number;
  orderNumber: string;
  sku: string;
  parentSku: string;
  quantity: number;
  normalizedOrder: string;
  normalizedSku: string;
  normalizedParentSku: string;
}

interface OrderIndex {
  exactMap: Map<string, InternalOrderRow[]>;
  parentMap: Map<string, InternalOrderRow[]>;
}

/**
 * Builds lookup indexes for an All Order file
 */
function buildOrderIndex(
  file: UploadedFile,
  sourceMonth: 'current' | 'previous',
): OrderIndex {
  const exactMap = new Map<string, InternalOrderRow[]>();
  const parentMap = new Map<string, InternalOrderRow[]>();

  if (!file.rawRows || !file.validation) {
    return { exactMap, parentMap };
  }

  const rawRows = file.rawRows;
  const headerRowIndex = file.headerRowIndex ?? 0;
  const headers = file.validation.allHeaders || [];

  // Find column indices
  const normHeaders = headers.map(normalizeHeader);
  const orderCol = normHeaders.indexOf('no. pesanan');
  const skuCol = normHeaders.indexOf('nomor referensi sku');
  const parentSkuCol = normHeaders.indexOf('sku induk');
  const qtyCol = normHeaders.indexOf('jumlah');

  if (orderCol === -1 || qtyCol === -1) {
    return { exactMap, parentMap };
  }

  for (let r = headerRowIndex + 1; r < rawRows.length; r++) {
    const row = rawRows[r];
    if (!row || row.length === 0) continue;

    const rawOrder = row[orderCol];
    const rawSku = skuCol !== -1 ? row[skuCol] : '';
    const rawParentSku = parentSkuCol !== -1 ? row[parentSkuCol] : '';
    const rawQty = row[qtyCol];

    const normalizedOrder = normalizeKey(rawOrder);
    const normalizedSku = normalizeKey(rawSku);
    const normalizedParentSku = normalizeKey(rawParentSku);
    const quantity = parseQuantity(rawQty);

    if (!normalizedOrder) continue;

    const orderRow: InternalOrderRow = {
      sourceMonth,
      sourceFileName: file.fileName,
      sourceRowIndex: r - headerRowIndex,
      orderNumber: String(rawOrder || '').trim(),
      sku: String(rawSku || '').trim(),
      parentSku: String(rawParentSku || '').trim(),
      quantity,
      normalizedOrder,
      normalizedSku,
      normalizedParentSku,
    };

    // Index by Exact SKU: order + '|||' + sku
    if (normalizedSku) {
      const exactKey = `${normalizedOrder}|||${normalizedSku}`;
      const existing = exactMap.get(exactKey) || [];
      existing.push(orderRow);
      exactMap.set(exactKey, existing);
    }

    // Index by Parent SKU: order + '|||' + parentSku
    if (normalizedParentSku) {
      const parentKey = `${normalizedOrder}|||${normalizedParentSku}`;
      const existing = parentMap.get(parentKey) || [];
      existing.push(orderRow);
      parentMap.set(parentKey, existing);
    }
  }

  return { exactMap, parentMap };
}

/**
 * Runs the matching engine across Income, All Order Current, and All Order Previous
 */
export function runMatchingEngine(
  incomeFile: UploadedFile,
  currentOrderFile: UploadedFile,
  previousOrderFile: UploadedFile,
): {
  results: MatchedOrderItem[];
  summary: MatchingSummary;
} {
  if (!incomeFile.rawRows || !incomeFile.validation) {
    return {
      results: [],
      summary: {
        totalIncomeSkuRows: 0,
        exactSkuCount: 0,
        exactSkuPercentage: 0,
        skuIndukFallbackCount: 0,
        skuIndukFallbackPercentage: 0,
        notFoundCount: 0,
        notFoundPercentage: 0,
        totalQuantityFound: 0,
      },
    };
  }

  // 1. Build indexes for both order files
  const currentIndex = buildOrderIndex(currentOrderFile, 'current');
  const prevIndex = buildOrderIndex(previousOrderFile, 'previous');

  // 2. Identify Income columns
  const rawIncomeRows = incomeFile.rawRows;
  const incomeHeaderRowIdx = incomeFile.headerRowIndex ?? 0;
  const incomeHeaders = incomeFile.validation.allHeaders || [];
  const normIncomeHeaders = incomeHeaders.map(normalizeHeader);

  const viewByCol = normIncomeHeaders.indexOf('lihat berdasarkan');
  const orderCol = normIncomeHeaders.indexOf('no. pesanan');
  const skuCol = normIncomeHeaders.indexOf('id produk');
  const productNameCol = normIncomeHeaders.indexOf('nama produk');
  const incomeCol = normIncomeHeaders.indexOf('total penghasilan');

  // Check if there are rows where "Lihat berdasarkan" = "sku"
  let hasSkuFilterRows = false;
  if (viewByCol !== -1) {
    for (let r = incomeHeaderRowIdx + 1; r < rawIncomeRows.length; r++) {
      const row = rawIncomeRows[r];
      if (row && String(row[viewByCol] || '').trim().toLowerCase() === 'sku') {
        hasSkuFilterRows = true;
        break;
      }
    }
  }

  const results: MatchedOrderItem[] = [];
  let exactSkuCount = 0;
  let skuIndukFallbackCount = 0;
  let notFoundCount = 0;
  let totalQuantityFound = 0;

  for (let r = incomeHeaderRowIdx + 1; r < rawIncomeRows.length; r++) {
    const row = rawIncomeRows[r];
    if (!row || row.length === 0) continue;

    // Filter by "Lihat berdasarkan" = "Sku" if applicable
    if (viewByCol !== -1 && hasSkuFilterRows) {
      const viewByVal = String(row[viewByCol] || '').trim().toLowerCase();
      if (viewByVal !== 'sku') {
        continue;
      }
    }

    const rawOrder = orderCol !== -1 ? row[orderCol] : '';
    const rawSku = skuCol !== -1 ? row[skuCol] : '';
    const rawProductName = productNameCol !== -1 ? row[productNameCol] : '';
    const rawTotalIncome = incomeCol !== -1 ? row[incomeCol] : '';

    const normalizedOrder = normalizeKey(rawOrder);
    const normalizedSku = normalizeKey(rawSku);

    const compositeKey = `${normalizedOrder}|||${normalizedSku}`;

    let matchStatus: MatchStatus = 'NOT_FOUND';
    let matchedRows: InternalOrderRow[] = [];
    let sourceMonth: 'current' | 'previous' | null = null;
    let sourceFile: string | null = null;
    let allOrderSku: string | null = null;
    let allOrderParentSku: string | null = null;

    // PRIORITY 1: No. Pesanan + Exact SKU
    // Search Order Bulan Ini first
    const currentExact = currentIndex.exactMap.get(compositeKey);
    if (currentExact && currentExact.length > 0) {
      matchStatus = 'EXACT_SKU';
      matchedRows = currentExact;
      sourceMonth = 'current';
      sourceFile = currentOrderFile.fileName;
      allOrderSku = currentExact[0].sku;
      allOrderParentSku = currentExact[0].parentSku;
    } else {
      // Search Order Bulan Sebelumnya
      const prevExact = prevIndex.exactMap.get(compositeKey);
      if (prevExact && prevExact.length > 0) {
        matchStatus = 'EXACT_SKU';
        matchedRows = prevExact;
        sourceMonth = 'previous';
        sourceFile = previousOrderFile.fileName;
        allOrderSku = prevExact[0].sku;
        allOrderParentSku = prevExact[0].parentSku;
      }
    }

    // PRIORITY 2: SKU Induk Fallback (if Priority 1 not matched)
    if (matchStatus === 'NOT_FOUND') {
      const currentParent = currentIndex.parentMap.get(compositeKey);
      if (currentParent && currentParent.length > 0) {
        matchStatus = 'SKU_INDUK_FALLBACK';
        matchedRows = currentParent;
        sourceMonth = 'current';
        sourceFile = currentOrderFile.fileName;
        allOrderSku = currentParent[0].sku;
        allOrderParentSku = currentParent[0].parentSku;
      } else {
        const prevParent = prevIndex.parentMap.get(compositeKey);
        if (prevParent && prevParent.length > 0) {
          matchStatus = 'SKU_INDUK_FALLBACK';
          matchedRows = prevParent;
          sourceMonth = 'previous';
          sourceFile = previousOrderFile.fileName;
          allOrderSku = prevParent[0].sku;
          allOrderParentSku = prevParent[0].parentSku;
        }
      }
    }

    // Calculate final Qty
    let quantity: number | null = null;
    if (matchStatus !== 'NOT_FOUND' && matchedRows.length > 0) {
      const sumQty = matchedRows.reduce((acc, curr) => acc + curr.quantity, 0);
      quantity = sumQty;
      totalQuantityFound += sumQty;

      if (matchStatus === 'EXACT_SKU') {
        exactSkuCount++;
      } else if (matchStatus === 'SKU_INDUK_FALLBACK') {
        skuIndukFallbackCount++;
      }
    } else {
      matchStatus = 'NOT_FOUND';
      quantity = null;
      notFoundCount++;
    }

    const orderRowDetails: OrderRowDetail[] = matchedRows.map((mr) => ({
      sourceMonth: mr.sourceMonth,
      sourceFileName: mr.sourceFileName,
      sourceRowIndex: mr.sourceRowIndex,
      orderNumber: mr.orderNumber,
      sku: mr.sku,
      parentSku: mr.parentSku,
      quantity: mr.quantity,
    }));

    results.push({
      id: `income-row-${r}-${normalizedOrder}-${normalizedSku}`,
      orderNumber: String(rawOrder || '').trim(),
      incomeSku: String(rawSku || '').trim(),
      productName: String(rawProductName || '').trim(),
      totalIncome:
        rawTotalIncome !== undefined && rawTotalIncome !== null
          ? typeof rawTotalIncome === 'number'
            ? rawTotalIncome
            : String(rawTotalIncome)
          : '',
      quantity,
      matchStatus,
      sourceFile,
      sourceMonth,
      sourceRowIndex: matchedRows.length > 0 ? matchedRows[0].sourceRowIndex : null,
      allOrderSku,
      allOrderParentSku,
      matchedCount: matchedRows.length,
      matchedRowsDetail: orderRowDetails,
      incomeRowIndex: r - incomeHeaderRowIdx,
    });
  }

  const totalIncomeSkuRows = results.length;
  const exactSkuPercentage = totalIncomeSkuRows > 0 ? (exactSkuCount / totalIncomeSkuRows) * 100 : 0;
  const skuIndukFallbackPercentage = totalIncomeSkuRows > 0 ? (skuIndukFallbackCount / totalIncomeSkuRows) * 100 : 0;
  const notFoundPercentage = totalIncomeSkuRows > 0 ? (notFoundCount / totalIncomeSkuRows) * 100 : 0;

  return {
    results,
    summary: {
      totalIncomeSkuRows,
      exactSkuCount,
      exactSkuPercentage,
      skuIndukFallbackCount,
      skuIndukFallbackPercentage,
      notFoundCount,
      notFoundPercentage,
      totalQuantityFound,
    },
  };
}
