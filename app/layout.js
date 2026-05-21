// app/layout.js
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "FileVault — Kişisel Bilgi Yönetim Sistemi",
  description: "Güvenli kişisel Bilgi Yönetim Sistemi platformu",
};

export default function RootLayout({ children }) {
  return (
    <html lang="tr">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
