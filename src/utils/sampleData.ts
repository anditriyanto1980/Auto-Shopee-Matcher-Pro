import * as XLSX from 'xlsx';

/**
 * Creates a sample Income Shopee file as an XLSX File object
 */
export function createSampleIncomeFile(): File {
  const wsData = [
    // Realistic Shopee income header row with mandatory columns
    [
      'Lihat berdasarkan',
      'No. Pesanan',
      'Waktu Pesanan Dibuat',
      'ID Produk',
      'Nama Produk',
      'Nama Variasi',
      'Harga Asli Produk',
      'Total Diskon Produk',
      'Total Penghasilan',
      'Status Pesanan',
    ],
    // Pesanan level rows (should be skipped by matching filter)
    [
      'Pesanan',
      '260901ABCD1234',
      '2026-09-01 10:15:22',
      '',
      'Total Pesanan 260901ABCD1234',
      '',
      129000,
      15000,
      114000,
      'Selesai',
    ],
    // Sku level rows (these MUST be matched)
    [
      'Sku',
      '260901ABCD1234',
      '2026-09-01 10:15:22',
      'KLN-NAVY-L',
      'Kemeja Linen Pria Casual Lengan Pendek',
      'Navy - L',
      129000,
      15000,
      114000,
      'Selesai',
    ],
    [
      'Sku',
      '260902EFGH5678',
      '2026-09-02 14:22:40',
      'CCN-KHK-32',
      'Celana Chino Panjang Slimfit Pria',
      'Khaki - 32',
      165000,
      20000,
      145000,
      'Selesai',
    ],
    [
      'Sku',
      '260903IJKL9012',
      '2026-09-03 09:05:11',
      'KOS-HTM-XL',
      'Kaos Polos Cotton Combed 30s',
      'Hitam - XL',
      55000,
      5000,
      100000,
      'Selesai',
    ],
    // Fallback case: Income ID Produk matches All Order's SKU Induk ("JKT-HOODIE-FLC")
    [
      'Sku',
      '260904MNOP3456',
      '2026-09-04 16:48:19',
      'JKT-HOODIE-FLC',
      'Jaket Hoodie Fleece Tebal Unisex',
      'Abu Misty - L',
      189000,
      25000,
      164000,
      'Selesai',
    ],
    // Previous Month case: Order from previous month
    [
      'Sku',
      '260830PREV3333',
      '2026-08-30 11:20:00',
      'KOS-PUT-L',
      'Kaos Polos Cotton Combed 30s',
      'Putih - L',
      55000,
      5000,
      150000,
      'Selesai',
    ],
    // Not found case: SKU not in all order files
    [
      'Sku',
      '260999NOTFOUND',
      '2026-09-20 08:00:00',
      'UNKNOWN-SKU-999',
      'Produk Khusus Promo Shopee Flash',
      'Default',
      75000,
      0,
      75000,
      'Selesai',
    ],
  ];

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Penghasilan');

  const u8 = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new File([u8], 'Income.sudah_dilepas.id.20260901_20260923.xlsx', {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

/**
 * Creates a sample All Order Bulan Ini file as an XLSX File object
 */
export function createSampleAllOrderCurrentFile(): File {
  const wsData = [
    [
      'No. Pesanan',
      'Status Pesanan',
      'Alasan Pembatalan',
      'Status Pembatalan/Pengembalian',
      'Nomor Pelacakan',
      'Opsi Pengiriman',
      'SKU Induk',
      'Nama Produk',
      'Nomor Referensi SKU',
      'Nama Variasi',
      'Harga Awal',
      'Harga Setelah Diskon',
      'Jumlah',
      'Total Harga Produk',
    ],
    [
      '260901ABCD1234',
      'Selesai',
      '',
      '',
      'SPXID0481928419',
      'SPX Standard',
      'KMJ-LINEN-PRIA',
      'Kemeja Linen Pria Casual Lengan Pendek',
      'KLN-NAVY-L',
      'Navy - L',
      129000,
      114000,
      1,
      114000,
    ],
    [
      '260902EFGH5678',
      'Selesai',
      '',
      '',
      'SPXID0481928420',
      'SPX Standard',
      'CLN-CHINO-SLIM',
      'Celana Chino Panjang Slimfit Pria',
      'CCN-KHK-32',
      'Khaki - 32',
      165000,
      145000,
      1,
      145000,
    ],
    [
      '260903IJKL9012',
      'Selesai',
      '',
      '',
      'JP092819284',
      'J&T Express',
      'KOS-COMBED-30S',
      'Kaos Polos Cotton Combed 30s',
      'KOS-HTM-XL',
      'Hitam - XL',
      55000,
      50000,
      2,
      100000,
    ],
    [
      '260904MNOP3456',
      'Selesai',
      '',
      '',
      'SPXID0481928421',
      'SPX Standard',
      'JKT-HOODIE-FLC',
      'Jaket Hoodie Fleece Tebal Unisex',
      'JKT-ABU-L',
      'Abu Misty - L',
      189000,
      164000,
      1,
      164000,
    ],
    [
      '260905QRST7890',
      'Selesai',
      '',
      '',
      'SPXID0481928422',
      'SPX Standard',
      'TOP-BASEBALL-PRM',
      'Topi Baseball Distro Premium',
      'TOP-HTM-STD',
      'Hitam',
      45000,
      45000,
      1,
      45000,
    ],
  ];

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'orders');

  const u8 = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new File([u8], 'All_Order.Bulan_Berjalan.202609.xlsx', {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

/**
 * Creates a sample All Order Bulan Sebelumnya file as an XLSX File object
 */
export function createSampleAllOrderPreviousFile(): File {
  const wsData = [
    [
      'No. Pesanan',
      'Status Pesanan',
      'Alasan Pembatalan',
      'Status Pembatalan/Pengembalian',
      'Nomor Pelacakan',
      'Opsi Pengiriman',
      'SKU Induk',
      'Nama Produk',
      'Nomor Referensi SKU',
      'Nama Variasi',
      'Harga Awal',
      'Harga Setelah Diskon',
      'Jumlah',
      'Total Harga Produk',
    ],
    [
      '260828PREV1111',
      'Selesai',
      '',
      '',
      'SPXID0481111111',
      'SPX Standard',
      'KMJ-LINEN-PRIA',
      'Kemeja Linen Pria Casual Lengan Pendek',
      'KLN-NAVY-M',
      'Navy - M',
      129000,
      114000,
      1,
      114000,
    ],
    [
      '260829PREV2222',
      'Selesai',
      '',
      '',
      'SPXID0482222222',
      'SPX Standard',
      'CLN-CHINO-SLIM',
      'Celana Chino Panjang Slimfit Pria',
      'CCN-HIT-30',
      'Hitam - 30',
      165000,
      145000,
      1,
      145000,
    ],
    [
      '260830PREV3333',
      'Selesai',
      '',
      '',
      'JP092833333',
      'J&T Express',
      'KOS-COMBED-30S',
      'Kaos Polos Cotton Combed 30s',
      'KOS-PUT-L',
      'Putih - L',
      55000,
      50000,
      3,
      150000,
    ],
  ];

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'orders');

  const u8 = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new File([u8], 'All_Order.Bulan_Sebelumnya.202608.xlsx', {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}
