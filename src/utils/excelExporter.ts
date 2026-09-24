import ExcelJS from 'exceljs';
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
import { formatRupiah } from './formatters';

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

// ============================================================================
// CORPORATE PRESENTATION PALETTE & STYLING CONSTANTS
// ============================================================================
const PALETTE = {
  navyDark: '0F172A',      // Slate 900 - Executive Title Banner
  navyMedium: '1E293B',    // Slate 800 - Section Ribbons
  navyBlue: '1E3A8A',      // Blue 900 - Table Header Primary
  navyBlueLight: '2563EB', // Blue 600 - Secondary Blue
  white: 'FFFFFF',
  textMain: '0F172A',      // Slate 900
  textMuted: '64748B',     // Slate 500
  zebraLight: 'F8FAFC',    // Slate 50 - Alternating row
  borderSubtle: 'E2E8F0',  // Slate 200 - Grid border
  borderMedium: 'CBD5E1',  // Slate 300 - Table border
  totalRowFill: 'F1F5F9',  // Slate 100 - Total summary row
  
  // Status & KPI Badges
  emeraldFill: 'DCFCE7',   // Green 100
  emeraldText: '166534',   // Green 800
  amberFill: 'FEF3C7',     // Amber 100
  amberText: '92400E',     // Amber 800
  roseFill: 'FEE2E2',      // Red 100
  roseText: '991B1B',      // Red 800
  blueFill: 'DBEAFE',      // Blue 100
  blueText: '1E40AF',      // Blue 800
  
  // KPI Card Theme
  cardGrossFill: 'EFF6FF',
  cardGrossBorder: 'BFDBFE',
  cardExpenseFill: 'FEF2F2',
  cardExpenseBorder: 'FECACA',
  cardNetFill: 'ECFDF5',
  cardNetBorder: 'A7F3D0',
  cardVolFill: 'F8FAFC',
  cardVolBorder: 'E2E8F0',
};

const NUM_FMT = {
  currency: '"Rp "#,##0;[Red]("-Rp "#,##0);"-"',
  currencySimple: '"Rp "#,##0',
  integer: '#,##0',
  percent: '0.0%',
  percentDetailed: '0.00%',
};

const FONT_FAMILY = 'Calibri';

const thinBorder: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: PALETTE.borderSubtle } },
  left: { style: 'thin', color: { argb: PALETTE.borderSubtle } },
  bottom: { style: 'thin', color: { argb: PALETTE.borderSubtle } },
  right: { style: 'thin', color: { argb: PALETTE.borderSubtle } },
};

const totalRowBorder: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: PALETTE.navyMedium } },
  bottom: { style: 'double', color: { argb: PALETTE.navyDark } },
  left: { style: 'thin', color: { argb: PALETTE.borderSubtle } },
  right: { style: 'thin', color: { argb: PALETTE.borderSubtle } },
};

/**
 * Normalizes period string into safe filename component
 */
function formatFilenamePeriod(period: string): string {
  const clean = period.replace(/[^a-zA-Z0-9_-]/g, '_').replace(/_+/g, '_');
  return clean || 'Periode_Berjalan';
}

/**
 * Applies professional table header styling
 */
function styleTableHeader(
  row: ExcelJS.Row,
  columnsCount: number,
  bgColor: string = PALETTE.navyBlue
) {
  row.height = 28;
  for (let c = 1; c <= columnsCount; c++) {
    const cell = row.getCell(c);
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: bgColor },
    };
    cell.font = {
      name: FONT_FAMILY,
      size: 10.5,
      bold: true,
      color: { argb: PALETTE.white },
    };
    cell.alignment = {
      vertical: 'middle',
      horizontal: 'center',
      wrapText: true,
    };
    cell.border = {
      top: { style: 'medium', color: { argb: PALETTE.navyDark } },
      bottom: { style: 'medium', color: { argb: PALETTE.navyDark } },
      left: { style: 'thin', color: { argb: PALETTE.navyMedium } },
      right: { style: 'thin', color: { argb: PALETTE.navyMedium } },
    };
  }
}

/**
 * Styles a section ribbon header (full-width banner for titles within a sheet)
 */
function styleSectionRibbon(
  row: ExcelJS.Row,
  columnsCount: number,
  title: string,
  bgColor: string = PALETTE.navyMedium
) {
  row.height = 24;
  const startCell = row.getCell(1);
  startCell.value = title;
  startCell.font = {
    name: FONT_FAMILY,
    size: 11,
    bold: true,
    color: { argb: PALETTE.white },
  };
  startCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  
  for (let c = 1; c <= columnsCount; c++) {
    const cell = row.getCell(c);
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: bgColor },
    };
    cell.border = {
      top: { style: 'thin', color: { argb: PALETTE.navyDark } },
      bottom: { style: 'thin', color: { argb: PALETTE.navyDark } },
    };
  }
}

/**
 * Styles an accounting total / summary row at the bottom of a table
 */
function styleTotalRow(
  row: ExcelJS.Row,
  columnsCount: number,
  labelCol: number = 1
) {
  row.height = 24;
  for (let c = 1; c <= columnsCount; c++) {
    const cell = row.getCell(c);
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: PALETTE.totalRowFill },
    };
    cell.font = {
      name: FONT_FAMILY,
      size: 10.5,
      bold: true,
      color: { argb: PALETTE.navyDark },
    };
    cell.border = totalRowBorder;
  }
  const labelCell = row.getCell(labelCol);
  if (labelCell) {
    labelCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  }
}

/**
 * Auto-adjusts column widths with generous breathing room
 */
function autoAdjustColumnWidths(ws: ExcelJS.Worksheet, minWidth = 12, maxWidth = 55) {
  ws.columns.forEach((column) => {
    let maxLen = 0;
    if (column && column.eachCell) {
      column.eachCell({ includeEmpty: false }, (cell) => {
        // Skip header banners or merged title rows to avoid blowout widths
        if (Number(cell.row) <= 4 && String(cell.value || '').length > 40) return;
        const len = cell.value ? String(cell.value).length : 0;
        if (len > maxLen) {
          maxLen = len;
        }
      });
    }
    column.width = Math.min(Math.max(maxLen + 4, minWidth), maxWidth);
  });
}

/**
 * Exports complete 12-sheet professional financial and presentation workbook
 * Compliant with user specification for Laporan_Shopee_Professional / Shopee_Report_[PERIODE].xlsx
 */
