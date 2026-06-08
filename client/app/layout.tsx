import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Томьёоны туслах",
  description: "Бодлогод ашиглах томьёог санал болгох minimalist туслах.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="mn">
      <body>{children}</body>
    </html>
  );
}
