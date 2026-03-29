import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import "./globals.css";

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  variable: "--font-noto-sans-jp",
});

export const metadata: Metadata = {
  title: "PetGo - ペット同伴OKの施設レビュー＆予約",
  description:
    "ペットと一緒に楽しめる施設を探そう。ドッグラン付きホテル、猫OKカフェなど、ペット同伴OKの施設レビュー＆予約プラットフォーム。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={`${notoSansJP.variable} antialiased`}>
      <body className="min-h-screen flex flex-col font-sans">{children}</body>
    </html>
  );
}
