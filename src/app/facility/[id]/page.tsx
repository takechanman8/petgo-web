import type { Metadata } from "next";
import { createServerClient } from "@/lib/supabase-server";
import FacilityDetailClient from "./facility-detail-client";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://petgo.jp";

type Props = {
  params: Promise<{ id: string }>;
};

async function getFacility(id: string) {
  const supabase = createServerClient();
  const { data } = await supabase
    .from("facilities")
    .select("*, reviews(rating)")
    .eq("id", id)
    .single();
  return data;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const data = await getFacility(id);

  if (!data) {
    return { title: "施設が見つかりません" };
  }

  const reviews = (data.reviews as { rating: number }[]) ?? [];
  const avgRating =
    reviews.length > 0
      ? Math.round(
          (reviews.reduce((s: number, r: { rating: number }) => s + r.rating, 0) /
            reviews.length) *
            10
        ) / 10
      : 0;

  const title = `${data.name}（${data.prefecture}・${data.area}）`;
  const description = `${data.name}は${data.prefecture}${data.area}にあるペット同伴OKの${data.type}です。${reviews.length > 0 ? `口コミ${reviews.length}件、平均評価${avgRating}。` : ""}愛犬・愛猫と一緒に楽しめます。`;

  return {
    title,
    description,
    openGraph: {
      title: `${title} | PetGo`,
      description,
      url: `${BASE_URL}/facility/${id}`,
      images: data.photo_url
        ? [{ url: data.photo_url, width: 1200, height: 630, alt: data.name }]
        : [{ url: "/og-image.svg", width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | PetGo`,
      description,
    },
    alternates: {
      canonical: `${BASE_URL}/facility/${id}`,
    },
  };
}

export default async function FacilityDetailPage({ params }: Props) {
  const { id } = await params;
  const data = await getFacility(id);

  const reviews = (data?.reviews as { rating: number }[]) ?? [];
  const avgRating =
    reviews.length > 0
      ? Math.round(
          (reviews.reduce((s: number, r: { rating: number }) => s + r.rating, 0) /
            reviews.length) *
            10
        ) / 10
      : 0;

  const jsonLd = data
    ? {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        name: data.name,
        image: data.photo_url || undefined,
        address: {
          "@type": "PostalAddress",
          addressRegion: data.prefecture,
          addressLocality: data.area,
          addressCountry: "JP",
        },
        aggregateRating:
          reviews.length > 0
            ? {
                "@type": "AggregateRating",
                ratingValue: avgRating,
                reviewCount: reviews.length,
                bestRating: 5,
                worstRating: 1,
              }
            : undefined,
        url: `${BASE_URL}/facility/${id}`,
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <FacilityDetailClient params={params} />
    </>
  );
}
