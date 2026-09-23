import { MatchedOrderItem, MatchStatus } from './matchingTypes';

export interface FinalReportSummary {
  totalIncomeSkuRows: number;
  exactSkuCount: number;
  exactSkuPercentage: number;
  skuIndukFallbackCount: number;
  skuIndukFallbackPercentage: number;
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

export type ReportTab = 'hasil' | 'tidak_cocok' | 'sku_induk_fallback' | 'audit';
