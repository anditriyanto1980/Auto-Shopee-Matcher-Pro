import React, { useState } from 'react';
import { X, Eye, Table, CheckCircle2, AlertCircle } from 'lucide-react';
import { UploadedFile } from '../types/fileTypes';
import { formatNumber } from '../utils/formatters';

interface DataPreviewModalProps {
  file: UploadedFile | null;
  onClose: () => void;
}

export const DataPreviewModal: React.FC<DataPreviewModalProps> = ({
  file,
  onClose,
}) => {
  const [viewMode, setViewMode] = useState<'required' | 'all'>('required');

  if (!file || !file.validation) return null;

  const { validation } = file;
  const previewRows = validation.previewRows || [];
  const requiredCols = validation.detectedColumns;
  const allHeaders = validation.allHeaders || [];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-stone-900">
                  Preview Data: {file.fileName}
                </h3>
                <span className="px-2 py-0.5 text-xs font-semibold rounded bg-stone-200 text-stone-700">
                  Sheet: {file.activeSheetName}
                </span>
              </div>
              <p className="text-xs text-stone-500">
                Menampilkan maksimal 20 baris pertama untuk verifikasi struktur kolom.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* View mode toggle & info */}
        <div className="px-6 py-3 bg-white border-b border-stone-100 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <span className="text-stone-600 font-medium">Tampilan Kolom:</span>
            <div className="inline-flex rounded-lg border border-stone-300 p-0.5 bg-stone-100">
              <button
                onClick={() => setViewMode('required')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                  viewMode === 'required'
                    ? 'bg-white text-orange-700 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Hanya Kolom Wajib ({requiredCols.length})
              </button>
              <button
                onClick={() => setViewMode('all')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                  viewMode === 'all'
                    ? 'bg-white text-orange-700 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Semua Header Terdeteksi ({allHeaders.length})
              </button>
            </div>
          </div>

          <div className="text-stone-500 text-xs">
            Menampilkan <span className="font-semibold text-stone-800">{previewRows.length}</span> baris preview dari total <span className="font-semibold text-stone-800">{formatNumber(validation.rowCount)}</span> baris data
          </div>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-auto p-6 bg-stone-50/50">
          {previewRows.length === 0 ? (
            <div className="py-12 text-center text-stone-500">
              <Table className="w-10 h-10 mx-auto text-stone-300 mb-2" />
              <p>Tidak ada baris data yang ditemukan di sheet ini.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white shadow-xs">
              <table className="min-w-full divide-y divide-stone-200 text-left text-xs sm:text-sm">
                <thead className="bg-stone-100/90 sticky top-0 z-10 text-stone-700 font-semibold">
                  <tr>
                    <th className="px-3 py-2.5 w-12 text-center border-r border-stone-200 bg-stone-200/60">
                      #
                    </th>
                    {viewMode === 'required' ? (
                      requiredCols.map((col) => (
                        <th
                          key={col.requiredName}
                          className="px-4 py-2.5 whitespace-nowrap border-r border-stone-200 last:border-r-0"
                        >
                          <div className="flex items-center gap-1.5">
                            {col.isFound ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            ) : (
                              <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                            )}
                            <span className={col.isFound ? 'text-stone-800' : 'text-rose-600'}>
                              {col.requiredName}
                            </span>
                          </div>
                        </th>
                      ))
                    ) : (
                      allHeaders.map((hdr, idx) => (
                        <th
                          key={`${hdr}-${idx}`}
                          className="px-4 py-2.5 whitespace-nowrap border-r border-stone-200 last:border-r-0"
                        >
                          {hdr}
                        </th>
                      ))
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 font-mono text-xs">
                  {previewRows.map((row, rIdx) => (
                    <tr
                      key={rIdx}
                      className={rIdx % 2 === 0 ? 'bg-white' : 'bg-stone-50/80 hover:bg-orange-50/40'}
                    >
                      <td className="px-3 py-2 text-center text-stone-400 font-sans border-r border-stone-200 bg-stone-100/40 font-medium">
                        {row._rowNum || rIdx + 1}
                      </td>
                      {viewMode === 'required' ? (
                        requiredCols.map((col) => {
                          const val = row[col.requiredName];
                          const isMissing = !col.isFound || val === '-' || val === '';
                          return (
                            <td
                              key={col.requiredName}
                              className={`px-4 py-2 whitespace-nowrap border-r border-stone-200 last:border-r-0 ${
                                isMissing ? 'text-stone-400 italic' : 'text-stone-800'
                              }`}
                            >
                              {val !== '' && val !== undefined ? String(val) : '—'}
                            </td>
                          );
                        })
                      ) : (
                        allHeaders.map((hdr, idx) => {
                          const val = row[`_raw_${hdr}`];
                          return (
                            <td
                              key={`${hdr}-${idx}`}
                              className="px-4 py-2 whitespace-nowrap border-r border-stone-200 last:border-r-0 text-stone-700"
                            >
                              {val !== '' && val !== undefined ? String(val) : '—'}
                            </td>
                          );
                        })
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-stone-50 border-t border-stone-200 flex items-center justify-between text-xs text-stone-500">
          <div>
            * Baris preview ini hanya untuk verifikasi struktur kolom dan tidak merubah file asli.
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-stone-800 hover:bg-stone-900 text-white font-medium text-xs sm:text-sm transition-colors cursor-pointer"
          >
            Tutup Preview
          </button>
        </div>
      </div>
    </div>
  );
};
