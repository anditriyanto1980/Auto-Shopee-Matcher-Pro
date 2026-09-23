export type MatchStatus =
  | 'EXACT_SKU'
  | 'SKU_INDUK_FALLBACK'
  | 'PRODUCT_NAME_FALLBACK'
  | 'NOT_FOUND';

export interface OrderRowDetail {
  sourceMonth: 'current' | 'previous';
  sourceFileName: string;
  sourceRowIndex: number;
  orderNumber: string;
  sku: string;
  parentSku: string;
  quantity: number;
}

export interface MatchedOrderItem {
  id: string;
  orderNumber: string;
  incomeSku: string;
  productName: string;
  totalIncome: string | number;
  incomeAmount?: number;
  orderDate?: string;
  variation?: string;
  allOrderProductName?: string;
  allOrderVariation?: string;
  quantity: number | null; // null if NOT_FOUND
  matchStatus: MatchStatus;
  sourceFile: string | null;
  sourceMonth: 'current' | 'previous' | null;
  sourceRowIndex: number | null;
  allOrderSku: string | null;
  allOrderParentSku: string | null;
  matchedCount: number;
  matchedRowsDetail: OrderRowDetail[];
  incomeRowIndex: number;
}

export interface MatchingSummary {
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
}

export interface MatchingFilterState {
  status: 'ALL' | MatchStatus;
  searchQuery: string;
}
