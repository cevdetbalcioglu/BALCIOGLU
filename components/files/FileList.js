"use client";
// components/files/FileList.js
import { useState } from "react";
import { formatFileSize, getFileIcon } from "@/lib/utils";

export default function FileList({ initialFiles = [] }) {
  const [files, setFiles] = useState(initialFiles);
  const [deleting, setDeleting] = useState(null);
  const [search, setSearch] = useState("");

  const handleDelete = async (fileId, fileName) => {
    if (!confirm(`"${fileName}" dosyasını silmek istediğinizden emin misiniz?`)) return;

    setDeleting(fileId);
    try {
      const res = await fetch(`/api/files/${fileId}`, { method: "DELETE" });
      if (res.ok) {
        setFiles((prev) => prev.filter((f) => f.id !== fileId));
      } else {
        const data = await res.json();
        alert(data.error || "Silme işlemi başarısız");
      }
    } catch {
      alert("Bir hata oluştu");
    } finally {
      setDeleting(null);
    }
  };

  const filtered = files.filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-white rounded-xl border border-slate-200">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <h2 className="font-semibold text-slate-800">Dosya Listesi</h2>
          <span className="bg-slate-100 text-slate-600 text-xs font-medium px-2.5 py-1 rounded-full">
            {files.length} dosya
          </span>
        </div>
        {files.length > 0 && (
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Dosya ara..."
              className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        )}
      </div>

      {/* Files */}
      {files.length === 0 ? (
        <div className="p-16 text-center">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-slate-500 font-medium">Henüz dosya yok</p>
          <p className="text-slate-400 text-sm mt-1">Yukarıdan dosya yükleyerek başlayın</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-10 text-center text-slate-500">
          Aramanızla eşleşen dosya bulunamadı.
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {filtered.map((file) => (
            <div key={file.id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors group">
              {/* Icon */}
              <div className="text-2xl flex-shrink-0 w-10 text-center">
                {getFileIcon(file.mimeType)}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{file.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-slate-400">{formatFileSize(file.size)}</span>
                  <span className="text-xs text-slate-300">·</span>
                  <span className="text-xs text-slate-400">
                    {new Date(file.createdAt).toLocaleDateString("tr-TR", {
                      day: "numeric", month: "long", year: "numeric"
                    })}
                  </span>
                  <span className="text-xs text-slate-300">·</span>
                  <span className="text-xs text-slate-400 truncate">{file.mimeType}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <a
                  href={`/api/files/${file.id}`}
                  download={file.name}
                  className="p-2 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                  title="İndir"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </a>
                <button
                  onClick={() => handleDelete(file.id, file.name)}
                  disabled={deleting === file.id}
                  className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                  title="Sil"
                >
                  {deleting === file.id ? (
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