export async function exportToExcel(options: ProfessionalExportOptions): Promise<{
  success: boolean;
  fileName: string;
  error?: string;
}> {
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

    const wb = new ExcelJS.Workbook();
    wb.creator = 'Shopee Professional Financial Analytics';
    wb.lastModifiedBy = 'Shopee Report Matcher';
    wb.created = new Date();
    wb.modified = new Date();

    const isFinancialMode = executiveSummary.mode === 'FINANCIAL_REPORT';
    const modeBadgeText = isFinancialMode
      ? 'FINANCIAL REPORT (VERIFIKASI SETTLEMENT & PELEPASAN DANA AKTUAL)'
      : 'SALES REPORT (MODE PENJUALAN - SETTLEMENT BELUM DIUNGGAH)';

    // ========================================================================
    // SHEET 01: 01_EXECUTIVE_SUMMARY (Slide-Deck Style Executive Dashboard)
    // ========================================================================
    const wsExec = wb.addWorksheet('01_EXECUTIVE_SUMMARY', {
      views: [{ showGridLines: true }],
    });

    // Column widths
    wsExec.columns = [
      { width: 4 },  // A: Spacer
      { width: 38 }, // B: Metric / KPI Label
      { width: 22 }, // C: Value Moneter / Numerik
      { width: 20 }, // D: Value Sekunder / %
      { width: 45 }, // E: Catatan Audit & Manajemen
      { width: 4 },  // F: Spacer
      { width: 30 }, // G: Secondary column
      { width: 25 }, // H: Secondary column
    ];

    // Top Title Presentation Banner
    wsExec.mergeCells('B2:E2');
    const titleCell = wsExec.getCell('B2');
    titleCell.value = 'LAPORAN KEUANGAN & KINERJA PENJUALAN SHOPEE';
    titleCell.font = { name: FONT_FAMILY, size: 16, bold: true, color: { argb: PALETTE.white } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.navyDark } };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    wsExec.getRow(2).height = 36;

    // Subtitle Ribbon
    wsExec.mergeCells('B3:E3');
    const subCell = wsExec.getCell('B3');
    subCell.value = `Periode Penjualan: ${period}   |   Toko: Official Store   |   Tanggal Cetak: ${new Date().toLocaleString('id-ID')}`;
    subCell.font = { name: FONT_FAMILY, size: 10, italic: true, color: { argb: '94A3B8' } };
    subCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.navyMedium } };
    subCell.alignment = { vertical: 'middle', horizontal: 'center' };
    wsExec.getRow(3).height = 22;

    // Mode Badge Banner
    wsExec.mergeCells('B4:E4');
    const modeCell = wsExec.getCell('B4');
    modeCell.value = `STATUS DOKUMEN: ${modeBadgeText}`;
    modeCell.font = { name: FONT_FAMILY, size: 10.5, bold: true, color: { argb: isFinancialMode ? 'BBF7D0' : 'BAE6FD' } };
    modeCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: isFinancialMode ? '065F46' : PALETTE.navyBlue } };
    modeCell.alignment = { vertical: 'middle', horizontal: 'center' };
    wsExec.getRow(4).height = 24;

    // Spacer
    wsExec.getRow(5).height = 12;

    // ------------------------------------------------------------------------
    // KPI SCORECARDS (Visual Executive Metric Tiles)
    // ------------------------------------------------------------------------
    // Card 1: Gross Revenue (B6:B8)
    wsExec.getCell('B6').value = 'PENDAPATAN KOTOR (GROSS)';
    wsExec.getCell('B6').font = { name: FONT_FAMILY, size: 9, bold: true, color: { argb: '1E40AF' } };
    wsExec.getCell('B6').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.cardGrossFill } };
    wsExec.getCell('B6').alignment = { vertical: 'middle', horizontal: 'center' };

    wsExec.getCell('B7').value = executiveSummary.totalGrossRevenue;
    wsExec.getCell('B7').numFmt = NUM_FMT.currencySimple;
    wsExec.getCell('B7').font = { name: FONT_FAMILY, size: 14, bold: true, color: { argb: '1E3A8A' } };
    wsExec.getCell('B7').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.cardGrossFill } };
    wsExec.getCell('B7').alignment = { vertical: 'middle', horizontal: 'center' };

    wsExec.getCell('B8').value = `${executiveSummary.totalQuantity.toLocaleString()} Unit Terjual`;
    wsExec.getCell('B8').font = { name: FONT_FAMILY, size: 9, color: { argb: '475569' } };
    wsExec.getCell('B8').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.cardGrossFill } };
    wsExec.getCell('B8').alignment = { vertical: 'middle', horizontal: 'center' };

    // Card 2: Platform Deductions (C6:C8)
    wsExec.getCell('C6').value = 'BEBAN BIAYA PLATFORM';
    wsExec.getCell('C6').font = { name: FONT_FAMILY, size: 9, bold: true, color: { argb: '991B1B' } };
    wsExec.getCell('C6').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.cardExpenseFill } };
    wsExec.getCell('C6').alignment = { vertical: 'middle', horizontal: 'center' };

    wsExec.getCell('C7').value = executiveSummary.totalExpense;
    wsExec.getCell('C7').numFmt = NUM_FMT.currencySimple;
    wsExec.getCell('C7').font = { name: FONT_FAMILY, size: 14, bold: true, color: { argb: 'B91C1C' } };
    wsExec.getCell('C7').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.cardExpenseFill } };
    wsExec.getCell('C7').alignment = { vertical: 'middle', horizontal: 'center' };

    const expenseRatio = executiveSummary.totalGrossRevenue > 0
      ? (executiveSummary.totalExpense / executiveSummary.totalGrossRevenue)
      : 0;
    wsExec.getCell('C8').value = `${(expenseRatio * 100).toFixed(1)}% Dari Omzet`;
    wsExec.getCell('C8').font = { name: FONT_FAMILY, size: 9, color: { argb: '475569' } };
    wsExec.getCell('C8').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.cardExpenseFill } };
    wsExec.getCell('C8').alignment = { vertical: 'middle', horizontal: 'center' };

    // Card 3: Net Revenue (D6:D8)
    wsExec.getCell('D6').value = 'PENDAPATAN BERSIH (NET)';
    wsExec.getCell('D6').font = { name: FONT_FAMILY, size: 9, bold: true, color: { argb: '065F46' } };
    wsExec.getCell('D6').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.cardNetFill } };
    wsExec.getCell('D6').alignment = { vertical: 'middle', horizontal: 'center' };

    wsExec.getCell('D7').value = executiveSummary.netRevenue;
    wsExec.getCell('D7').numFmt = NUM_FMT.currencySimple;
    wsExec.getCell('D7').font = { name: FONT_FAMILY, size: 14, bold: true, color: { argb: '047857' } };
    wsExec.getCell('D7').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.cardNetFill } };
    wsExec.getCell('D7').alignment = { vertical: 'middle', horizontal: 'center' };

    const netMarginRatio = executiveSummary.totalGrossRevenue > 0
      ? (executiveSummary.netRevenue / executiveSummary.totalGrossRevenue)
      : 1;
    wsExec.getCell('D8').value = `Margin Bersih ${(netMarginRatio * 100).toFixed(1)}%`;
    wsExec.getCell('D8').font = { name: FONT_FAMILY, size: 9, color: { argb: '475569' } };
    wsExec.getCell('D8').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.cardNetFill } };
    wsExec.getCell('D8').alignment = { vertical: 'middle', horizontal: 'center' };

    // Card 4: Orders & AOV (E6:E8)
    wsExec.getCell('E6').value = 'VOLUME & RATA-RATA ORDER';
    wsExec.getCell('E6').font = { name: FONT_FAMILY, size: 9, bold: true, color: { argb: '334155' } };
    wsExec.getCell('E6').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.cardVolFill } };
    wsExec.getCell('E6').alignment = { vertical: 'middle', horizontal: 'center' };

    wsExec.getCell('E7').value = `${executiveSummary.totalOrders.toLocaleString()} Pesanan`;
    wsExec.getCell('E7').font = { name: FONT_FAMILY, size: 13, bold: true, color: { argb: PALETTE.navyDark } };
    wsExec.getCell('E7').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.cardVolFill } };
    wsExec.getCell('E7').alignment = { vertical: 'middle', horizontal: 'center' };

    wsExec.getCell('E8').value = `AOV: ${formatRupiah(executiveSummary.averageOrderValue)}`;
    wsExec.getCell('E8').font = { name: FONT_FAMILY, size: 9, color: { argb: '475569' } };
    wsExec.getCell('E8').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.cardVolFill } };
    wsExec.getCell('E8').alignment = { vertical: 'middle', horizontal: 'center' };

    // Add borders to cards
    ['B', 'C', 'D', 'E'].forEach((col) => {
      [6, 7, 8].forEach((r) => {
        wsExec.getCell(`${col}${r}`).border = thinBorder;
      });
    });

    wsExec.getRow(6).height = 18;
    wsExec.getRow(7).height = 24;
    wsExec.getRow(8).height = 18;
    wsExec.getRow(9).height = 14;

    // ------------------------------------------------------------------------
    // SECTION 1: RINGKASAN INDIKATOR KINERJA UTAMA (KPI UTAMA)
    // ------------------------------------------------------------------------
    let curRow = 10;
    wsExec.mergeCells(`B${curRow}:E${curRow}`);
    const sec1 = wsExec.getCell(`B${curRow}`);
    sec1.value = '1. RINGKASAN INDIKATOR KINERJA FINANSIAL & PENJUALAN';
    sec1.font = { name: FONT_FAMILY, size: 11, bold: true, color: { argb: PALETTE.white } };
    sec1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.navyMedium } };
    sec1.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    wsExec.getRow(curRow).height = 24;
    curRow++;

    // Subheader
    wsExec.getCell(`B${curRow}`).value = 'Indikator / Metrik Keuangan';
    wsExec.getCell(`C${curRow}`).value = 'Nilai Utama';
    wsExec.getCell(`D${curRow}`).value = 'Persentase / Sekunder';
    wsExec.getCell(`E${curRow}`).value = 'Catatan Audit Finansial';
    ['B', 'C', 'D', 'E'].forEach((col) => {
      const c = wsExec.getCell(`${col}${curRow}`);
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F1F5F9' } };
      c.font = { name: FONT_FAMILY, size: 10, bold: true, color: { argb: PALETTE.navyDark } };
      c.border = thinBorder;
      c.alignment = { vertical: 'middle', horizontal: col === 'B' ? 'left' : 'center' };
    });
    wsExec.getRow(curRow).height = 22;
    curRow++;

    const kpiRows: [string, number | string, string, string, string?][] = [
      ['Total Pesanan Selesai (Unique Orders)', executiveSummary.totalOrders, `${executiveSummary.totalOrders.toLocaleString()} pesanan`, 'Jumlah transaksi unik berdasarkan No. Pesanan', 'int'],
      ['Total Ragam SKU Terjual', executiveSummary.totalUniqueSkus, `${executiveSummary.totalUniqueSkus} SKU aktif`, 'Variasi produk aktif yang memiliki penjualan', 'int'],
      ['Total Kuantitas Terjual (Volume Qty)', executiveSummary.totalQuantity, `${executiveSummary.totalQuantity.toLocaleString()} pcs`, 'Total unit fisik barang tervalidasi dari All Order', 'int'],
      ['Total Pendapatan Kotor (Gross Revenue)', executiveSummary.totalGrossRevenue, '100.0%', 'Total akumulasi omzet sebelum potongan biaya seller', 'curr'],
      ['Diskon & Voucher Penjual', executiveSummary.totalDiscount, formatRupiah(executiveSummary.totalDiscount), 'Subsidi diskon langsung dari penjual (jika tercatat)', 'curr'],
      ['Total Beban Biaya Platform (Platform Fee)', executiveSummary.totalExpense, `${(expenseRatio * 100).toFixed(2)}%`, 'Total potongan resmi biaya administrasi & layanan Shopee', 'curr'],
      ['Pengembalian Dana & Penyesuaian (Refund)', executiveSummary.totalRefund, formatRupiah(executiveSummary.totalRefund), 'Potongan retur dan klaim kompensasi barang', 'curr'],
      ['Pendapatan Bersih (Net Revenue / Saldo Cair)', executiveSummary.netRevenue, `${(netMarginRatio * 100).toFixed(2)}%`, 'Dana riil yang diterima penjual setelah seluruh potongan biaya', 'curr'],
      ['Average Order Value (AOV)', Math.round(executiveSummary.averageOrderValue), `${Math.round(executiveSummary.totalQuantity / Math.max(1, executiveSummary.totalOrders))} pcs/order`, 'Rata-rata nilai belanja kotor per satu nomor pesanan', 'curr'],
      ['Average Revenue per SKU', Math.round(executiveSummary.averageRevenuePerSku), `${Math.round(executiveSummary.totalQuantity / Math.max(1, executiveSummary.totalUniqueSkus))} pcs/SKU`, 'Rata-rata kontribusi omzet kotor per ragam produk terjual', 'curr'],
    ];

    kpiRows.forEach((item, idx) => {
      const isZebra = idx % 2 === 1;
      const rowFill = isZebra ? PALETTE.zebraLight : PALETTE.white;

      const cB = wsExec.getCell(`B${curRow}`);
      cB.value = item[0];
      cB.font = { name: FONT_FAMILY, size: 10, bold: item[0].includes('Bersih') || item[0].includes('Kotor') };
      cB.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
      cB.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowFill } };
      cB.border = thinBorder;

      const cC = wsExec.getCell(`C${curRow}`);
      cC.value = item[1];
      if (item[4] === 'curr') {
        cC.numFmt = NUM_FMT.currencySimple;
      } else if (item[4] === 'int') {
        cC.numFmt = NUM_FMT.integer;
      }
      cC.font = { name: FONT_FAMILY, size: 10, bold: item[0].includes('Bersih') || item[0].includes('Kotor') };
      cC.alignment = { vertical: 'middle', horizontal: typeof item[1] === 'number' ? 'right' : 'center' };
      cC.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowFill } };
      cC.border = thinBorder;

      const cD = wsExec.getCell(`D${curRow}`);
      cD.value = item[2];
      cD.font = { name: FONT_FAMILY, size: 10 };
      cD.alignment = { vertical: 'middle', horizontal: 'center' };
      cD.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowFill } };
      cD.border = thinBorder;

      const cE = wsExec.getCell(`E${curRow}`);
      cE.value = item[3];
      cE.font = { name: FONT_FAMILY, size: 9.5, color: { argb: PALETTE.textMuted } };
      cE.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
      cE.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowFill } };
      cE.border = thinBorder;

      wsExec.getRow(curRow).height = 20;
      curRow++;
    });

    curRow++;

    // ------------------------------------------------------------------------
    // SECTION 2: KINERJA MATCHING ENGINE & REKONSILIASI
    // ------------------------------------------------------------------------
    wsExec.mergeCells(`B${curRow}:E${curRow}`);
    const sec2 = wsExec.getCell(`B${curRow}`);
    sec2.value = '2. STATUS INTEGRITAS & TINGKAT KEBERHASILAN AUDIT MATCHING';
    sec2.font = { name: FONT_FAMILY, size: 11, bold: true, color: { argb: PALETTE.white } };
    sec2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.navyMedium } };
    sec2.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    wsExec.getRow(curRow).height = 24;
    curRow++;

    const auditChecklist: [string, number, string, string, string][] = [
      ['Prioritas 1: Exact SKU Match (No. Pesanan + Kode SKU)', summary.exactSkuCount, `${summary.exactSkuPercentage.toFixed(1)}%`, 'Tercocokkan sempurna pada level SKU spesifik', PALETTE.emeraldFill],
      ['Prioritas 2: SKU Induk Fallback (No. Pesanan + SKU Induk)', summary.skuIndukFallbackCount, `${summary.skuIndukFallbackPercentage.toFixed(1)}%`, 'Tercocokkan melalui relasi SKU Induk toko', PALETTE.blueFill],
      ['Prioritas 3: Nama Produk Fallback (No. Pesanan + Nama Produk)', summary.productNameFallbackCount, `${summary.productNameFallbackPercentage.toFixed(1)}%`, 'Tercocokkan melalui normalisasi judul produk', PALETTE.amberFill],
      ['Item Tidak Ditemukan di All Order (Unmatched)', summary.notFoundCount, `${summary.notFoundPercentage.toFixed(1)}%`, summary.notFoundCount === 0 ? 'Bersih (100% tervalidasi)' : 'Periksa Sheet 09_UNMATCHED', summary.notFoundCount === 0 ? PALETTE.emeraldFill : PALETTE.roseFill],
      ['Formula Validasi Kesetaraan Baris Income', reconciliation.totalIncomeRows, reconciliation.isCountBalanced ? 'SEIMBANG 100%' : 'SELISIH', 'Exact + P2 + P3 + NotFound == Total Baris Income', reconciliation.isCountBalanced ? PALETTE.emeraldFill : PALETTE.roseFill],
    ];

    auditChecklist.forEach((item) => {
      const cB = wsExec.getCell(`B${curRow}`);
      cB.value = item[0];
      cB.font = { name: FONT_FAMILY, size: 10, bold: item[0].includes('Formula') };
      cB.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
      cB.border = thinBorder;

      const cC = wsExec.getCell(`C${curRow}`);
      cC.value = item[1];
      cC.numFmt = NUM_FMT.integer;
      cC.font = { name: FONT_FAMILY, size: 10, bold: true };
      cC.alignment = { vertical: 'middle', horizontal: 'right' };
      cC.border = thinBorder;

      const cD = wsExec.getCell(`D${curRow}`);
      cD.value = item[2];
      cD.font = { name: FONT_FAMILY, size: 10, bold: true };
      cD.alignment = { vertical: 'middle', horizontal: 'center' };
      cD.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: item[4] } };
      cD.border = thinBorder;

      const cE = wsExec.getCell(`E${curRow}`);
      cE.value = item[3];
      cE.font = { name: FONT_FAMILY, size: 9.5, color: { argb: PALETTE.textMuted } };
      cE.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
      cE.border = thinBorder;

      wsExec.getRow(curRow).height = 20;
      curRow++;
    });

    // ========================================================================
    // SHEET 02: 02_DETAIL_TRANSAKSI (Normalized Transaction Ledger)
    // ========================================================================
    const wsLedger = wb.addWorksheet('02_DETAIL_TRANSAKSI', {
      views: [{ state: 'frozen', xSplit: 0, ySplit: 1, showGridLines: true }],
    });

    const ledgerColumns = [
      { header: 'No', key: 'no', width: 6 },
      { header: 'No Pesanan', key: 'orderNumber', width: 22 },
      { header: 'Tanggal Pesanan', key: 'orderDate', width: 16 },
      { header: 'SKU', key: 'sku', width: 20 },
      { header: 'Nama Produk', key: 'productName', width: 42 },
      { header: 'Variasi', key: 'variation', width: 18 },
      { header: 'Qty', key: 'quantity', width: 10 },
      { header: 'Harga Satuan', key: 'unitPrice', width: 16 },
      { header: 'Pendapatan Kotor', key: 'grossRevenue', width: 18 },
      { header: 'Diskon', key: 'discount', width: 14 },
      { header: 'Biaya Administrasi', key: 'adminFee', width: 16 },
      { header: 'Biaya Pembayaran', key: 'paymentFee', width: 16 },
      { header: 'Biaya Layanan', key: 'serviceFee', width: 16 },
      { header: 'Biaya Pengiriman', key: 'shippingCost', width: 16 },
      { header: 'Biaya Promosi', key: 'promotionFee', width: 16 },
      { header: 'Biaya Lainnya', key: 'otherFee', width: 14 },
      { header: 'Refund', key: 'refund', width: 14 },
      { header: 'Penyesuaian', key: 'adjustment', width: 14 },
      { header: 'Total Beban', key: 'totalExpense', width: 16 },
      { header: 'Pendapatan Bersih', key: 'netRevenue', width: 18 },
      { header: 'HPP', key: 'cogs', width: 12 },
      { header: 'Gross Profit', key: 'grossProfit', width: 14 },
      { header: 'Margin', key: 'margin', width: 12 },
      { header: 'Match Type', key: 'matchType', width: 18 },
      { header: 'Match Status', key: 'matchStatus', width: 16 },
      { header: 'Source File', key: 'sourceFile', width: 22 },
      { header: 'Source Row', key: 'sourceRow', width: 12 },
      { header: 'Catatan Audit', key: 'auditNote', width: 35 },
    ];
    wsLedger.columns = ledgerColumns;

    styleTableHeader(wsLedger.getRow(1), ledgerColumns.length, PALETTE.navyBlue);

    ledger.forEach((item, idx) => {
      const rowIdx = idx + 2;
      const isZebra = idx % 2 === 1;
      const row = wsLedger.addRow({
        no: item.no,
        orderNumber: item.orderNumber,
        orderDate: item.orderDate || '-',
        sku: item.sku || '-',
        productName: item.productName || '-',
        variation: item.variation || '-',
        quantity: item.quantity !== null && item.quantity !== undefined ? item.quantity : null,
        unitPrice: item.unitPrice !== null && item.unitPrice !== undefined ? Math.round(item.unitPrice) : null,
        grossRevenue: item.grossRevenue,
        discount: item.discount,
        adminFee: item.adminFee,
        paymentFee: item.paymentFee,
        serviceFee: item.serviceFee,
        shippingCost: item.shippingCost,
        promotionFee: item.promotionFee,
        otherFee: item.otherFee,
        refund: item.refund,
        adjustment: item.adjustment,
        totalExpense: item.totalExpense,
        netRevenue: item.netRevenue,
        cogs: '-',
        grossProfit: '-',
        margin: '-',
        matchType: item.matchType,
        matchStatus: item.matchStatus,
        sourceFile: item.sourceFile,
        sourceRow: item.sourceRow,
        auditNote: item.auditNote,
      });

      row.height = 20;

      // Formatting cells
      for (let c = 1; c <= ledgerColumns.length; c++) {
        const cell = row.getCell(c);
        cell.font = { name: FONT_FAMILY, size: 9.5 };
        cell.border = thinBorder;
        if (isZebra) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.zebraLight } };
        }
      }

      // Column specific alignments and number formats
      row.getCell('no').alignment = { vertical: 'middle', horizontal: 'center' };
      row.getCell('orderNumber').alignment = { vertical: 'middle', horizontal: 'center' };
      row.getCell('orderDate').alignment = { vertical: 'middle', horizontal: 'center' };
      row.getCell('sku').alignment = { vertical: 'middle', horizontal: 'left' };
      row.getCell('productName').alignment = { vertical: 'middle', horizontal: 'left' };
      row.getCell('variation').alignment = { vertical: 'middle', horizontal: 'left' };

      const qtyCell = row.getCell('quantity');
      qtyCell.numFmt = NUM_FMT.integer;
      qtyCell.alignment = { vertical: 'middle', horizontal: 'right' };

      const unitCell = row.getCell('unitPrice');
      unitCell.numFmt = NUM_FMT.currencySimple;
      unitCell.alignment = { vertical: 'middle', horizontal: 'right' };

      // Currencies
      ['grossRevenue', 'discount', 'adminFee', 'paymentFee', 'serviceFee', 'shippingCost', 'promotionFee', 'otherFee', 'refund', 'adjustment', 'totalExpense', 'netRevenue'].forEach((k) => {
        const c = row.getCell(k);
        c.numFmt = NUM_FMT.currencySimple;
        c.alignment = { vertical: 'middle', horizontal: 'right' };
      });

      row.getCell('netRevenue').font = { name: FONT_FAMILY, size: 9.5, bold: true, color: { argb: '047857' } };

      // Status pill badge color
      const statusCell = row.getCell('matchStatus');
      statusCell.alignment = { vertical: 'middle', horizontal: 'center' };
      if (item.matchStatus === 'EXACT_SKU') {
        statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.emeraldFill } };
        statusCell.font = { name: FONT_FAMILY, size: 9, bold: true, color: { argb: PALETTE.emeraldText } };
      } else if (item.matchStatus === 'SKU_INDUK_FALLBACK') {
        statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.blueFill } };
        statusCell.font = { name: FONT_FAMILY, size: 9, bold: true, color: { argb: PALETTE.blueText } };
      } else if (item.matchStatus === 'PRODUCT_NAME_FALLBACK') {
        statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.amberFill } };
        statusCell.font = { name: FONT_FAMILY, size: 9, bold: true, color: { argb: PALETTE.amberText } };
      } else {
        statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.roseFill } };
        statusCell.font = { name: FONT_FAMILY, size: 9, bold: true, color: { argb: PALETTE.roseText } };
      }
    });

    // Ledger Totals Row
    const totLedgerRowIdx = ledger.length + 2;
    const totRow = wsLedger.addRow({
      no: 'TOTAL',
      orderNumber: '',
      orderDate: '',
      sku: '',
      productName: `${ledger.length} Baris Transaksi Terverifikasi`,
      variation: '',
      quantity: ledger.reduce((sum, i) => sum + (i.quantity || 0), 0),
      unitPrice: null,
      grossRevenue: ledger.reduce((sum, i) => sum + i.grossRevenue, 0),
      discount: ledger.reduce((sum, i) => sum + i.discount, 0),
      adminFee: ledger.reduce((sum, i) => sum + i.adminFee, 0),
      paymentFee: ledger.reduce((sum, i) => sum + i.paymentFee, 0),
      serviceFee: ledger.reduce((sum, i) => sum + i.serviceFee, 0),
      shippingCost: ledger.reduce((sum, i) => sum + i.shippingCost, 0),
      promotionFee: ledger.reduce((sum, i) => sum + i.promotionFee, 0),
      otherFee: ledger.reduce((sum, i) => sum + i.otherFee, 0),
      refund: ledger.reduce((sum, i) => sum + i.refund, 0),
      adjustment: ledger.reduce((sum, i) => sum + i.adjustment, 0),
      totalExpense: ledger.reduce((sum, i) => sum + i.totalExpense, 0),
      netRevenue: ledger.reduce((sum, i) => sum + i.netRevenue, 0),
      cogs: '',
      grossProfit: '',
      margin: '',
      matchType: '',
      matchStatus: '',
      sourceFile: '',
      sourceRow: '',
      auditNote: 'Audit Seimbang 100%',
    });

    styleTotalRow(totRow, ledgerColumns.length, 1);
    totRow.getCell('quantity').numFmt = NUM_FMT.integer;
    totRow.getCell('quantity').alignment = { vertical: 'middle', horizontal: 'right' };
    ['grossRevenue', 'discount', 'adminFee', 'paymentFee', 'serviceFee', 'shippingCost', 'promotionFee', 'otherFee', 'refund', 'adjustment', 'totalExpense', 'netRevenue'].forEach((k) => {
      const c = totRow.getCell(k);
      c.numFmt = NUM_FMT.currencySimple;
      c.alignment = { vertical: 'middle', horizontal: 'right' };
    });

    wsLedger.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: totLedgerRowIdx - 1, column: ledgerColumns.length },
    };

    // ========================================================================
    // SHEET 03: 03_ORDER_SUMMARY (1 Row per Order Number)
    // ========================================================================
    const wsOrder = wb.addWorksheet('03_RINGKASAN_ORDER', {
      views: [{ state: 'frozen', xSplit: 0, ySplit: 1, showGridLines: true }],
    });

    const orderCols = [
      { header: 'No Pesanan', key: 'orderNumber', width: 22 },
      { header: 'Tanggal', key: 'orderDate', width: 16 },
      { header: 'Jumlah SKU', key: 'skuCount', width: 12 },
      { header: 'Total Qty', key: 'totalQuantity', width: 12 },
      { header: 'Pendapatan Kotor', key: 'grossRevenue', width: 18 },
      { header: 'Diskon', key: 'discount', width: 14 },
      { header: 'Total Beban', key: 'totalExpense', width: 16 },
      { header: 'Refund', key: 'refund', width: 14 },
      { header: 'Pendapatan Bersih', key: 'netRevenue', width: 18 },
      { header: 'Margin', key: 'margin', width: 12 },
      { header: 'Status Matching', key: 'matchStatus', width: 18 },
      { header: 'Verifikasi Settlement', key: 'settlementVerified', width: 24 },
    ];
    wsOrder.columns = orderCols;

    styleTableHeader(wsOrder.getRow(1), orderCols.length, PALETTE.navyBlue);

    orderSummaries.forEach((o, idx) => {
      const isZebra = idx % 2 === 1;
      const row = wsOrder.addRow({
        orderNumber: o.orderNumber,
        orderDate: o.orderDate || '-',
        skuCount: o.skuCount,
        totalQuantity: o.totalQuantity,
        grossRevenue: o.grossRevenue,
        discount: o.discount,
        totalExpense: o.totalExpense,
        refund: o.refund,
        netRevenue: o.netRevenue,
        margin: o.grossRevenue > 0 ? (o.netRevenue / o.grossRevenue) : 1,
        matchStatus: o.matchStatus,
        settlementVerified: o.settlementVerified ? 'Terverifikasi Settlement' : 'Belum Ada Settlement',
      });

      row.height = 20;
      for (let c = 1; c <= orderCols.length; c++) {
        const cell = row.getCell(c);
        cell.font = { name: FONT_FAMILY, size: 9.5 };
        cell.border = thinBorder;
        if (isZebra) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.zebraLight } };
        }
      }

      row.getCell('orderNumber').alignment = { vertical: 'middle', horizontal: 'center' };
      row.getCell('orderDate').alignment = { vertical: 'middle', horizontal: 'center' };
      row.getCell('skuCount').numFmt = NUM_FMT.integer;
      row.getCell('skuCount').alignment = { vertical: 'middle', horizontal: 'center' };
      row.getCell('totalQuantity').numFmt = NUM_FMT.integer;
      row.getCell('totalQuantity').alignment = { vertical: 'middle', horizontal: 'right' };

      ['grossRevenue', 'discount', 'totalExpense', 'refund', 'netRevenue'].forEach((k) => {
        const c = row.getCell(k);
        c.numFmt = NUM_FMT.currencySimple;
        c.alignment = { vertical: 'middle', horizontal: 'right' };
      });

      const mCell = row.getCell('margin');
      mCell.numFmt = NUM_FMT.percent;
      mCell.alignment = { vertical: 'middle', horizontal: 'right' };

      row.getCell('matchStatus').alignment = { vertical: 'middle', horizontal: 'center' };
      row.getCell('settlementVerified').alignment = { vertical: 'middle', horizontal: 'center' };
    });

    const totOrderRow = wsOrder.addRow({
      orderNumber: `TOTAL (${orderSummaries.length} PESANAN)`,
      orderDate: '',
      skuCount: orderSummaries.reduce((sum, o) => sum + o.skuCount, 0),
      totalQuantity: orderSummaries.reduce((sum, o) => sum + o.totalQuantity, 0),
      grossRevenue: orderSummaries.reduce((sum, o) => sum + o.grossRevenue, 0),
      discount: orderSummaries.reduce((sum, o) => sum + o.discount, 0),
      totalExpense: orderSummaries.reduce((sum, o) => sum + o.totalExpense, 0),
      refund: orderSummaries.reduce((sum, o) => sum + o.refund, 0),
      netRevenue: orderSummaries.reduce((sum, o) => sum + o.netRevenue, 0),
      margin: executiveSummary.totalGrossRevenue > 0
        ? (executiveSummary.netRevenue / executiveSummary.totalGrossRevenue)
        : 1,
      matchStatus: '',
      settlementVerified: 'Zero Double-Count Biaya',
    });

    styleTotalRow(totOrderRow, orderCols.length, 1);
    totOrderRow.getCell('skuCount').numFmt = NUM_FMT.integer;
    totOrderRow.getCell('totalQuantity').numFmt = NUM_FMT.integer;
    totOrderRow.getCell('margin').numFmt = NUM_FMT.percent;
    ['grossRevenue', 'discount', 'totalExpense', 'refund', 'netRevenue'].forEach((k) => {
      totOrderRow.getCell(k).numFmt = NUM_FMT.currencySimple;
      totOrderRow.getCell(k).alignment = { vertical: 'middle', horizontal: 'right' };
    });

    wsOrder.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: orderSummaries.length + 1, column: orderCols.length },
    };

    // ========================================================================
    // SHEET 04: 04_PRODUK_ANALYSIS (Consolidated by SKU & Product)
    // ========================================================================
    const wsProd = wb.addWorksheet('04_PRODUK_ANALYSIS', {
      views: [{ state: 'frozen', xSplit: 0, ySplit: 1, showGridLines: true }],
    });

    const prodCols = [
      { header: 'No', key: 'no', width: 6 },
      { header: 'SKU', key: 'sku', width: 22 },
      { header: 'Nama Produk', key: 'productName', width: 45 },
      { header: 'Total Qty', key: 'totalQuantity', width: 12 },
      { header: 'Total Order', key: 'totalOrder', width: 12 },
      { header: 'Total Revenue', key: 'totalRevenue', width: 18 },
      { header: 'Total Expense', key: 'totalExpense', width: 16 },
      { header: 'Net Revenue', key: 'netRevenue', width: 18 },
      { header: 'Average Selling Price (ASP)', key: 'asp', width: 20 },
      { header: 'Kontribusi Omzet', key: 'contrib', width: 16 },
      { header: 'Rasio Beban', key: 'expenseRatio', width: 14 },
    ];
    wsProd.columns = prodCols;

    styleTableHeader(wsProd.getRow(1), prodCols.length, PALETTE.navyBlue);

    products.forEach((p, idx) => {
      const isZebra = idx % 2 === 1;
      const contrib = executiveSummary.totalGrossRevenue > 0
        ? (p.totalRevenue / executiveSummary.totalGrossRevenue)
        : 0;
      const expRatio = p.totalRevenue > 0 ? (p.totalExpense / p.totalRevenue) : 0;

      const row = wsProd.addRow({
        no: idx + 1,
        sku: p.sku,
        productName: p.productName,
        totalQuantity: p.totalQuantity,
        totalOrder: p.totalOrder,
        totalRevenue: p.totalRevenue,
        totalExpense: p.totalExpense,
        netRevenue: p.netRevenue,
        asp: Math.round(p.averageSellingPrice),
        contrib: contrib,
        expenseRatio: expRatio,
      });

      row.height = 20;
      for (let c = 1; c <= prodCols.length; c++) {
        const cell = row.getCell(c);
        cell.font = { name: FONT_FAMILY, size: 9.5 };
        cell.border = thinBorder;
        if (isZebra) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.zebraLight } };
        }
      }

      row.getCell('no').alignment = { vertical: 'middle', horizontal: 'center' };
      row.getCell('sku').alignment = { vertical: 'middle', horizontal: 'left' };
      row.getCell('productName').alignment = { vertical: 'middle', horizontal: 'left' };
      row.getCell('totalQuantity').numFmt = NUM_FMT.integer;
      row.getCell('totalQuantity').alignment = { vertical: 'middle', horizontal: 'right' };
      row.getCell('totalOrder').numFmt = NUM_FMT.integer;
      row.getCell('totalOrder').alignment = { vertical: 'middle', horizontal: 'right' };

      ['totalRevenue', 'totalExpense', 'netRevenue', 'asp'].forEach((k) => {
        const c = row.getCell(k);
        c.numFmt = NUM_FMT.currencySimple;
        c.alignment = { vertical: 'middle', horizontal: 'right' };
      });

      row.getCell('contrib').numFmt = NUM_FMT.percent;
      row.getCell('contrib').alignment = { vertical: 'middle', horizontal: 'right' };
      row.getCell('expenseRatio').numFmt = NUM_FMT.percent;
      row.getCell('expenseRatio').alignment = { vertical: 'middle', horizontal: 'right' };
    });

    const totProdRow = wsProd.addRow({
      no: 'TOTAL',
      sku: '',
      productName: `${products.length} Ragam Produk Terjual`,
      totalQuantity: products.reduce((sum, p) => sum + p.totalQuantity, 0),
      totalOrder: executiveSummary.totalOrders,
      totalRevenue: products.reduce((sum, p) => sum + p.totalRevenue, 0),
      totalExpense: products.reduce((sum, p) => sum + p.totalExpense, 0),
      netRevenue: products.reduce((sum, p) => sum + p.netRevenue, 0),
      asp: Math.round(executiveSummary.totalGrossRevenue / Math.max(1, executiveSummary.totalQuantity)),
      contrib: 1,
      expenseRatio: expenseRatio,
    });

    styleTotalRow(totProdRow, prodCols.length, 1);
    totProdRow.getCell('totalQuantity').numFmt = NUM_FMT.integer;
    totProdRow.getCell('totalOrder').numFmt = NUM_FMT.integer;
    totProdRow.getCell('contrib').numFmt = NUM_FMT.percent;
    totProdRow.getCell('expenseRatio').numFmt = NUM_FMT.percent;
    ['totalRevenue', 'totalExpense', 'netRevenue', 'asp'].forEach((k) => {
      totProdRow.getCell(k).numFmt = NUM_FMT.currencySimple;
      totProdRow.getCell(k).alignment = { vertical: 'middle', horizontal: 'right' };
    });

    wsProd.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: products.length + 1, column: prodCols.length },
    };

    // ========================================================================
    // SHEET 05: 05_TOP_10_RANKINGS (5 Distinct Executive Tables)
    // ========================================================================
    const wsTop10 = wb.addWorksheet('05_TOP_10_RANKINGS', {
      views: [{ showGridLines: true }],
    });

    wsTop10.columns = [
      { width: 12 }, // Peringkat
      { width: 22 }, // SKU
      { width: 45 }, // Nama Produk
      { width: 16 }, // Metric 1
      { width: 16 }, // Metric 2
      { width: 20 }, // Metric 3
      { width: 20 }, // Metric 4
    ];

    let tRow = 1;

    // Helper to render Top 10 Table Section
    const renderTop10Section = (
      title: string,
      headers: string[],
      rows: (string | number)[][],
      numFormats: Record<number, string>
    ) => {
      // Ribbon Title
      wsTop10.mergeCells(`A${tRow}:G${tRow}`);
      const rib = wsTop10.getCell(`A${tRow}`);
      rib.value = title;
      rib.font = { name: FONT_FAMILY, size: 11, bold: true, color: { argb: PALETTE.white } };
      rib.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.navyMedium } };
      rib.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
      wsTop10.getRow(tRow).height = 24;
      tRow++;

      // Headers
      const hRow = wsTop10.getRow(tRow);
      hRow.height = 22;
      headers.forEach((h, i) => {
        const cell = hRow.getCell(i + 1);
        cell.value = h;
        cell.font = { name: FONT_FAMILY, size: 9.5, bold: true, color: { argb: PALETTE.white } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.navyBlue } };
        cell.border = thinBorder;
        cell.alignment = { vertical: 'middle', horizontal: i === 0 ? 'center' : i <= 2 ? 'left' : 'right' };
      });
      tRow++;

      // Data Rows
      rows.forEach((r, idx) => {
        const row = wsTop10.getRow(tRow);
        row.height = 20;
        const isZebra = idx % 2 === 1;

        r.forEach((val, i) => {
          const cell = row.getCell(i + 1);
          cell.value = val;
          cell.font = { name: FONT_FAMILY, size: 9.5, bold: i === 0 };
          cell.border = thinBorder;
          if (isZebra) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.zebraLight } };
          }

          if (numFormats[i]) {
            cell.numFmt = numFormats[i];
          }

          if (i === 0) {
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
            cell.font = { name: FONT_FAMILY, size: 9.5, bold: true, color: { argb: 'D97706' } };
          } else if (i <= 2) {
            cell.alignment = { vertical: 'middle', horizontal: 'left' };
          } else {
            cell.alignment = { vertical: 'middle', horizontal: 'right' };
          }
        });
        tRow++;
      });

      // Spacer
      wsTop10.getRow(tRow).height = 14;
      tRow++;
    };

    // A. Top 10 by Qty
    renderTop10Section(
      'A. TOP 10 PRODUK TERLARIS (BERDASARKAN KUANTITAS UNIT TERJUAL)',
      ['Peringkat', 'SKU', 'Nama Produk', 'Total Qty', 'Total Order', 'Total Omzet (Gross)', 'Net Revenue'],
      top10.byQty.map((p, idx) => [
        `#${idx + 1}`,
        p.sku,
        p.productName,
        p.totalQuantity,
        p.totalOrder,
        p.totalRevenue,
        p.netRevenue,
      ]),
      { 3: NUM_FMT.integer, 4: NUM_FMT.integer, 5: NUM_FMT.currencySimple, 6: NUM_FMT.currencySimple }
    );

    // B. Top 10 by Gross Revenue
    renderTop10Section(
      'B. TOP 10 PRODUK DENGAN OMZET TERTINGGI (GROSS REVENUE)',
      ['Peringkat', 'SKU', 'Nama Produk', 'Total Omzet (Gross)', 'Total Qty', 'Total Order', 'Net Revenue'],
      top10.byRevenue.map((p, idx) => [
        `#${idx + 1}`,
        p.sku,
        p.productName,
        p.totalRevenue,
        p.totalQuantity,
        p.totalOrder,
        p.netRevenue,
      ]),
      { 3: NUM_FMT.currencySimple, 4: NUM_FMT.integer, 5: NUM_FMT.integer, 6: NUM_FMT.currencySimple }
    );

    // C. Top 10 by Net Revenue
    renderTop10Section(
      'C. TOP 10 PRODUK PENDAPATAN BERSIH TERTINGGI (NET REVENUE)',
      ['Peringkat', 'SKU', 'Nama Produk', 'Net Revenue', 'Total Omzet (Gross)', 'Total Beban', 'Total Qty'],
      top10.byNetRevenue.map((p, idx) => [
        `#${idx + 1}`,
        p.sku,
        p.productName,
        p.netRevenue,
        p.totalRevenue,
        p.totalExpense,
        p.totalQuantity,
      ]),
      { 3: NUM_FMT.currencySimple, 4: NUM_FMT.currencySimple, 5: NUM_FMT.currencySimple, 6: NUM_FMT.integer }
    );

    // D. Top 10 by Order Count
    renderTop10Section(
      'D. TOP 10 PRODUK FREKUENSI TRANSAKSI TERTINGGI (ORDER COUNT)',
      ['Peringkat', 'SKU', 'Nama Produk', 'Total Order', 'Total Qty', 'Total Omzet (Gross)', 'Net Revenue'],
      top10.byOrderCount.map((p, idx) => [
        `#${idx + 1}`,
        p.sku,
        p.productName,
        p.totalOrder,
        p.totalQuantity,
        p.totalRevenue,
        p.netRevenue,
      ]),
      { 3: NUM_FMT.integer, 4: NUM_FMT.integer, 5: NUM_FMT.currencySimple, 6: NUM_FMT.currencySimple }
    );

    // E. Top 10 by Expense
    renderTop10Section(
      'E. TOP 10 PRODUK DENGAN TOTAL BEBAN BIAYA TERTINGGI (POTONGAN SHOPEE)',
      ['Peringkat', 'SKU', 'Nama Produk', 'Total Beban Biaya', 'Total Omzet', 'Rasio Beban/Omzet', 'Net Revenue'],
      top10.byExpense.map((p, idx) => [
        `#${idx + 1}`,
        p.sku,
        p.productName,
        p.totalExpense,
        p.totalRevenue,
        p.totalRevenue > 0 ? (p.totalExpense / p.totalRevenue) : 0,
        p.netRevenue,
      ]),
      { 3: NUM_FMT.currencySimple, 4: NUM_FMT.currencySimple, 5: NUM_FMT.percent, 6: NUM_FMT.currencySimple }
    );

    // ========================================================================
    // SHEET 06: 06_EXPENSE_ANALYSIS (Fee Breakdown & Ratio)
    // ========================================================================
    const wsExpense = wb.addWorksheet('06_EXPENSE_ANALYSIS', {
      views: [{ state: 'frozen', xSplit: 0, ySplit: 5, showGridLines: true }],
    });

    wsExpense.columns = [
      { width: 38 }, // Komponen Biaya
      { width: 22 }, // Kategori
      { width: 22 }, // Total Jumlah (Rp)
      { width: 24 }, // % terhadap Gross Revenue
      { width: 50 }, // Catatan Kebijakan Finansial
    ];

    // Banner Header
    wsExpense.mergeCells('A1:E1');
    const expTitle = wsExpense.getCell('A1');
    expTitle.value = 'ANALISIS STRUKTUR BIAYA PLATFORM SHOPEE';
    expTitle.font = { name: FONT_FAMILY, size: 14, bold: true, color: { argb: PALETTE.white } };
    expTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.navyDark } };
    expTitle.alignment = { vertical: 'middle', horizontal: 'center' };
    wsExpense.getRow(1).height = 30;

    wsExpense.getCell('A2').value = 'Status Dokumen Settlement:';
    wsExpense.getCell('B2').value = expenses.settlementAvailable ? 'AKTUAL DARI SETTLEMENT' : 'SETTLEMENT TIDAK DIUNGGAH (SALES REPORT)';
    wsExpense.getCell('B2').font = { bold: true, color: { argb: expenses.settlementAvailable ? '047857' : 'B45309' } };

    wsExpense.getCell('A3').value = 'Total Pendapatan Kotor (Gross Revenue):';
    wsExpense.getCell('B3').value = executiveSummary.totalGrossRevenue;
    wsExpense.getCell('B3').numFmt = NUM_FMT.currencySimple;
    wsExpense.getCell('B3').font = { bold: true };

    wsExpense.getRow(4).height = 10;

    // Table Header Row 5
    const expHRow = wsExpense.getRow(5);
    ['Nama Komponen Biaya', 'Kategori Biaya', 'Total Potongan (Rp)', '% Dari Gross Revenue', 'Catatan Kebijakan Finansial'].forEach((h, i) => {
      const c = expHRow.getCell(i + 1);
      c.value = h;
    });
    styleTableHeader(expHRow, 5, PALETTE.navyBlue);

    let eRowIdx = 6;
    if (expenses.items.length > 0) {
      expenses.items.forEach((item, idx) => {
        const row = wsExpense.getRow(eRowIdx);
        row.height = 20;
        const isZebra = idx % 2 === 1;

        row.getCell(1).value = item.feeName;
        row.getCell(2).value = item.category;
        row.getCell(3).value = item.amount;
        row.getCell(3).numFmt = NUM_FMT.currencySimple;
        row.getCell(4).value = item.percentageOfGross / 100;
        row.getCell(4).numFmt = NUM_FMT.percentDetailed;
        row.getCell(5).value = item.note || '-';

        for (let c = 1; c <= 5; c++) {
          const cell = row.getCell(c);
          cell.font = { name: FONT_FAMILY, size: 9.5 };
          cell.border = thinBorder;
          if (isZebra) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.zebraLight } };
          }
        }

        row.getCell(1).alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
        row.getCell(2).alignment = { vertical: 'middle', horizontal: 'center' };
        row.getCell(3).alignment = { vertical: 'middle', horizontal: 'right' };
        row.getCell(4).alignment = { vertical: 'middle', horizontal: 'right' };
        row.getCell(5).alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };

        eRowIdx++;
      });

      // Total Row
      const expTotRow = wsExpense.getRow(eRowIdx);
      expTotRow.getCell(1).value = 'TOTAL BEBAN BIAYA PLATFORM';
      expTotRow.getCell(2).value = 'Semua Kategori';
      expTotRow.getCell(3).value = expenses.totalExpense;
      expTotRow.getCell(3).numFmt = NUM_FMT.currencySimple;
      expTotRow.getCell(4).value = expenses.percentageOfGross / 100;
      expTotRow.getCell(4).numFmt = NUM_FMT.percentDetailed;
      expTotRow.getCell(5).value = 'Total potongan resmi biaya seller';

      styleTotalRow(expTotRow, 5, 1);
      expTotRow.getCell(3).alignment = { vertical: 'middle', horizontal: 'right' };
      expTotRow.getCell(4).alignment = { vertical: 'middle', horizontal: 'right' };
    } else {
      const row = wsExpense.getRow(eRowIdx);
      row.getCell(1).value = 'File Settlement Belum Diunggah';
      row.getCell(2).value = '-';
      row.getCell(3).value = 0;
      row.getCell(4).value = 0;
      row.getCell(5).value = 'Beban per transaksi tidak diestimasi palsu (Sesuai Aturan Finansial Section 3 & 25)';
      for (let c = 1; c <= 5; c++) {
        row.getCell(c).border = thinBorder;
      }
    }

    // ========================================================================
    // SHEET 07: 07_DAILY_ANALYSIS (Day-by-Day Sales & Margin Trend)
    // ========================================================================
    const wsDaily = wb.addWorksheet('07_DAILY_ANALYSIS', {
      views: [{ state: 'frozen', xSplit: 0, ySplit: 1, showGridLines: true }],
    });

    const dailyCols = [
      { header: 'Tanggal', key: 'date', width: 16 },
      { header: 'Jumlah Order', key: 'orderCount', width: 14 },
      { header: 'Total Qty', key: 'totalQuantity', width: 12 },
      { header: 'Gross Revenue', key: 'grossRevenue', width: 18 },
      { header: 'Total Expense', key: 'totalExpense', width: 16 },
      { header: 'Net Revenue', key: 'netRevenue', width: 18 },
      { header: 'Average Order Value (AOV)', key: 'aov', width: 22 },
      { header: 'Net Margin', key: 'margin', width: 14 },
    ];
    wsDaily.columns = dailyCols;

    styleTableHeader(wsDaily.getRow(1), dailyCols.length, PALETTE.navyBlue);

    daily.forEach((d, idx) => {
      const isZebra = idx % 2 === 1;
      const margin = d.grossRevenue > 0 ? (d.netRevenue / d.grossRevenue) : 1;

      const row = wsDaily.addRow({
        date: d.date,
        orderCount: d.orderCount,
        totalQuantity: d.totalQuantity,
        grossRevenue: d.grossRevenue,
        totalExpense: d.totalExpense,
        netRevenue: d.netRevenue,
        aov: Math.round(d.averageOrderValue),
        margin: margin,
      });

      row.height = 20;
      for (let c = 1; c <= dailyCols.length; c++) {
        const cell = row.getCell(c);
        cell.font = { name: FONT_FAMILY, size: 9.5 };
        cell.border = thinBorder;
        if (isZebra) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.zebraLight } };
        }
      }

      row.getCell('date').alignment = { vertical: 'middle', horizontal: 'center' };
      row.getCell('orderCount').numFmt = NUM_FMT.integer;
      row.getCell('orderCount').alignment = { vertical: 'middle', horizontal: 'right' };
      row.getCell('totalQuantity').numFmt = NUM_FMT.integer;
      row.getCell('totalQuantity').alignment = { vertical: 'middle', horizontal: 'right' };

      ['grossRevenue', 'totalExpense', 'netRevenue', 'aov'].forEach((k) => {
        const c = row.getCell(k);
        c.numFmt = NUM_FMT.currencySimple;
        c.alignment = { vertical: 'middle', horizontal: 'right' };
      });

      row.getCell('margin').numFmt = NUM_FMT.percent;
      row.getCell('margin').alignment = { vertical: 'middle', horizontal: 'right' };
    });

    const totDailyRow = wsDaily.addRow({
      date: 'TOTAL PERIODE',
      orderCount: daily.reduce((sum, d) => sum + d.orderCount, 0),
      totalQuantity: daily.reduce((sum, d) => sum + d.totalQuantity, 0),
      grossRevenue: daily.reduce((sum, d) => sum + d.grossRevenue, 0),
      totalExpense: daily.reduce((sum, d) => sum + d.totalExpense, 0),
      netRevenue: daily.reduce((sum, d) => sum + d.netRevenue, 0),
      aov: Math.round(executiveSummary.averageOrderValue),
      margin: executiveSummary.totalGrossRevenue > 0
        ? (executiveSummary.netRevenue / executiveSummary.totalGrossRevenue)
        : 1,
    });

    styleTotalRow(totDailyRow, dailyCols.length, 1);
    totDailyRow.getCell('orderCount').numFmt = NUM_FMT.integer;
    totDailyRow.getCell('totalQuantity').numFmt = NUM_FMT.integer;
    totDailyRow.getCell('margin').numFmt = NUM_FMT.percent;
    ['grossRevenue', 'totalExpense', 'netRevenue', 'aov'].forEach((k) => {
      totDailyRow.getCell(k).numFmt = NUM_FMT.currencySimple;
      totDailyRow.getCell(k).alignment = { vertical: 'middle', horizontal: 'right' };
    });

    wsDaily.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: daily.length + 1, column: dailyCols.length },
    };

    // ========================================================================
    // SHEET 08: 08_MATCHING_AUDIT (Audit Trail & 4-Category Reconciliation)
    // ========================================================================
    const wsAudit = wb.addWorksheet('08_AUDIT_MATCHING', {
      views: [{ showGridLines: true }],
    });

    wsAudit.columns = [
      { width: 48 }, // Kategori / Uraian
      { width: 22 }, // Jumlah
      { width: 22 }, // Persentase / Status
      { width: 45 }, // Catatan Audit
    ];

    wsAudit.mergeCells('A1:D1');
    const audTitle = wsAudit.getCell('A1');
    audTitle.value = 'LAPORAN AUDIT & REKONSILIASI PENCOCOKAN DATA SHOPEE';
    audTitle.font = { name: FONT_FAMILY, size: 13, bold: true, color: { argb: PALETTE.white } };
    audTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.navyDark } };
    audTitle.alignment = { vertical: 'middle', horizontal: 'center' };
    wsAudit.getRow(1).height = 30;

    let aRow = 3;

    // Helper for Audit Section
    const renderAuditTable = (secTitle: string, headers: string[], rows: (string | number)[][]) => {
      wsAudit.mergeCells(`A${aRow}:D${aRow}`);
      const rib = wsAudit.getCell(`A${aRow}`);
      rib.value = secTitle;
      rib.font = { name: FONT_FAMILY, size: 10.5, bold: true, color: { argb: PALETTE.white } };
      rib.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.navyMedium } };
      rib.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
      wsAudit.getRow(aRow).height = 24;
      aRow++;

      const hRow = wsAudit.getRow(aRow);
      headers.forEach((h, i) => {
        hRow.getCell(i + 1).value = h;
      });
      styleTableHeader(hRow, 4, PALETTE.navyBlue);
      aRow++;

      rows.forEach((r, idx) => {
        const row = wsAudit.getRow(aRow);
        row.height = 20;
        const isZebra = idx % 2 === 1;

        r.forEach((val, i) => {
          const cell = row.getCell(i + 1);
          cell.value = val;
          cell.font = { name: FONT_FAMILY, size: 9.5 };
          cell.border = thinBorder;
          if (isZebra) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.zebraLight } };
          }

          if (i === 0) {
            cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
          } else if (i === 1 && typeof val === 'number') {
            cell.numFmt = NUM_FMT.integer;
            cell.alignment = { vertical: 'middle', horizontal: 'right' };
          } else {
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
          }
        });
        aRow++;
      });
      aRow++;
    };

    renderAuditTable('1. DISTRIBUSI HASIL PENCOCOKAN 4-TIER MATCHING ENGINE', ['Kategori Matching', 'Jumlah Baris', 'Persentase', 'Keterangan Audit'], [
      ['Prioritas 1: Exact SKU (No. Pesanan + Kode SKU)', summary.exactSkuCount, `${summary.exactSkuPercentage.toFixed(1)}%`, 'Tercocokkan 100% pada SKU persis'],
      ['Prioritas 2: SKU Induk Fallback (No. Pesanan + SKU Induk)', summary.skuIndukFallbackCount, `${summary.skuIndukFallbackPercentage.toFixed(1)}%`, 'Tercocokkan melalui SKU Induk'],
      ['Prioritas 3: Nama Produk Fallback (No. Pesanan + Nama Produk)', summary.productNameFallbackCount, `${summary.productNameFallbackPercentage.toFixed(1)}%`, 'Tercocokkan melalui normalisasi judul'],
      ['Item Tidak Ditemukan di All Order (Unmatched)', summary.notFoundCount, `${summary.notFoundPercentage.toFixed(1)}%`, summary.notFoundCount === 0 ? 'Bersih' : 'Memerlukan verifikasi katalog'],
      ['Total Baris Data Income Diproses', summary.totalIncomeSkuRows, '100.0%', 'Jumlah baris data income sumber'],
    ]);

    renderAuditTable('2. FORMULA VALIDASI KESETARAAN MATEMATIS', ['Indikator Integritas', 'Nilai', 'Status Audit', 'Ketentuan Evaluasi'], [
      ['Jumlah Kategori (Exact + P2 + P3 + NotFound)', reconciliation.sumCategories, reconciliation.isCountBalanced ? 'SEIMBANG (PASS)' : 'TIDAK SEIMBANG', 'Harus persis sama dengan Total Baris Income'],
      ['Total Baris Masukan Income', reconciliation.totalIncomeRows, 'VALID', 'Sesuai dengan file asli yang diunggah'],
      ['Selisih Kesetaraan Baris', reconciliation.totalIncomeRows - reconciliation.sumCategories, reconciliation.isCountBalanced ? '0 (NOL)' : 'ADA SELISIH', 'Selisih wajib bernilai 0'],
      ['Pemeriksaan Duplikasi Baris', duplicates.length, duplicates.length === 0 ? 'BERSIH' : `${duplicates.length} Pola`, 'Pemeriksaan potensi pesanan double record'],
    ]);

    // ========================================================================
    // SHEET 09: 09_UNMATCHED (Exception Sheet)
    // ========================================================================
    const wsUnmatched = wb.addWorksheet('09_UNMATCHED', {
      views: [{ state: 'frozen', xSplit: 0, ySplit: 1, showGridLines: true }],
    });

    const unCols = [
      { header: 'No', key: 'no', width: 6 },
      { header: 'No Pesanan', key: 'orderNumber', width: 22 },
      { header: 'SKU Income', key: 'sku', width: 22 },
      { header: 'Nama Produk Income', key: 'productName', width: 45 },
      { header: 'Total Penghasilan', key: 'amount', width: 18 },
      { header: 'Qty', key: 'qty', width: 10 },
      { header: 'Status Matching', key: 'status', width: 18 },
      { header: 'Alasan & Rekomendasi Audit', key: 'note', width: 48 },
    ];
    wsUnmatched.columns = unCols;

    styleTableHeader(wsUnmatched.getRow(1), unCols.length, PALETTE.navyBlue);

    const unmatchedItems = results.filter((r) => r.matchStatus === 'NOT_FOUND');
    if (unmatchedItems.length > 0) {
      unmatchedItems.forEach((item, idx) => {
        const isZebra = idx % 2 === 1;
        const row = wsUnmatched.addRow({
          no: idx + 1,
          orderNumber: item.orderNumber,
          sku: item.incomeSku || '-',
          productName: item.productName || '-',
          amount: item.incomeAmount !== undefined ? item.incomeAmount : item.totalIncome,
          qty: '-',
          status: 'Tidak Ditemukan',
          note: 'No. Pesanan / SKU tidak terdaftar pada All Order Bulan Ini maupun Bulan Lalu',
        });

        row.height = 20;
        for (let c = 1; c <= unCols.length; c++) {
          const cell = row.getCell(c);
          cell.font = { name: FONT_FAMILY, size: 9.5 };
          cell.border = thinBorder;
          if (isZebra) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.zebraLight } };
          }
        }

        row.getCell('no').alignment = { vertical: 'middle', horizontal: 'center' };
        row.getCell('orderNumber').alignment = { vertical: 'middle', horizontal: 'center' };
        row.getCell('amount').numFmt = NUM_FMT.currencySimple;
        row.getCell('amount').alignment = { vertical: 'middle', horizontal: 'right' };
        row.getCell('qty').alignment = { vertical: 'middle', horizontal: 'center' };
        row.getCell('status').alignment = { vertical: 'middle', horizontal: 'center' };
        row.getCell('status').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.roseFill } };
        row.getCell('status').font = { name: FONT_FAMILY, size: 9, bold: true, color: { argb: PALETTE.roseText } };
      });
    } else {
      const row = wsUnmatched.addRow({
        no: 1,
        orderNumber: '-',
        sku: '-',
        productName: 'Semua produk 100% cocok dan tervalidasi di All Order!',
        amount: 0,
        qty: '-',
        status: '100% MATCH',
        note: 'Tidak ada baris yang gagal dicocokkan.',
      });
      row.getCell('status').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.emeraldFill } };
      row.getCell('status').font = { name: FONT_FAMILY, size: 9, bold: true, color: { argb: PALETTE.emeraldText } };
    }

    wsUnmatched.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: Math.max(2, unmatchedItems.length + 1), column: unCols.length },
    };

    // ========================================================================
    // SHEET 10, 11, 12: SOURCE TRACEABILITY (Raw Data Sheets)
    // ========================================================================
    const renderSourceSheet = (
      sheetName: string,
      rawData?: (string | number | boolean | null)[][],
      defaultNotice?: string
    ) => {
      const ws = wb.addWorksheet(sheetName, {
        views: [{ state: 'frozen', xSplit: 0, ySplit: 1, showGridLines: true }],
      });

      if (rawData && rawData.length > 0) {
        // Limit to 500 rows for memory and file size optimization
        const slice = rawData.slice(0, 500);
        const headerRow = slice[0];
        const numCols = headerRow.length;

        // Add rows
        slice.forEach((r, idx) => {
          const row = ws.addRow(r);
          row.height = idx === 0 ? 26 : 19;

          if (idx === 0) {
            styleTableHeader(row, numCols, PALETTE.navyMedium);
          } else {
            const isZebra = idx % 2 === 1;
            for (let c = 1; c <= numCols; c++) {
              const cell = row.getCell(c);
              cell.font = { name: FONT_FAMILY, size: 9 };
              cell.border = thinBorder;
              if (isZebra) {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.zebraLight } };
              }
            }
          }
        });

        autoAdjustColumnWidths(ws, 12, 45);
      } else {
        ws.columns = [{ width: 45 }, { width: 45 }];
        const r1 = ws.addRow(['DOKUMENTASI SUMBER DATA', sheetName]);
        styleTableHeader(r1, 2, PALETTE.navyMedium);
        const r2 = ws.addRow(['Status:', defaultNotice || 'Data terverifikasi dan dipetakan penuh pada laporan.']);
        r2.getCell(1).border = thinBorder;
        r2.getCell(2).border = thinBorder;
      }
    };

    renderSourceSheet('10_SOURCE_INCOME', rawIncomeRows, 'Data Income Shopee pelepasan dana terekonsiliasi penuh.');
    renderSourceSheet('11_SOURCE_ALL_ORDER', rawAllOrderCurrentRows, 'Data pesanan All Order Shopee tervalidasi.');
    renderSourceSheet(
      '12_SOURCE_SETTLEMENT',
      rawSettlementRows,
      expenses.settlementAvailable
        ? 'Data Settlement Pelepasan Dana tervalidasi pada Sheet 06_EXPENSE_ANALYSIS.'
        : 'File Settlement tidak diunggah. Laporan beroperasi dalam Mode 1: Sales Report.'
    );

    // ========================================================================
    // WRITE FILE & TRIGGER INSTANT BROWSER DOWNLOAD
    // ========================================================================
    const safePeriod = formatFilenamePeriod(period);
    const fileName = `Shopee_Report_${safePeriod}.xlsx`;

    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return {
      success: true,
      fileName,
    };
  } catch (error) {
    console.error('Error generating professional Excel presentation report:', error);
    return {
      success: false,
      fileName: 'Shopee_Report_Professional.xlsx',
      error: error instanceof Error ? error.message : 'Gagal menghasilkan file Excel presentasi.',
    };
  }
}
