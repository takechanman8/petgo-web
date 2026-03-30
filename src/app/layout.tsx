import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import "./globals.css";

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  variable: "--font-noto-sans-jp",
});

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://petgo.jp";

export const metadata: Metadata = {
  title: {
    default: "PetGo - ペット同伴OK施設の検索・予約・レビュー",
    template: "%s | PetGo",
  },
  description:
    "ペットと一緒に楽しめる施設を探そう。全国のドッグラン付きホテル、ペット同伴OKのカフェ・レストラン・キャンプ場など、口コミ・評価で比較して予約できるプラットフォーム。",
  metadataBase: new URL(BASE_URL),
  openGraph: {
    title: "PetGo - ペット同伴OK施設の検索・予約・レビュー",
    description:
      "全国のペット同伴OK施設を口コミ・評価で比較。ホテル、カフェ、レストラン、キャンプ場など、愛犬・愛猫と楽しめるスポットが見つかる。",
    url: BASE_URL,
    siteName: "PetGo",
    locale: "ja_JP",
    type: "website",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "PetGo - ペット同伴OK施設の検索・予約・レビュー",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PetGo - ペット同伴OK施設の検索・予約・レビュー",
    description:
      "全国のペット同伴OK施設を口コミ・評価で比較。愛犬・愛猫と楽しめるスポットが見つかる。",
    images: ["/og-image.svg"],
  },
  alternates: {
    canonical: BASE_URL,
  },
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
