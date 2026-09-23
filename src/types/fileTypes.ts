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
}
