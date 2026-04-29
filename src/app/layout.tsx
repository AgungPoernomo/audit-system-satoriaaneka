import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

// Mengambil font Outfit langsung dari Google Fonts via Next.js
const outfit = Outfit({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Dashboard - Audit Sistem",
  description: "Sistem Audit Terkoneksi Satoria",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={outfit.className}>
        {/* Sistem akan otomatis memuat (dashboard)/layout.tsx di dalam children ini */}
        {children}
      </body>
    </html>
  );
}