import { MatchedOrderItem, MatchStatus } from './matchingTypes';

export type ReportMode = 'SALES_REPORT' | 'FINANCIAL_REPORT';

export interface FinalReportSummary {
  totalIncomeSkuRows: number;
  exactSkuCount: number;
  exactSkuPercentage: number;
  skuIndukFallbackCount: number;
  skuIndukFallbackPercentage: number;
  productNameFallbackCount: number;
  productNameFallbackPercentage: number;
  notFoundCount: number;
  notFoundPercentage: number;
  totalQuantityFound: number;
  totalIncomeAmount: number;
  formattedTotalIncome: string;
}

export interface AuditDuplicateItem {
  key: string;
  orderNumber: string;
  sku: string;
  count: number;
  rowIndices: number[];
}

export interface ReconciliationResult {
  totalIncomeRows: number;
  totalMatchingRows: number;
  exactCount: number;
  fallbackCount: number;
  productNameFallbackCount: number;
  notFoundCount: number;
  sumCategories: number;
  isCountBalanced: boolean;
  status: 'SUCCESS' | 'FAILED';
  errorMessage: string | null;
}

export interface ExportValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export type ReportTab =
  | 'executive_summary'
  | 'detail_transaksi'
  | 'order_summary'
  | 'product_analysis'
  | 'top_10'
  | 'expense_analysis'
  | 'daily_analysis'
  | 'audit'
  | 'unmatched'
  | 'hasil'
  | 'tidak_cocok'
  | 'sku_induk_fallback'
  | 'nama_produk_fallback';

// ==========================================
// PROFESSIONAL TRANSACTION LEDGER (Section 4)
// ==========================================
export interface TransactionLedgerRecord {
  no: number;
  orderNumber: string;
  orderDate: string;
  sku: string;
  productName: string;
  variation: string;
  quantity: number | null;
  unitPrice: number | null;
  grossRevenue: number;
  discount: number;
  shippingCost: number;
  adminFee: number;
  paymentFee: number;
  serviceFee: number;
  promotionFee: number;
  otherFee: number;
  refund: number;
  adjustment: number;
  totalExpense: number;
  netRevenue: number;
  margin: number | null;
  hpp: number | null;
  grossProfit: number | null;
  matchStatus: MatchStatus;
  matchType: string;
  sourceIncome: string;
  sourceAllOrder: string;
  sourceSettlement: string;
  sourceFile: string;
  sourceSheet?: string;
  sourceRow: number;
  auditNote: string;
}

// ==========================================
// ORDER SUMMARY (Section 10)
// ==========================================
export interface OrderSummaryRecord {
  orderNumber: string;
  orderDate: string;
  skuCount: number;
  totalQuantity: number;
  grossRevenue: number;
  discount: number;
  totalExpense: number;
  refund: number;
  netRevenue: number;
  margin: number | null;
  matchStatus: string;
  itemCount: number;
  isMultiSku: boolean;
  settlementVerified: boolean;
}

// ==========================================
// PRODUCT ANALYSIS (Section 11)
// ==========================================
export interface ProductAnalysisRecord {
  sku: string;
  productName: string;
  totalQuantity: number;
  totalOrder: number;
  totalRevenue: number;
  totalExpense: number;
  netRevenue: number;
  averageSellingPrice: number;
  hpp: number | null;
  grossProfit: number | null;
  grossMargin: number | null;
}

// ==========================================
// TOP 10 RANKINGS (Section 12 & 22)
// ==========================================
export interface Top10Rankings {
  byQty: ProductAnalysisRecord[];
  byRevenue: ProductAnalysisRecord[];
  byNetRevenue: ProductAnalysisRecord[];
  byOrderCount: ProductAnalysisRecord[];
  byExpense: ProductAnalysisRecord[];
  byGrossProfit?: ProductAnalysisRecord[];
}

// ==========================================
// EXPENSE ANALYSIS (Section 13)
// ==========================================
export interface ExpenseAnalysisItem {
  feeName: string;
  category: string;
  amount: number;
  percentageOfGross: number;
  isDeduction: boolean;
  note?: string;
}

export interface ExpenseAnalysisSummary {
  items: ExpenseAnalysisItem[];
  totalExpense: number;
  percentageOfGross: number;
  settlementAvailable: boolean;
  unallocatedPeriodExpense?: number;
}

// ==========================================
// DAILY ANALYSIS (Section 14)
// ==========================================
export interface DailyAnalysisRecord {
  date: string;
  orderCount: number;
  totalQuantity: number;
  grossRevenue: number;
  totalExpense: number;
  netRevenue: number;
  averageOrderValue: number;
}

// ==========================================
// FINANCIAL EXECUTIVE SUMMARY (Section 8)
// ==========================================
export interface FinancialExecutiveSummary {
  mode: ReportMode;
  totalOrders: number;
  totalUniqueSkus: number;
  totalQuantity: number;
  totalGrossRevenue: number;
  totalDiscount: number;
  totalExpense: number;
  totalRefund: number;
  netRevenue: number;
  averageOrderValue: number;
  averageRevenuePerSku: number;
  hpp: number | null;
  grossProfit: number | null;
  grossMargin: number | null;
  matchedOrderPercentage: number;
  unmatchedOrderCount: number;
  settlementOrderCount: number;
}

// ==========================================
// PRE-EXPORT VALIDATION (Section 24)
// ==========================================
export interface PreExportValidationCheckpoint {
  name: string;
  incomeValue?: number | string;
  allOrderValue?: number | string;
  settlementValue?: number | string;
  computedValue?: number | string;
  isBalanced: boolean;
  difference?: number;
  note: string;
}

export interface PreExportValidationResult {
  isPassed: boolean;
  status: 'SUCCESS' | 'WARNING';
  statusLabel: 'REKONSILIASI BERHASIL' | 'PERLU PEMERIKSAAN';
  checkpoints: PreExportValidationCheckpoint[];
  summaryMessage: string;
}

// ==========================================
// SETTLEMENT PARSED ORDER (Section 2)
// ==========================================
export interface SettlementRecord {
  orderNumber: string;
  orderDate?: string;
  grossAmount: number;
  discount: number;
  sellerVoucher: number;
  adminFee: number;
  serviceFee: number;
  paymentFee: number;
  shippingFee: number;
  promotionFee: number;
  otherFee: number;
  refund: number;
  adjustment: number;
  totalDeductions: number;
  netSettlementAmount: number;
  sourceRow: number;
}

