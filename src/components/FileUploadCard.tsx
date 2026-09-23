import React, { useRef, useState } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Trash2,
  Eye,
  FileCheck,
} from 'lucide-react';
import { FileCategory, UploadedFile } from '../types/fileTypes';
import { formatFileSize, formatNumber } from '../utils/formatters';

interface FileUploadCardProps {
  category: FileCategory;
  cardNumber: number;
  title: string;
  description: string;
  requiredColumnsNotice: string[];
  file: UploadedFile | null;
  onFileUpload: (file: File, category: FileCategory) => void;
  onRemoveFile: (category: FileCategory) => void;
  onPreview: (file: UploadedFile) => void;
}

export const FileUploadCard: React.FC<FileUploadCardProps> = ({
  category,
  cardNumber,
  title,
  description,
  requiredColumnsNotice,
  file,
  onFileUpload,
  onRemoveFile,
  onPreview,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      onFileUpload(droppedFile, category);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      onFileUpload(selectedFile, category);
    }
    // reset input so the same file can be re-selected if replaced
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const isUploaded = !!file;
  const isSuccess = file?.status === 'valid';
  const isInvalid = file?.status === 'invalid';
  const isError = file?.status === 'error';

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm hover:shadow-md transition-all flex flex-col h-full overflow-hidden">
      {/* Top Banner / Title */}
      <div className="px-5 py-4 border-b border-stone-100 bg-stone-50/50 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 font-bold text-xs flex items-center justify-center border border-orange-200">
            {cardNumber}
          </span>
          <h3 className="font-bold text-stone-900 text-sm sm:text-base tracking-tight">
            {title}
          </h3>
        </div>

        {/* Small Status Pill */}
        {isSuccess && (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Valid
          </span>
        )}
        {isInvalid && (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
            <AlertTriangle className="w-3.5 h-3.5" />
            Struktur Belum Valid
          </span>
        )}
        {isError && (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
            <XCircle className="w-3.5 h-3.5" />
            Error
          </span>
        )}
      </div>

      {/* Description & Required columns brief */}
      <div className="px-5 pt-3 pb-2 text-xs text-stone-500">
        <p className="text-stone-600">{description}</p>
        <div className="mt-2 flex flex-wrap gap-1">
          <span className="text-stone-400 font-medium">Kolom wajib:</span>
          {requiredColumnsNotice.map((col) => (
            <span
              key={col}
              className="inline-block px-1.5 py-0.5 rounded bg-stone-100 text-stone-600 font-mono text-[10px]"
            >
              {col}
            </span>
          ))}
        </div>
      </div>

      {/* Main Drop Area / Loaded state */}
      <div className="p-5 flex-1 flex flex-col justify-center">
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={handleFileChange}
        />

        {!file ? (
          /* Empty / Upload dropzone */
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleButtonClick}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[190px] ${
              isDragging
                ? 'border-orange-500 bg-orange-50/70 scale-[0.99]'
                : 'border-stone-300 hover:border-orange-400 hover:bg-orange-50/20 bg-stone-50/40'
            }`}
          >
            <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mb-3">
              <UploadCloud className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-stone-800 tracking-wide uppercase">
              DROP FILE EXCEL DI SINI
            </p>
            <p className="text-xs text-stone-500 mt-1">atau klik untuk upload</p>
            <span className="mt-3 inline-flex items-center px-3 py-1 rounded-md text-[11px] font-medium bg-white text-stone-600 border border-stone-200 shadow-2xs">
              Mendukung XLSX, XLS, CSV
            </span>
            <button
              type="button"
              className="mt-4 px-4 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              [ Upload File ]
            </button>
          </div>
        ) : (
          /* File Loaded Summary */
          <div className="bg-stone-50 rounded-xl p-4 border border-stone-200 flex flex-col justify-between h-full space-y-3">
            {/* File Header Details */}
            <div className="flex items-start gap-3">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                  isSuccess
                    ? 'bg-emerald-100 text-emerald-700'
                    : isInvalid
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-rose-100 text-rose-700'
                }`}
              >
                <FileSpreadsheet className="w-6 h-6" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-stone-900 truncate" title={file.fileName}>
                  {file.fileName}
                </p>
                <div className="flex items-center gap-2 text-[11px] text-stone-500 mt-0.5">
                  <span>{formatFileSize(file.fileSize)}</span>
                  <span>•</span>
                  <span>{file.fileType.includes('csv') ? 'CSV' : 'Excel Spreadsheet'}</span>
                </div>
              </div>
            </div>

            {/* Read status indication */}
            {isSuccess && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>✓ File berhasil dibaca & struktur valid</span>
              </div>
            )}
            {isInvalid && (
              <div className="flex items-start gap-1.5 text-xs text-amber-800 font-medium bg-amber-50 px-2.5 py-1.5 rounded-lg border border-amber-200">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                <div>
                  <span className="font-semibold">Perhatian struktur:</span>
                  <p className="text-[11px] text-amber-700">
                    {file.validation?.missingColumns.length} kolom wajib belum terdeteksi.
                  </p>
                </div>
              </div>
            )}
            {isError && (
              <div className="flex items-start gap-1.5 text-xs text-rose-700 font-medium bg-rose-50 px-2.5 py-1.5 rounded-lg border border-rose-200">
                <XCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <div>
                  <span className="font-semibold">File tidak dapat dibaca:</span>
                  <p className="text-[11px] text-rose-600">{file.errorMessage}</p>
                </div>
              </div>
            )}

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-1 bg-white p-2 rounded-lg border border-stone-200 text-center text-xs">
              <div>
                <span className="text-[10px] text-stone-400 block">Sheet</span>
                <span className="font-bold text-stone-800">{file.sheets.length}</span>
              </div>
              <div className="border-x border-stone-100">
                <span className="text-[10px] text-stone-400 block">Baris</span>
                <span className="font-bold text-stone-800 font-mono">
                  {file.validation ? formatNumber(file.validation.rowCount) : '-'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-stone-400 block">Kolom</span>
                <span className="font-bold text-stone-800 font-mono">
                  {file.validation ? file.validation.columnCount : '-'}
                </span>
              </div>
            </div>

            {/* Buttons: Preview, Replace, Remove */}
            <div className="flex items-center gap-2 pt-1">
              {file.validation && (
                <button
                  type="button"
                  onClick={() => onPreview(file)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-300 transition-colors cursor-pointer"
                  title="Lihat Preview maksimal 20 baris"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Lihat Preview
                </button>
              )}
              <button
                type="button"
                onClick={handleButtonClick}
                className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg text-stone-600 hover:text-stone-900 hover:bg-stone-200/60 border border-stone-200 transition-colors cursor-pointer"
                title="Ganti file dengan yang baru"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Ganti
              </button>
              <button
                type="button"
                onClick={() => onRemoveFile(category)}
                className="inline-flex items-center justify-center p-1.5 text-xs font-medium rounded-lg text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
                title="Hapus file"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
