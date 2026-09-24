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
    // Priority 3 Fallback case: All Order SKU & SKU Induk are empty, matched via Nama Produk
    [
      'Sku',
      '260906FALLBACKPROD',
      '2026-09-05 11:10:00',
      'TB-KANVAS-BW',
      'Totebag Kanvas Premium Resleting',
      'Broken White',
      65000,
      5000,
      120000,
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

  const summarySheetData: (string | number | null)[][] = [
    ['Laporan Penghasilan', '', '', ''],
    ['', '', '', ''],
    ['', '', '', ''],
    ['', '', '', ''],
    ['Rincian Laporan', '', '', ''],
    ['Username (Penjual)', 'allkurma', '', ''],
    ['Dari', '2026-09-01', '', ''],
    ['ke', '2026-09-23', '', ''],
    ['', '', '', ''],
    ['Ringkasan Penghasilan', '', '', 'Rp'],
    ['1. Total Pendapatan', '', '', 138515379],
    ['Subtotal Pesanan', '', '', 138119278],
    ['', 'Harga Asli Produk', 138509278, ''],
    ['', 'Jumlah Pengembalian Dana ke Pembeli', -390000, ''],
    ['Voucher & Subsidi', '', '', 396101],
    ['', 'Voucher disponsor oleh Penjual', -173300, ''],
    ['', 'Cashback Koin disponsori Penjual', 0, ''],
    ['', 'Diskon Produk dari Shopee', 569401, ''],
    ['', 'Voucher co-fund disponsor oleh Penjual', 0, ''],
    ['', 'Cashback Koin Co-fund disponsori Penjual', 0, ''],
    ['2. Total Pengeluaran', '', '', -33562411],
    ['Total Biaya Pengiriman', '', '', -1413481],
    ['', 'Ongkir Dibayar Pembeli', 734916, ''],
    ['', 'Ongkir yang Diteruskan oleh Shopee ke Jasa Kirim', -21924512, ''],
    ['', 'Diskon Ongkir Ditanggung Jasa Kirim', 0, ''],
    ['', 'Gratis Ongkir dari Shopee', 19776115, ''],
    ['', 'Ongkos Kirim Pengembalian Barang', 0, ''],
    ['', 'Kembali ke Biaya Pengiriman Pengirim', 0, ''],
    ['', 'Pengembalian Biaya Kirim', 0, ''],
    ['Biaya Platform', '', '', -13391294],
    ['', 'Biaya Administrasi (termasuk PPN 11%)', -9416828, ''],
    ['', 'Biaya Proses Pesanan', -1481250, ''],
    ['', 'Biaya Pembayaran', -2493216, ''],
    ['Biaya Gratis Ongkir XTRA', '', '', -6907656],
    ['', 'Biaya Gratis Ongkir XTRA - Ukuran Khusus (Kategori E)', -2697799, ''],
    ['', 'Biaya Gratis Ongkir XTRA - Ukuran Biasa (Kategori E)', -4209857, ''],
    ['Biaya Layanan', '', '', -2093225],
    ['', 'Biaya Transaksi', -313658, ''],
    ['', 'Biaya Layanan Shopee Live XTRA', -1779567, ''],
    ['Biaya Promosi', '', '', -9341655],
    ['', 'Biaya Kampanye', 0, ''],
    ['', 'Biaya Komisi AMS', -1653856, ''],
    ['', 'Biaya Isi Saldo Otomatis (dari Penghasilan)', -7687799, ''],
    ['Biaya Lainnya', '', '', -415100],
    ['', 'Biaya Program Hemat Biaya Kirim', -415100, ''],
    ['', 'Premi', 0, ''],
    ['Pajak', '', '', 0],
    ['', 'PPh 22', 0, ''],
    ['', '', '', ''],
    ['3. Total yang Dilepas', '', '', 104952968],
    ['', '', '', ''],
    ['Nilai Lainnya', '', '', ''],
    ['', 'Promo Gratis Ongkir dari Penjual', -1401481, ''],
  ];

  const wb = XLSX.utils.book_new();
  const summaryWs = XLSX.utils.aoa_to_sheet(summarySheetData);
  XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  XLSX.utils.book_append_sheet(wb, ws, 'Pesanan');

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
    // Priority 3 Fallback demonstration: SKU & SKU Induk are empty, matched via Nama Produk
    [
      '260906FALLBACKPROD',
      'Selesai',
      '',
      '',
      'SPXID0481928423',
      'SPX Standard',
      '',
      'Totebag Kanvas Premium Resleting',
      '',
      'Broken White',
      65000,
      60000,
      2,
      120000,
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

/**
 * Creates a sample Settlement (Rincian Pelepasan Dana) file as an XLSX File object
 */
export function createSampleSettlementFile(): File {
  const wsData = [
    [
      'No. Pesanan',
      'Waktu Pesanan Selesai',
      'Harga Asli Produk',
      'Total Diskon Produk',
      'Biaya Administrasi',
      'Biaya Layanan',
      'Biaya Pembayaran',
      'Biaya Pengiriman',
      'Biaya Promosi',
      'Pengembalian Dana',
      'Penyesuaian',
      'Total Penghasilan',
    ],
    [
      '260901ABCD1234',
      '2026-09-02 18:30:10',
      129000,
      15000,
      4560,
      3420,
      1140,
      0,
      0,
      0,
      0,
      104880,
    ],
    [
      '260902EFGH5678',
      '2026-09-04 12:15:45',
      165000,
      20000,
      5800,
      4350,
      1450,
      0,
      0,
      0,
      0,
      133400,
    ],
    [
      '260903IJKL9012',
      '2026-09-05 09:40:22',
      110000,
      10000,
      4000,
      3000,
      1000,
      0,
      0,
      0,
      0,
      92000,
    ],
    [
      '260904MNOP3456',
      '2026-09-06 14:55:00',
      189000,
      25000,
      6560,
      4920,
      1640,
      0,
      0,
      0,
      0,
      150880,
    ],
    [
      '260906FALLBACKPROD',
      '2026-09-07 16:10:30',
      130000,
      10000,
      4800,
      3600,
      1200,
      0,
      0,
      0,
      0,
      110400,
    ],
    [
      '260830PREV3333',
      '2026-09-01 11:00:00',
      165000,
      15000,
      6000,
      4500,
      1500,
      0,
      0,
      0,
      0,
      138000,
    ],
  ];

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Settlement');

  const u8 = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new File([u8], 'Settlement.Rincian_Pelepasan.202609.xlsx', {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

