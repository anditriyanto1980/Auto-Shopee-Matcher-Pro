import React, { useState, useMemo } from 'react';
import {
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Tag,
  ChevronLeft,
  ChevronRight,
  Eye,
  SlidersHorizontal,
  FileSpreadsheet,
} from 'lucide-react';
import { MatchedOrderItem, MatchStatus } from '../types/matchingTypes';
import { formatNumber } from '../utils/formatters';

interface MatchingResultTableProps {
  results: MatchedOrderItem[];
  onSelectRow: (item: MatchedOrderItem) => void;
  selectedStatus: 'ALL' | MatchStatus;
  onStatusChange: (status: 'ALL' | MatchStatus) => void;
}

export const MatchingResultTable: React.FC<MatchingResultTableProps> = ({
  results,
  onSelectRow,
  selectedStatus,
  onStatusChange,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Filter results by status and search query
  const filteredResults = useMemo(() => {
    let list = results;

    if (selectedStatus !== 'ALL') {
      list = list.filter((item) => item.matchStatus === selectedStatus);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((item) => {
        return (
          item.orderNumber.toLowerCase().includes(q) ||
          item.incomeSku.toLowerCase().includes(q) ||
          item.productName.toLowerCase().includes(q) ||
          (item.allOrderSku && item.allOrderSku.toLowerCase().includes(q)) ||
          (item.allOrderParentSku && item.allOrderParentSku.toLowerCase().includes(q))
        );
      });
    }

    return list;
  }, [results, selectedStatus, searchQuery]);

  // Reset to page 1 on filter or search change
  const totalPages = Math.max(1, Math.ceil(filteredResults.length / pageSize));
  const validPage = Math.min(currentPage, totalPages);

  const paginatedResults = useMemo(() => {
    const start = (validPage - 1) * pageSize;
    return filteredResults.slice(start, start + pageSize);
  }, [filteredResults, validPage, pageSize]);

  return (
    <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden flex flex-col">
      {/* Controls Bar: Search & Filter Tabs */}
      <div className="p-5 border-b border-stone-200 bg-stone-50/50 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Status Filter Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 bg-stone-200/70 p-1 rounded-2xl">
            <button
              onClick={() => {
                onStatusChange('ALL');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                selectedStatus === 'ALL'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Semua ({results.length})
            </button>

            <button
              onClick={() => {
                onStatusChange('EXACT_SKU');
                setCurrentPage(1);
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                selectedStatus === 'EXACT_SKU'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-stone-600 hover:text-emerald-700'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Exact SKU ({results.filter((r) => r.matchStatus === 'EXACT_SKU').length})
            </button>

            <button
              onClick={() => {
                onStatusChange('SKU_INDUK_FALLBACK');
                setCurrentPage(1);
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                selectedStatus === 'SKU_INDUK_FALLBACK'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-stone-600 hover:text-amber-700'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              SKU Induk Fallback ({results.filter((r) => r.matchStatus === 'SKU_INDUK_FALLBACK').length})
            </button>

            <button
              onClick={() => {
                onStatusChange('PRODUCT_NAME_FALLBACK');
                setCurrentPage(1);
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                selectedStatus === 'PRODUCT_NAME_FALLBACK'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-stone-600 hover:text-blue-700'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              Nama Produk Fallback ({results.filter((r) => r.matchStatus === 'PRODUCT_NAME_FALLBACK').length})
            </button>

            <button
              onClick={() => {
                onStatusChange('NOT_FOUND');
                setCurrentPage(1);
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                selectedStatus === 'NOT_FOUND'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-stone-600 hover:text-rose-700'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              Tidak Ditemukan ({results.filter((r) => r.matchStatus === 'NOT_FOUND').length})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Cari No. Pesanan / SKU / Nama Produk..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Count summary and page size */}
        <div className="flex items-center justify-between text-xs text-stone-500 pt-1">
          <span>
            Menampilkan <strong className="text-stone-800">{filteredResults.length}</strong> data matching
            {searchQuery && <span> untuk kata kunci <em>"{searchQuery}"</em></span>}
          </span>

          <div className="flex items-center gap-2">
            <span>Baris per halaman:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-white border border-stone-300 rounded-lg px-2 py-1 text-xs text-stone-700 font-medium"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={250}>250</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto flex-1">
        <table className="min-w-full divide-y divide-stone-200 text-xs sm:text-sm text-left">
          <thead className="bg-stone-100/90 text-stone-700 font-semibold tracking-wide uppercase text-[11px]">
            <tr>
              <th className="px-4 py-3 text-center w-12 text-stone-400">#</th>
              <th className="px-4 py-3">No. Pesanan</th>
              <th className="px-4 py-3">SKU (ID Produk)</th>
              <th className="px-4 py-3">Nama Produk</th>
              <th className="px-4 py-3 text-right">Total Penghasilan</th>
              <th className="px-4 py-3 text-center">Qty Pembelian</th>
              <th className="px-4 py-3 text-center">Status Matching</th>
              <th className="px-4 py-3">Sumber All Order</th>
              <th className="px-4 py-3 text-center w-16">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200">
            {paginatedResults.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-6 py-16 text-center text-stone-400">
                  <FileSpreadsheet className="w-10 h-10 mx-auto mb-2 text-stone-300" />
                  <p className="font-semibold text-stone-600">Tidak ada data yang cocok dengan filter ini</p>
                  <p className="text-xs text-stone-400 mt-1">Coba ubah status filter atau kata kunci pencarian</p>
                </td>
              </tr>
            ) : (
              paginatedResults.map((item, idx) => {
                const globalIndex = (validPage - 1) * pageSize + idx + 1;

                return (
                  <tr
                    key={item.id}
                    onClick={() => onSelectRow(item)}
                    className="hover:bg-orange-50/50 cursor-pointer transition-colors group"
                  >
                    <td className="px-4 py-3 text-center text-stone-400 font-mono text-xs">
                      {globalIndex}
                    </td>

                    <td className="px-4 py-3 font-mono font-semibold text-stone-900 select-all whitespace-nowrap">
                      {item.orderNumber}
                    </td>

                    <td className="px-4 py-3 font-mono text-stone-800 whitespace-nowrap">
                      <span className="bg-stone-100 px-2 py-0.5 rounded border border-stone-200/80">
                        {item.incomeSku}
                      </span>
                    </td>

                    <td className="px-4 py-3 max-w-[260px] truncate text-stone-700" title={item.productName}>
                      {item.productName || '—'}
                    </td>

                    <td className="px-4 py-3 text-right font-mono font-medium text-stone-800 whitespace-nowrap">
                      {typeof item.totalIncome === 'number'
                        ? `Rp ${formatNumber(item.totalIncome)}`
                        : item.totalIncome || '—'}
                    </td>

                    <td className="px-4 py-3 text-center font-mono font-bold whitespace-nowrap">
                      {item.quantity !== null ? (
                        <span className="inline-flex items-center justify-center min-w-8 px-2 py-0.5 rounded-md bg-stone-100 text-stone-900 text-xs font-black border border-stone-200">
                          {formatNumber(item.quantity)}
                        </span>
                      ) : (
                        <span className="text-stone-300 italic">—</span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      {item.matchStatus === 'EXACT_SKU' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Exact SKU
                        </span>
                      )}
                      {item.matchStatus === 'SKU_INDUK_FALLBACK' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                          SKU Induk Fallback
                        </span>
                      )}
                      {item.matchStatus === 'PRODUCT_NAME_FALLBACK' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                          <Tag className="w-3.5 h-3.5 text-blue-600" />
                          Nama Produk Fallback
                        </span>
                      )}
                      {item.matchStatus === 'NOT_FOUND' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          <XCircle className="w-3.5 h-3.5 text-rose-600" />
                          Tidak Ditemukan
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-stone-600 text-xs whitespace-nowrap">
                      {item.sourceMonth === 'current' && (
                        <span className="font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                          All Order Bulan Ini
                        </span>
                      )}
                      {item.sourceMonth === 'previous' && (
                        <span className="font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                          All Order Bulan Sebelumnya
                        </span>
                      )}
                      {!item.sourceMonth && (
                        <span className="text-stone-400 italic">—</span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectRow(item);
                        }}
                        className="p-1.5 text-stone-400 group-hover:text-stone-700 rounded-lg hover:bg-stone-200/60 transition-colors"
                        title="Lihat rincian matching"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-stone-200 bg-stone-50 flex items-center justify-between text-xs text-stone-600">
          <div>
            Halaman <strong className="text-stone-900">{validPage}</strong> dari <strong className="text-stone-900">{totalPages}</strong> ({filteredResults.length} total)
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={validPage <= 1}
              className={`p-1.5 rounded-lg border border-stone-300 transition-colors ${
                validPage <= 1
                  ? 'text-stone-300 border-stone-200 cursor-not-allowed'
                  : 'text-stone-700 hover:bg-white cursor-pointer'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNumber = validPage;
              if (totalPages <= 5) {
                pageNumber = i + 1;
              } else if (validPage <= 3) {
                pageNumber = i + 1;
              } else if (validPage >= totalPages - 2) {
                pageNumber = totalPages - 4 + i;
              } else {
                pageNumber = validPage - 2 + i;
              }

              return (
                <button
                  key={pageNumber}
                  onClick={() => setCurrentPage(pageNumber)}
                  className={`min-w-8 h-8 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    pageNumber === validPage
                      ? 'bg-orange-500 text-white'
                      : 'text-stone-700 hover:bg-stone-200/70 border border-stone-200 bg-white'
                  }`}
                >
                  {pageNumber}
                </button>
              );
            })}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={validPage >= totalPages}
              className={`p-1.5 rounded-lg border border-stone-300 transition-colors ${
                validPage >= totalPages
                  ? 'text-stone-300 border-stone-200 cursor-not-allowed'
                  : 'text-stone-700 hover:bg-white cursor-pointer'
              }`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
