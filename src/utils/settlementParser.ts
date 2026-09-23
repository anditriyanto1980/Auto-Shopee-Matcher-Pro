import * as XLSX from 'xlsx';
import { SettlementRecord } from '../types/reportTypes';
import { UploadedFile } from '../types/fileTypes';
import { normalizeKey, parseNumber } from './matchingEngine';
import { normalizeHeader } from './excelParser';

export const REQUIRED_SETTLEMENT_HEADERS = ['No. Pesanan'];

export interface ParsedSettlementData {
  orderMap: Map<string, SettlementRecord>;
  totalOrders: number;
  totalGross: number;
  totalAdminFee: number;
  totalServiceFee: number;
  totalPaymentFee: number;
  totalShippingFee: number;
  totalPromotionFee: number;
  totalOtherFee: number;
  totalRefund: number;
  totalAdjustment: number;
  totalDeductions: number;
  totalNetSettlement: number;
  headers: string[];
  rawRows: (string | number | boolean | null)[][];
}

/**
 * Parses raw settlement sheet into normalized records
 */
export function parseSettlementSheet(
  rawRows: (string | number | boolean | null)[][],
  headerRowIndex: number,
): ParsedSettlementData {
  const orderMap = new Map<string, SettlementRecord>();

  if (!rawRows || rawRows.length <= headerRowIndex + 1) {
    return {
      orderMap,
      totalOrders: 0,
      totalGross: 0,
      totalAdminFee: 0,
      totalServiceFee: 0,
      totalPaymentFee: 0,
      totalShippingFee: 0,
      totalPromotionFee: 0,
      totalOtherFee: 0,
      totalRefund: 0,
      totalAdjustment: 0,
      totalDeductions: 0,
      totalNetSettlement: 0,
      headers: [],
      rawRows: [],
    };
  }

  const rawHeaders = rawRows[headerRowIndex] || [];
  const normHeaders = rawHeaders.map((h) => normalizeHeader(h));

  // Find column indices
  const findCol = (keywords: string[]): number => {
    return normHeaders.findIndex((h) => keywords.some((k) => h.includes(k)));
  };

  const orderCol = findCol(['no. pesanan', 'nomor pesanan', 'order id', 'no pesanan']);
  const dateCol = findCol(['waktu pesanan', 'tanggal pesanan', 'waktu selesai', 'tanggal selesai', 'tanggal']);
  const grossCol = findCol(['harga asli', 'harga produk', 'total harga produk', 'penghasilan kotor', 'subtotal']);
  const discountCol = findCol(['total diskon', 'diskon produk', 'diskon penjual', 'voucher']);
  const adminCol = findCol(['biaya administrasi', 'biaya admin']);
  const serviceCol = findCol(['biaya layanan', 'service fee']);
  const paymentCol = findCol(['biaya pembayaran', 'biaya transaksi']);
  const shippingCol = findCol(['biaya pengiriman', 'ongkos kirim', 'ongkir']);
  const promoCol = findCol(['biaya promosi', 'biaya kampanye', 'iklan']);
  const otherCol = findCol(['biaya lainnya', 'biaya proses', 'biaya program']);
  const refundCol = findCol(['pengembalian dana', 'refund', 'pengembalian']);
  const adjCol = findCol(['penyesuaian', 'kompensasi']);
  const netCol = findCol(['penghasilan bersih', 'total penghasilan', 'jumlah ditransfer', 'dana dilepaskan', 'settlement']);

  let totalGross = 0;
  let totalAdminFee = 0;
  let totalServiceFee = 0;
  let totalPaymentFee = 0;
  let totalShippingFee = 0;
  let totalPromotionFee = 0;
  let totalOtherFee = 0;
  let totalRefund = 0;
  let totalAdjustment = 0;
  let totalDeductions = 0;
  let totalNetSettlement = 0;

  for (let r = headerRowIndex + 1; r < rawRows.length; r++) {
    const row = rawRows[r];
    if (!row || !Array.isArray(row)) continue;

    const rawOrder = orderCol !== -1 ? row[orderCol] : '';
    const normOrder = normalizeKey(rawOrder);
    if (!normOrder) continue;

    const orderDate = dateCol !== -1 && row[dateCol] ? String(row[dateCol]).trim() : '';
    const grossAmount = grossCol !== -1 ? Math.abs(parseNumber(row[grossCol])) : 0;
    const discount = discountCol !== -1 ? Math.abs(parseNumber(row[discountCol])) : 0;
    const adminFee = adminCol !== -1 ? Math.abs(parseNumber(row[adminCol])) : 0;
    const serviceFee = serviceCol !== -1 ? Math.abs(parseNumber(row[serviceCol])) : 0;
    const paymentFee = paymentCol !== -1 ? Math.abs(parseNumber(row[paymentCol])) : 0;
    const shippingFee = shippingCol !== -1 ? Math.abs(parseNumber(row[shippingCol])) : 0;
    const promotionFee = promoCol !== -1 ? Math.abs(parseNumber(row[promoCol])) : 0;
    const otherFee = otherCol !== -1 ? Math.abs(parseNumber(row[otherCol])) : 0;
    const refund = refundCol !== -1 ? Math.abs(parseNumber(row[refundCol])) : 0;
    const adjustment = adjCol !== -1 ? parseNumber(row[adjCol]) : 0;

    let netSettlementAmount = 0;
    if (netCol !== -1 && row[netCol] !== undefined && row[netCol] !== '') {
      netSettlementAmount = parseNumber(row[netCol]);
    } else {
      // Calculate net if not explicitly given
      const sumExpenses = adminFee + serviceFee + paymentFee + shippingFee + promotionFee + otherFee;
      netSettlementAmount = grossAmount - discount - sumExpenses - refund + adjustment;
    }

    const orderDeductions = adminFee + serviceFee + paymentFee + shippingFee + promotionFee + otherFee;

    // Check if order already in map (e.g. multi-line settlement/adjustments)
    const existing = orderMap.get(normOrder);
    if (existing) {
      existing.grossAmount += grossAmount;
      existing.discount += discount;
      existing.adminFee += adminFee;
      existing.serviceFee += serviceFee;
      existing.paymentFee += paymentFee;
      existing.shippingFee += shippingFee;
      existing.promotionFee += promotionFee;
      existing.otherFee += otherFee;
      existing.refund += refund;
      existing.adjustment += adjustment;
      existing.totalDeductions += orderDeductions;
      existing.netSettlementAmount += netSettlementAmount;
    } else {
      orderMap.set(normOrder, {
        orderNumber: String(rawOrder).trim(),
        orderDate,
        grossAmount,
        discount,
        sellerVoucher: discount,
        adminFee,
        serviceFee,
        paymentFee,
        shippingFee,
        promotionFee,
        otherFee,
        refund,
        adjustment,
        totalDeductions: orderDeductions,
        netSettlementAmount,
        sourceRow: r + 1,
      });
    }

    totalGross += grossAmount;
    totalAdminFee += adminFee;
    totalServiceFee += serviceFee;
    totalPaymentFee += paymentFee;
    totalShippingFee += shippingFee;
    totalPromotionFee += promotionFee;
    totalOtherFee += otherFee;
    totalRefund += refund;
    totalAdjustment += adjustment;
    totalDeductions += orderDeductions;
    totalNetSettlement += netSettlementAmount;
  }

  return {
    orderMap,
    totalOrders: orderMap.size,
    totalGross,
    totalAdminFee,
    totalServiceFee,
    totalPaymentFee,
    totalShippingFee,
    totalPromotionFee,
    totalOtherFee,
    totalRefund,
    totalAdjustment,
    totalDeductions,
    totalNetSettlement,
    headers: rawHeaders.map((h) => String(h || '')),
    rawRows,
  };
}

/**
 * Parses an UploadedFile instance for settlement
 */
export function parseSettlementFile(file: UploadedFile | null): ParsedSettlementData | null {
  if (!file || file.status !== 'valid' || !file.rawRows || file.rawRows.length === 0) {
    return null;
  }
  return parseSettlementSheet(file.rawRows, file.headerRowIndex ?? 0);
}
