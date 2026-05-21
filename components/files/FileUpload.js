"use client";
// components/files/FileUpload.js
import { useState, useRef, useCallback } from "react";

const MAX_SIZE_MB = 10;

export default function FileUpload({ onUploadSuccess }) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(null);
  const [result, setResult] = useState(null);
  const fileInputRef = useRef(null);

  const handleFiles = useCallback(async (files) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    setResult(null);
    setProgress(0);

    const formData = new FormData();
    for (const file of files) {
      formData.append("files", file);
    }

    try {
      // XMLHttpRequest ile progress takibi
      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/files/upload");

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setProgress(Math.round((e.loaded / e.total) * 100));
          }
        };

        xhr.onload = () => {
          const data = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300) {
            setResult({ success: true, ...data });
            onUploadSuccess?.();
            // Sayfayı yenile
            window.location.reload();
          } else {
            setResult({ success: false, error: data.error });
          }
          resolve();
        };

        xhr.onerror = () => reject(new Error("Ağ hatası"));
        xhr.send(formData);
      });
    } catch (err) {
      setResult({ success: false, error: err.message });
    } finally {
      setUploading(false);
      setProgress(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [onUploadSuccess]);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const onDragOver = (e) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h2 className="font-semibold text-slate-800 mb-4">Dosya Yükle</h2>

      {/* Drop Zone */}
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={`
          border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all
          ${dragging
            ? "border-blue-400 bg-blue-50"
            : "border-slate-200 hover:border-blue-300 hover:bg-slate-50"
          }
          ${uploading ? "pointer-events-none opacity-60" : ""}
        `}
      >
        <div className="flex flex-col items-center gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${dragging ? "bg-blue-100" : "bg-slate-100"}`}>
            <svg className={`w-6 h-6 ${dragging ? "text-blue-500" : "text-slate-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <div>
            <p className="text-slate-700 font-medium">
              {dragging ? "Dosyaları bırakın" : "Dosyaları sürükleyin veya seçin"}
            </p>
            <p className="text-slate-400 text-sm mt-1">
              Maksimum {MAX_SIZE_MB}MB · Resim, PDF, Office, Video, Ses ve daha fazlası
            </p>
          </div>
          {!uploading && (
            <span className="mt-1 inline-block bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
              Dosya Seç
            </span>
          )}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {/* Progress */}
      {uploading && progress !== null && (
        <div className="mt-4">
          <div className="flex justify-between text-sm text-slate-600 mb-1.5">
            <span>Yükleniyor...</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className={`mt-4 px-4 py-3 rounded-lg text-sm ${result.success ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {result.success
            ? `✓ ${result.message}${result.errors?.length ? ` (${result.errors.length} hata)` : ""}`
            : `✗ ${result.error}`
          }
          {result.errors?.map((e, i) => (
            <div key={i} className="mt-1 text-xs opacity-75">{e}</div>
          ))}
        </div>
      )}
    </div>
  );
}
