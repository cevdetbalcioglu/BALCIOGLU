// lib/utils.js
import path from "path";

// İzin verilen dosya tipleri
export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "text/csv",
  "application/zip",
  "application/x-zip-compressed",
  "video/mp4",
  "audio/mpeg",
  "audio/wav",
];

// Max dosya boyutu: 10MB
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Dosya boyutunu okunabilir formata çevir
export function formatFileSize(bytes) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

// MIME type'dan icon belirle
export function getFileIcon(mimeType) {
  if (mimeType.startsWith("image/")) return "🖼️";
  if (mimeType === "application/pdf") return "📄";
  if (mimeType.includes("word")) return "📝";
  if (mimeType.includes("excel") || mimeType.includes("spreadsheet")) return "📊";
  if (mimeType.includes("powerpoint") || mimeType.includes("presentation")) return "📑";
  if (mimeType.startsWith("video/")) return "🎬";
  if (mimeType.startsWith("audio/")) return "🎵";
  if (mimeType.includes("zip")) return "🗜️";
  if (mimeType === "text/plain" || mimeType === "text/csv") return "📃";
  return "📎";
}

// Upload klasörü yolu
export function getUploadPath(userId) {
  return path.join(process.cwd(), "uploads", userId);
}
