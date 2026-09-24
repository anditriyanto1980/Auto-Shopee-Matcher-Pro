import * as XLSX from 'xlsx';
import {
  FileCategory,
  ExcelSheet,
  DetectedColumn,
  FileValidationResult,
  UploadedFile,
  IncomeSummaryData,
} from '../types/fileTypes';
import { isShopeeIncomeSummarySheet, parseIncomeSummarySheet } from './incomeSummaryParser';

export const REQUIRED_INCOME_HEADERS = [
  'Lihat berdasarkan',
  'No. Pesanan',
  'ID Produk',
  'Nama Produk',
  'Total Penghasilan',
];

export const REQUIRED_ALL_ORDER_HEADERS = [
  'No. Pesanan',
  'Nomor Referensi SKU',
  'SKU Induk',
  'Jumlah',
];

export const REQUIRED_SETTLEMENT_HEADERS = [
  'No. Pesanan',
];

const VALID_EXTENSIONS = ['.xlsx', '.xls', '.csv'];

/**
 * Normalizes header string:
 * - trim leading & trailing whitespace
 * - lowercase
 * - normalize multiple whitespace to single space
 * - preserves essential punctuation like '.' in 'No. Pesanan'
 */
export function normalizeHeader(header: unknown): string {
  if (header === null || header === undefined) return '';
  return String(header)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

/**
 * Validates file extension
 */
export function validateFileExtension(filename: string): boolean {
  const lower = filename.toLowerCase();
  return VALID_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

/**
 * Reads an uploaded file into a SheetJS Workbook
 */
export async function readExcelFile(file: File): Promise<XLSX.WorkBook> {
  const buffer = await file.arrayBuffer();
  // read as array buffer
  const workbook = XLSX.read(buffer, {
    type: 'array',
    cellDates: true,
    cellNF: false,
    cellText: false,
  });
  return workbook;
}

/**
 * Analyzes sheet data rows and finds headers
 */
export function analyzeSheet(
  sheet: XLSX.WorkSheet,
  sheetName: string,
  requiredHeaders: string[],
): {
  sheetMeta: ExcelSheet;
  rawData: (string | number | boolean | null)[][];
  headerRowIndex: number;
  headers: string[];
} {
  // Convert sheet to array of arrays (2D array)
  const rawData: (string | number | boolean | null)[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: '',
    blankrows: false,
  });

  if (!rawData || rawData.length === 0) {
    return {
      sheetMeta: {
        name: sheetName,
        rowCount: 0,
        columnCount: 0,
        headerRowIndex: -1,
        headers: [],
      },
      rawData: [],
      headerRowIndex: -1,
      headers: [],
    };
  }

  // Find the most likely header row by scoring rows against required headers
  // Scan first 15 rows
  const maxScanRows = Math.min(rawData.length, 15);
  let bestHeaderRowIndex = 0;
  let maxScore = -1;

  const normalizedRequired = requiredHeaders.map(normalizeHeader);

  for (let r = 0; r < maxScanRows; r++) {
    const row = rawData[r];
    if (!row || !Array.isArray(row)) continue;

    let score = 0;
    const normalizedRowCells = row.map((cell) => normalizeHeader(cell));

    for (const req of normalizedRequired) {
      if (normalizedRowCells.includes(req)) {
        score++;
      }
    }

    if (score > maxScore) {
      maxScore = score;
      bestHeaderRowIndex = r;
    }
  }

  // If none matched, find the first non-empty row with multiple strings
  if (maxScore <= 0) {
    for (let r = 0; r < maxScanRows; r++) {
      const row = rawData[r];
      if (!row) continue;
      const textCells = row.filter((c) => typeof c === 'string' && c.trim().length > 0);
      if (textCells.length >= 2) {
        bestHeaderRowIndex = r;
        break;
      }
    }
  }

  const rawHeaderRow = rawData[bestHeaderRowIndex] || [];
  // Trim trailing empty cells in header
  let lastNonEmptyCol = rawHeaderRow.length - 1;
  while (lastNonEmptyCol >= 0 && (rawHeaderRow[lastNonEmptyCol] === '' || rawHeaderRow[lastNonEmptyCol] === null || rawHeaderRow[lastNonEmptyCol] === undefined)) {
    lastNonEmptyCol--;
  }

  const headers: string[] = [];
  for (let c = 0; c <= Math.max(lastNonEmptyCol, 0); c++) {
    const val = rawHeaderRow[c];
    headers.push(val !== undefined && val !== null ? String(val).trim() : `Kolom_${c + 1}`);
  }

  // Count data rows strictly after the header row
  const dataRowCount = Math.max(0, rawData.length - (bestHeaderRowIndex + 1));

  return {
    sheetMeta: {
      name: sheetName,
      rowCount: dataRowCount,
      columnCount: headers.length,
      headerRowIndex: bestHeaderRowIndex,
      headers,
    },
    rawData,
    headerRowIndex: bestHeaderRowIndex,
    headers,
  };
}

/**
 * Matches required headers with detected headers
 */
export function matchHeaders(
  detectedHeaders: string[],
  requiredHeaders: string[],
): {
  detectedColumns: DetectedColumn[];
  foundColumns: string[];
  missingColumns: string[];
} {
  const normalizedDetected = detectedHeaders.map((h) => normalizeHeader(h));
  const detectedColumns: DetectedColumn[] = [];
  const foundColumns: string[] = [];
  const missingColumns: string[] = [];

  for (const req of requiredHeaders) {
    const normReq = normalizeHeader(req);
    const colIndex = normalizedDetected.findIndex((h) => h === normReq);

    if (colIndex !== -1) {
      detectedColumns.push({
        requiredName: req,
        originalHeader: detectedHeaders[colIndex],
        columnIndex: colIndex,
        isFound: true,
      });
      foundColumns.push(req);
    } else {
      detectedColumns.push({
        requiredName: req,
        originalHeader: null,
        columnIndex: null,
        isFound: false,
      });
      missingColumns.push(req);
    }
  }

  return {
    detectedColumns,
    foundColumns,
    missingColumns,
  };
}

/**
 * Extracts max 20 rows of preview data
 */
export function getPreviewRows(
  rawData: (string | number | boolean | null)[][],
  headerRowIndex: number,
  headers: string[],
  detectedColumns: DetectedColumn[],
  maxRows = 20,
): Record<string, any>[] {
  const previewRows: Record<string, any>[] = [];
  const startRow = headerRowIndex + 1;
  const endRow = Math.min(rawData.length, startRow + maxRows);

  for (let r = startRow; r < endRow; r++) {
    const row = rawData[r];
    if (!row) continue;
    const rowObj: Record<string, any> = {
      _rowNum: r - headerRowIndex,
    };

    // Map each required column if found
    for (const col of detectedColumns) {
      if (col.isFound && col.columnIndex !== null) {
        const val = row[col.columnIndex];
        rowObj[col.requiredName] = val !== undefined && val !== null ? String(val) : '';
      } else {
        rowObj[col.requiredName] = '-';
      }
    }

    // Also map all raw headers for thoroughness
    for (let c = 0; c < headers.length; c++) {
      const hName = headers[c];
      const val = row[c];
      rowObj[`_raw_${hName}`] = val !== undefined && val !== null ? String(val) : '';
    }

    previewRows.push(rowObj);
  }

  return previewRows;
}

/**
 * Validates Income File
 */
export function validateIncomeSheet(
  sheet: XLSX.WorkSheet,
  sheetName: string,
): FileValidationResult {
  const { sheetMeta, rawData, headerRowIndex, headers } = analyzeSheet(
    sheet,
    sheetName,
    REQUIRED_INCOME_HEADERS,
  );

  const { detectedColumns, foundColumns, missingColumns } = matchHeaders(
    headers,
    REQUIRED_INCOME_HEADERS,
  );

  const errors: string[] = [];
  const warnings: string[] = [];

  if (headers.length === 0) {
    errors.push('Header tidak ditemukan.');
  }

  if (missingColumns.length > 0) {
    for (const missing of missingColumns) {
      errors.push(`Kolom wajib "${missing}" tidak ditemukan.`);
    }
  }

  if (sheetMeta.rowCount === 0) {
    warnings.push('File tidak memiliki baris data (kosong).');
  }

  const previewRows = getPreviewRows(
    rawData,
    headerRowIndex,
    headers,
    detectedColumns,
    20,
  );

  const valid = errors.length === 0;

  return {
    valid,
    errors,
    warnings,
    detectedColumns,
    foundColumns,
    missingColumns,
    rowCount: sheetMeta.rowCount,
    columnCount: sheetMeta.columnCount,
    allHeaders: headers,
    previewRows,
    totalFileRows: rawData.length,
    _rawData: rawData,
    _headerRowIndex: headerRowIndex,
  };
}

/**
 * Validates All Order File (current or previous month)
 */
export function validateAllOrderSheet(
  sheet: XLSX.WorkSheet,
  sheetName: string,
): FileValidationResult & { _rawData?: (string | number | boolean | null)[][]; _headerRowIndex?: number } {
  const { sheetMeta, rawData, headerRowIndex, headers } = analyzeSheet(
    sheet,
    sheetName,
    REQUIRED_ALL_ORDER_HEADERS,
  );

  const { detectedColumns, foundColumns, missingColumns } = matchHeaders(
    headers,
    REQUIRED_ALL_ORDER_HEADERS,
  );

  const errors: string[] = [];
  const warnings: string[] = [];

  if (headers.length === 0) {
    errors.push('Header tidak ditemukan.');
  }

  if (missingColumns.length > 0) {
    for (const missing of missingColumns) {
      errors.push(`Kolom wajib "${missing}" tidak ditemukan.`);
    }
  }

  if (sheetMeta.rowCount === 0) {
    warnings.push('File tidak memiliki baris data (kosong).');
  }

  const previewRows = getPreviewRows(
    rawData,
    headerRowIndex,
    headers,
    detectedColumns,
    20,
  );

  const valid = errors.length === 0;

  return {
    valid,
    errors,
    warnings,
    detectedColumns,
    foundColumns,
    missingColumns,
    rowCount: sheetMeta.rowCount,
    columnCount: sheetMeta.columnCount,
    allHeaders: headers,
    previewRows,
    totalFileRows: rawData.length,
    _rawData: rawData,
    _headerRowIndex: headerRowIndex,
  };
}

/**
 * Validates Settlement File
 */
export function validateSettlementSheet(
  sheet: XLSX.WorkSheet,
  sheetName: string,
): FileValidationResult & { _rawData?: (string | number | boolean | null)[][]; _headerRowIndex?: number } {
  const { sheetMeta, rawData, headerRowIndex, headers } = analyzeSheet(
    sheet,
    sheetName,
    REQUIRED_SETTLEMENT_HEADERS,
  );

  const { detectedColumns, foundColumns, missingColumns } = matchHeaders(
    headers,
    REQUIRED_SETTLEMENT_HEADERS,
  );

  const errors: string[] = [];
  const warnings: string[] = [];

  if (headers.length === 0) {
    errors.push('Header tidak ditemukan.');
  }

  if (missingColumns.length > 0) {
    for (const missing of missingColumns) {
      errors.push(`Kolom identifikasi "${missing}" tidak ditemukan pada laporan settlement.`);
    }
  }

  if (sheetMeta.rowCount === 0) {
    warnings.push('File settlement tidak memiliki baris data.');
  }

  const previewRows = getPreviewRows(
    rawData,
    headerRowIndex,
    headers,
    detectedColumns,
    20,
  );

  const valid = errors.length === 0;

  return {
    valid,
    errors,
    warnings,
    detectedColumns,
    foundColumns,
    missingColumns,
    rowCount: sheetMeta.rowCount,
    columnCount: sheetMeta.columnCount,
    allHeaders: headers,
    previewRows,
    totalFileRows: rawData.length,
    _rawData: rawData,
    _headerRowIndex: headerRowIndex,
  };
}

/**
 * Process uploaded file completely
 */
export async function processUploadedFile(
  file: File,
  category: FileCategory,
  selectedSheetName?: string,
): Promise<UploadedFile> {
  const uploadedFile: UploadedFile = {
    category,
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type || (file.name.endsWith('.csv') ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'),
    status: 'parsing',
    sheets: [],
    activeSheetName: '',
    validation: null,
    uploadedAt: new Date(),
  };

  // Step 1: Validate file extension
  if (!validateFileExtension(file.name)) {
    uploadedFile.status = 'invalid';
    uploadedFile.errorMessage = 'Format file tidak didukung. Gunakan XLSX, XLS, atau CSV.';
    return uploadedFile;
  }

  // Step 2: Read workbook
  let workbook: XLSX.WorkBook;
  try {
    workbook = await readExcelFile(file);
  } catch (err) {
    uploadedFile.status = 'error';
    uploadedFile.errorMessage = 'File tidak dapat dibaca atau rusak.';
    return uploadedFile;
  }

  // Step 3: Check sheets
  const sheetNames = workbook.SheetNames || [];
  if (sheetNames.length === 0) {
    uploadedFile.status = 'error';
    uploadedFile.errorMessage = 'Sheet tidak ditemukan di dalam file.';
    return uploadedFile;
  }

  // Step 4: Detect sheets & determine best active sheet
  const requiredHeaders =
    category === 'income'
      ? REQUIRED_INCOME_HEADERS
      : category === 'settlement'
      ? REQUIRED_SETTLEMENT_HEADERS
      : REQUIRED_ALL_ORDER_HEADERS;

  const sheetsMeta: ExcelSheet[] = [];
  let bestSheetName = sheetNames[0];
  let bestMatchedCount = -1;

  for (const sName of sheetNames) {
    const s = workbook.Sheets[sName];
    const { sheetMeta, headers } = analyzeSheet(s, sName, requiredHeaders);
    sheetsMeta.push(sheetMeta);

    // Calculate match score
    const { foundColumns } = matchHeaders(headers, requiredHeaders);
    if (foundColumns.length > bestMatchedCount) {
      bestMatchedCount = foundColumns.length;
      bestSheetName = sName;
    }
  }

  const targetSheetName = selectedSheetName && sheetNames.includes(selectedSheetName)
    ? selectedSheetName
    : bestSheetName;

  uploadedFile.sheets = sheetsMeta;
  uploadedFile.activeSheetName = targetSheetName;

  const targetSheet = workbook.Sheets[targetSheetName];
  if (!targetSheet) {
    uploadedFile.status = 'error';
    uploadedFile.errorMessage = `Sheet "${targetSheetName}" tidak ditemukan.`;
    return uploadedFile;
  }

  // Step 5: Validate sheet according to category
  let validationResult: FileValidationResult & { _rawData?: (string | number | boolean | null)[][]; _headerRowIndex?: number };
  let incomeSummary: IncomeSummaryData | null = null;

  if (category === 'income') {
    validationResult = validateIncomeSheet(targetSheet, targetSheetName);

    // Also look for a Summary sheet in the workbook to capture official settlement totals
    for (const sName of sheetNames) {
      const s = workbook.Sheets[sName];
      const lower = sName.toLowerCase();
      if (lower.includes('summary') || lower.includes('ringkasan') || isShopeeIncomeSummarySheet(s)) {
        const parsed = parseIncomeSummarySheet(s);
        if (parsed) {
          incomeSummary = parsed;
          break;
        }
      }
    }
  } else if (category === 'settlement') {
    validationResult = validateSettlementSheet(targetSheet, targetSheetName);
  } else {
    validationResult = validateAllOrderSheet(targetSheet, targetSheetName);
  }

  uploadedFile.validation = validationResult;
  uploadedFile.rawRows = validationResult._rawData;
  uploadedFile.headerRowIndex = validationResult._headerRowIndex;
  uploadedFile.incomeSummary = incomeSummary;
  uploadedFile.status = validationResult.valid ? 'valid' : 'invalid';

  return uploadedFile;
}
