import * as XLSX from 'xlsx';
import { IncomeSummaryData, IncomeSummaryCategory } from '../types/fileTypes';
import { parseNumber } from './matchingEngine';

/**
 * Extracts numeric value from a row where label matches.
 * Scans cells starting from the right (usually col D, then col C).
 */
function extractRowNumber(row: (string | number | boolean | null)[]): number {
  if (!row || row.length === 0) return 0;
  for (let c = row.length - 1; c >= 1; c--) {
    const val = row[c];
    if (typeof val === 'number') return val;
    if (val !== null && val !== undefined && String(val).trim() !== '') {
      const parsed = parseNumber(val);
      if (!isNaN(parsed) && parsed !== 0) return parsed;
      if (String(val).trim() === '0') return 0;
    }
  }
  return 0;
}

/**
 * Extracts string value from column B or first non-empty cell after col 0
 */
function extractRowString(row: (string | number | boolean | null)[]): string {
  if (!row || row.length < 2) return '';
  for (let c = 1; c < row.length; c++) {
    const val = row[c];
    if (val !== null && val !== undefined && String(val).trim() !== '') {
      return String(val).trim();
    }
  }
  return '';
}

/**
 * Normalizes label for case-insensitive matching
 */
function normLabel(text: unknown): string {
  if (text === null || text === undefined) return '';
  return String(text)
    .toLowerCase()
    .replace(/[0-9]+\.\s*/g, '') // remove "1. ", "2. ", "3. "
    .trim()
    .replace(/\s+/g, ' ');
}

/**
 * Checks if a sheet looks like Shopee's official "Summary" (Ringkasan Penghasilan)
 */
export function isShopeeIncomeSummarySheet(sheet: XLSX.WorkSheet): boolean {
  const rawData: (string | number | boolean | null)[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: '',
    blankrows: false,
  });

  if (!rawData || rawData.length < 5) return false;

  let matches = 0;
  for (let r = 0; r < Math.min(rawData.length, 30); r++) {
    const rowStr = (rawData[r] || []).map((c) => String(c).toLowerCase()).join(' ');
    if (rowStr.includes('ringkasan penghasilan') || rowStr.includes('laporan penghasilan')) matches += 2;
    if (rowStr.includes('total pendapatan')) matches += 2;
    if (rowStr.includes('total pengeluaran')) matches += 2;
    if (rowStr.includes('total yang dilepas')) matches += 3;
    if (rowStr.includes('biaya platform')) matches += 1;
    if (rowStr.includes('harga asli produk')) matches += 1;
  }

  return matches >= 4;
}

/**
 * Parses Shopee's official Summary sheet into IncomeSummaryData
 */
