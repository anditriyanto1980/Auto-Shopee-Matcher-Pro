import React from 'react';
import {
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  Layers,
  Rows3,
  Columns3,
  AlertTriangle,
  Eye,
} from 'lucide-react';
import { UploadedFile } from '../types/fileTypes';
import { formatFileSize, formatNumber } from '../utils/formatters';

interface FileInfoPanelProps {
  title: string;
  categoryLabel: string;
  file: UploadedFile | null;
  onPreview: (file: UploadedFile) => void;
  onSheetChange?: (sheetName: string) => void;
}

export const FileInfoPanel: React.FC<FileInfoPanelProps> = ({
  title,
  categoryLabel,
  file,
  onPreview,
  onSheetChange,
}) => {
  if (!file) {
    return (
      <div className="bg-white rounded-2xl border border-dashed border-stone-300 p-6 flex flex-col items-center justify-center text-center h-full min-h-[260px] text-stone-400">
        <FileSpreadsheet className="w-10 h-10 mb-2 text-stone-300" />
        <h4 className="font-semibold text-stone-600 text-sm">{title}</h4>
        <p className="text-xs text-stone-400 mt-1">Belum ada file yang diunggah.</p>
      </div>
    );
  }

  const { validation } = file;
  const isReadSuccess = file.status === 'valid' || file.status === 'invalid';
  const hasErrors = file.status === 'error' || (validation && !validation.valid);

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden flex flex-col h-full">
      {/* Header section */}
      <div className="px-5 py-4 border-b border-stone-100 bg-stone-50/70 flex items-center justify-between">
        <div>
          <span className="text-[11px] font-bold tracking-wider uppercase text-orange-600">
            {categoryLabel}
          </span>
          <h4 className="font-bold text-stone-900 text-sm sm:text-base leading-snug">
            {title}
          </h4>
        </div>
        <div>
          {file.status === 'valid' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" />
              ✓ Berhasil dibaca
            </span>
          )}
          {file.status === 'invalid' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
              <AlertTriangle className="w-3.5 h-3.5" />
              ⚠ Kolom Belum Lengkap
            </span>
          )}
          {file.status === 'error' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
              <XCircle className="w-3.5 h-3.5" />
              ❌ File Gagal Dibaca
            </span>
          )}
        </div>
      </div>

      {/* Body info */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4 text-xs sm:text-sm">
        {file.errorMessage && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
            <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Kesalahan Pembacaan File:</p>
              <p>{file.errorMessage}</p>
            </div>
          </div>
        )}

        {/* File metadata badges / grid */}
        <div className="bg-stone-50 rounded-xl p-3.5 border border-stone-200/80 space-y-2">
          <div className="flex items-center justify-between text-xs pb-2 border-b border-stone-200/60">
            <span className="text-stone-500 font-medium">Nama File:</span>
            <span
              className="font-mono text-stone-800 font-semibold truncate max-w-[200px] text-right"
              title={file.fileName}
            >
              {file.fileName}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-1">
            <div className="flex items-center justify-between">
              <span className="text-stone-500">Ukuran:</span>
              <span className="font-semibold text-stone-800">{formatFileSize(file.fileSize)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-stone-500">Jumlah Sheet:</span>
              <span className="font-semibold text-stone-800 flex items-center gap-1">
                <Layers className="w-3 h-3 text-stone-400" />
                {file.sheets.length}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-stone-500">Jumlah Baris:</span>
              <span className="font-semibold text-stone-800 flex items-center gap-1 font-mono">
                <Rows3 className="w-3 h-3 text-stone-400" />
                {validation ? formatNumber(validation.rowCount) : '-'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-stone-500">Jumlah Kolom:</span>
              <span className="font-semibold text-stone-800 flex items-center gap-1 font-mono">
                <Columns3 className="w-3 h-3 text-stone-400" />
                {validation ? validation.columnCount : '-'}
              </span>
            </div>
          </div>

          {/* Active sheet selection if multi-sheet */}
          {file.sheets.length > 1 ? (
            <div className="pt-2 border-t border-stone-200/60 flex items-center justify-between text-xs">
              <span className="text-stone-500">Pilih Sheet:</span>
              <select
                value={file.activeSheetName}
                onChange={(e) => onSheetChange && onSheetChange(e.target.value)}
                className="px-2 py-1 rounded border border-stone-300 bg-white text-stone-800 text-xs font-medium focus:ring-1 focus:ring-orange-500"
              >
                {file.sheets.map((s) => (
                  <option key={s.name} value={s.name}>
                    {s.name} ({formatNumber(s.rowCount)} baris)
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="pt-2 border-t border-stone-200/60 flex items-center justify-between text-xs">
              <span className="text-stone-500">Sheet:</span>
              <span className="font-semibold text-stone-800 font-mono">
                {file.activeSheetName || '-'}
              </span>
            </div>
          )}
        </div>

        {/* Detected Columns Section */}
        {validation && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-600">
                DETECTED COLUMNS
              </span>
              <span className="text-[11px] font-medium text-stone-500">
                {validation.foundColumns.length} dari {validation.detectedColumns.length} wajib
              </span>
            </div>

            <div className="space-y-1.5 bg-white rounded-xl border border-stone-200 p-2.5">
              {validation.detectedColumns.map((col) => (
                <div
                  key={col.requiredName}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                    col.isFound
                      ? 'bg-emerald-50/70 border border-emerald-100 text-stone-800'
                      : 'bg-rose-50/70 border border-rose-200 text-rose-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {col.isFound ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    )}
                    <span className="font-medium">{col.requiredName}</span>
                  </div>

                  {col.isFound ? (
                    <span className="text-[11px] text-stone-500 font-mono bg-white/70 px-1.5 py-0.5 rounded border border-emerald-200/50">
                      Kolom #{((col.columnIndex ?? 0) + 1)}
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold text-rose-600 bg-rose-100 px-1.5 py-0.5 rounded">
                      Kolom belum terdeteksi
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Button: Lihat Preview */}
        {isReadSuccess && validation && (
          <div className="pt-2">
            <button
              onClick={() => onPreview(file)}
              className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-300 transition-colors cursor-pointer"
            >
              <Eye className="w-4 h-4 text-stone-600" />
              Lihat Preview Data ({Math.min(20, validation.rowCount)} baris)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
