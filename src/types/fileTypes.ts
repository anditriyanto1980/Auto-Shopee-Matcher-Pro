export type FileCategory =
  | 'income'
  | 'all_order_current'
  | 'all_order_previous'
  | 'settlement';

export interface ExcelSheet {
  name: string;
  rowCount: number; // data rows excluding header
  columnCount: number;
  headerRowIndex: number;
  headers: string[];
}

export interface DetectedColumn {
  requiredName: string;
  originalHeader: string | null;
  columnIndex: number | null;
  isFound: boolean;
}

export interface FileValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  detectedColumns: DetectedColumn[];
  foundColumns: string[];
  missingColumns: string[];
  rowCount: number;
  columnCount: number;
  allHeaders: string[];
  previewRows: Record<string, any>[];
  totalFileRows: number;
  _rawData?: (string | number | boolean | null)[][];
  _headerRowIndex?: number;
}

export interface IncomeSummaryExpenseSubItem {
  name: string;
  amount: number;
}

export interface IncomeSummaryCategory {
  name: string;
  amount: number;
  subItems?: IncomeSummaryExpenseSubItem[];
}

export interface IncomeSummaryData {
  hasSummarySheet: boolean;
  username?: string;
  startDate?: string;
  endDate?: string;
  totalIncomeGross: number; // 1. Total Pendapatan (e.g. 138,515,379)
  subtotalPesanan: number;
  originalProductPrice: number;
  buyerRefund: number;
  voucherSubsidi: number;
  sellerVoucher: number;
  shopeeDiscount: number;
  totalPengeluaran: number; // 2. Total Pengeluaran (magnitude e.g. 33,562,411)
  shippingCostTotal: number;
  platformFeesTotal: number;
  adminFee: number;
  orderProcessingFee: number;
  paymentFee: number;
  freeShippingXtraTotal: number;
  serviceFeeTotal: number;
  transactionFee: number;
  shopeeLiveXtraFee: number;
  promotionFeeTotal: number;
  amsCommission: number;
  autoTopUpSaldo: number;
  otherFeesTotal: number;
  shippingProgramFee: number;
  totalYangDilepasNet: number; // 3. Total yang Dilepas (e.g. 104,952,968)
  categories: IncomeSummaryCategory[];
}

export interface UploadedFile {
  category: FileCategory;
  fileName: string;
  fileSize: number;
  fileType: string;
  status: 'idle' | 'parsing' | 'valid' | 'invalid' | 'error';
  errorMessage?: string;
  sheets: ExcelSheet[];
  activeSheetName: string;
  validation: FileValidationResult | null;
  uploadedAt: Date;
  rawRows?: (string | number | boolean | null)[][];
  headerRowIndex?: number;
  incomeSummary?: IncomeSummaryData | null;
}