export function parseIncomeSummarySheet(sheet: XLSX.WorkSheet): IncomeSummaryData | null {
  const rawData: (string | number | boolean | null)[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: '',
    blankrows: false,
  });

  if (!rawData || rawData.length < 5) return null;

  let username = '';
  let startDate = '';
  let endDate = '';

  let totalIncomeGross = 0;
  let subtotalPesanan = 0;
  let originalProductPrice = 0;
  let buyerRefund = 0;
  let voucherSubsidi = 0;
  let sellerVoucher = 0;
  let shopeeDiscount = 0;

  let totalPengeluaran = 0;
  let shippingCostTotal = 0;
  let platformFeesTotal = 0;
  let adminFee = 0;
  let orderProcessingFee = 0;
  let paymentFee = 0;

  let freeShippingXtraTotal = 0;
  let freeShippingXtraSpecial = 0;
  let freeShippingXtraRegular = 0;

  let serviceFeeTotal = 0;
  let transactionFee = 0;
  let shopeeLiveXtraFee = 0;

  let promotionFeeTotal = 0;
  let amsCommission = 0;
  let autoTopUpSaldo = 0;

  let otherFeesTotal = 0;
  let shippingProgramFee = 0;

  let totalYangDilepasNet = 0;

  for (let r = 0; r < rawData.length; r++) {
    const row = rawData[r];
    if (!row || row.length === 0) continue;

    // Scan column 0 and column 1 for label
    const labelA = normLabel(row[0]);
    const labelB = normLabel(row[1]);
    const combinedLabel = `${labelA} ${labelB}`.trim();

    // Metadata
    if (labelA.includes('username')) {
      username = extractRowString(row);
    } else if (labelA === 'dari') {
      startDate = extractRowString(row);
    } else if (labelA === 'ke') {
      endDate = extractRowString(row);
    }

    // 1. Total Pendapatan
    if (labelA.includes('total pendapatan')) {
      totalIncomeGross = Math.abs(extractRowNumber(row));
    } else if (labelA.includes('subtotal pesanan')) {
      subtotalPesanan = Math.abs(extractRowNumber(row));
    } else if (labelB.includes('harga asli produk') || combinedLabel.includes('harga asli produk')) {
      originalProductPrice = Math.abs(extractRowNumber(row));
    } else if (labelB.includes('pengembalian dana') || combinedLabel.includes('pengembalian dana')) {
      buyerRefund = extractRowNumber(row);
    } else if (labelA.includes('voucher & subsidi') || labelA.includes('voucher dan subsidi')) {
      voucherSubsidi = extractRowNumber(row);
    } else if (labelB.includes('voucher disponsor oleh penjual') || combinedLabel.includes('voucher disponsor')) {
      sellerVoucher = extractRowNumber(row);
    } else if (labelB.includes('diskon produk dari shopee') || combinedLabel.includes('diskon produk dari shopee')) {
      shopeeDiscount = extractRowNumber(row);
    }

    // 2. Total Pengeluaran
    if (labelA.includes('total pengeluaran')) {
      totalPengeluaran = Math.abs(extractRowNumber(row));
    } else if (labelA.includes('total biaya pengiriman') || labelA.includes('biaya pengiriman')) {
      shippingCostTotal = Math.abs(extractRowNumber(row));
    } else if (labelA.includes('biaya platform')) {
      platformFeesTotal = Math.abs(extractRowNumber(row));
    } else if (labelB.includes('biaya administrasi') || combinedLabel.includes('administrasi')) {
      adminFee = Math.abs(extractRowNumber(row));
    } else if (labelB.includes('biaya proses pesanan') || combinedLabel.includes('proses pesanan')) {
      orderProcessingFee = Math.abs(extractRowNumber(row));
    } else if (labelB.includes('biaya pembayaran') || combinedLabel.includes('biaya pembayaran')) {
      paymentFee = Math.abs(extractRowNumber(row));
    } else if (labelA.includes('gratis ongkir xtra') || combinedLabel.includes('gratis ongkir xtra')) {
      freeShippingXtraTotal = Math.abs(extractRowNumber(row));
    } else if (labelB.includes('ukuran khusus') || combinedLabel.includes('ukuran khusus')) {
      freeShippingXtraSpecial = Math.abs(extractRowNumber(row));
    } else if (labelB.includes('ukuran biasa') || combinedLabel.includes('ukuran biasa')) {
      freeShippingXtraRegular = Math.abs(extractRowNumber(row));
    } else if (labelA.includes('biaya layanan')) {
      serviceFeeTotal = Math.abs(extractRowNumber(row));
    } else if (labelB.includes('biaya transaksi') || combinedLabel.includes('biaya transaksi')) {
      transactionFee = Math.abs(extractRowNumber(row));
    } else if (labelB.includes('shopee live xtra') || combinedLabel.includes('shopee live xtra')) {
      shopeeLiveXtraFee = Math.abs(extractRowNumber(row));
    } else if (labelA.includes('biaya promosi')) {
      promotionFeeTotal = Math.abs(extractRowNumber(row));
    } else if (labelB.includes('komisi ams') || combinedLabel.includes('komisi ams')) {
      amsCommission = Math.abs(extractRowNumber(row));
    } else if (labelB.includes('saldo otomatis') || combinedLabel.includes('saldo otomatis')) {
      autoTopUpSaldo = Math.abs(extractRowNumber(row));
    } else if (labelA.includes('biaya lainnya')) {
      otherFeesTotal = Math.abs(extractRowNumber(row));
    } else if (labelB.includes('hemat biaya kirim') || combinedLabel.includes('hemat biaya kirim')) {
      shippingProgramFee = Math.abs(extractRowNumber(row));
    }

    // 3. Total yang Dilepas
    if (labelA.includes('total yang dilepas') || combinedLabel.includes('total yang dilepas')) {
      totalYangDilepasNet = Math.abs(extractRowNumber(row));
    }
  }

  // Cross-sum platform fee if subcategories exist
  if (platformFeesTotal === 0 && (adminFee > 0 || orderProcessingFee > 0 || paymentFee > 0)) {
    platformFeesTotal = adminFee + orderProcessingFee + paymentFee;
  }

  // Cross-sum promo fee
  if (promotionFeeTotal === 0 && (amsCommission > 0 || autoTopUpSaldo > 0)) {
    promotionFeeTotal = amsCommission + autoTopUpSaldo;
  }

  // Cross-sum free shipping xtra
  if (freeShippingXtraTotal === 0 && (freeShippingXtraSpecial > 0 || freeShippingXtraRegular > 0)) {
    freeShippingXtraTotal = freeShippingXtraSpecial + freeShippingXtraRegular;
  }

  // Cross-sum service fee
  if (serviceFeeTotal === 0 && (transactionFee > 0 || shopeeLiveXtraFee > 0)) {
    serviceFeeTotal = transactionFee + shopeeLiveXtraFee;
  }

  // Cross-sum total pengeluaran if not directly found
  if (totalPengeluaran === 0) {
    totalPengeluaran =
      shippingCostTotal +
      platformFeesTotal +
      freeShippingXtraTotal +
      serviceFeeTotal +
      promotionFeeTotal +
      otherFeesTotal;
  }

  // If total yang dilepas not found, calculate mathematically
  if (totalYangDilepasNet === 0 && totalIncomeGross > 0) {
    totalYangDilepasNet = Math.max(0, totalIncomeGross - totalPengeluaran);
  }

  // Categories for reporting
  const categories: IncomeSummaryCategory[] = [
    {
      name: 'Biaya Platform (Admin, Proses & Pembayaran)',
      amount: platformFeesTotal,
      subItems: [
        { name: 'Biaya Administrasi (termasuk PPN 11%)', amount: adminFee },
        { name: 'Biaya Proses Pesanan', amount: orderProcessingFee },
        { name: 'Biaya Pembayaran', amount: paymentFee },
      ].filter((s) => s.amount > 0),
    },
    {
      name: 'Biaya Promosi (AMS & Saldo Iklan)',
      amount: promotionFeeTotal,
      subItems: [
        { name: 'Biaya Isi Saldo Otomatis (Iklan)', amount: autoTopUpSaldo },
        { name: 'Biaya Komisi AMS (Afiliasi)', amount: amsCommission },
      ].filter((s) => s.amount > 0),
    },
    {
      name: 'Biaya Gratis Ongkir XTRA',
      amount: freeShippingXtraTotal,
      subItems: [
        { name: 'Gratis Ongkir XTRA - Ukuran Biasa', amount: freeShippingXtraRegular },
        { name: 'Gratis Ongkir XTRA - Ukuran Khusus', amount: freeShippingXtraSpecial },
      ].filter((s) => s.amount > 0),
    },
    {
      name: 'Biaya Layanan & Shopee Live XTRA',
      amount: serviceFeeTotal,
      subItems: [
        { name: 'Biaya Layanan Shopee Live XTRA', amount: shopeeLiveXtraFee },
        { name: 'Biaya Transaksi', amount: transactionFee },
      ].filter((s) => s.amount > 0),
    },
    {
      name: 'Biaya Pengiriman (Ongkir Bersih)',
      amount: shippingCostTotal,
    },
    {
      name: 'Biaya Lainnya (Program Hemat Ongkir)',
      amount: otherFeesTotal || shippingProgramFee,
      subItems: shippingProgramFee > 0 ? [{ name: 'Biaya Program Hemat Biaya Kirim', amount: shippingProgramFee }] : undefined,
    },
  ].filter((c) => c.amount > 0);

  return {
    hasSummarySheet: true,
    username,
    startDate,
    endDate,
    totalIncomeGross,
    subtotalPesanan: subtotalPesanan || originalProductPrice,
    originalProductPrice,
    buyerRefund,
    voucherSubsidi,
    sellerVoucher,
    shopeeDiscount,
    totalPengeluaran,
    shippingCostTotal,
    platformFeesTotal,
    adminFee,
    orderProcessingFee,
    paymentFee,
    freeShippingXtraTotal,
    serviceFeeTotal,
    transactionFee,
    shopeeLiveXtraFee,
    promotionFeeTotal,
    amsCommission,
    autoTopUpSaldo,
    otherFeesTotal,
    shippingProgramFee,
    totalYangDilepasNet,
    categories,
  };
}
