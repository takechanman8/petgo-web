"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { CarouselSection } from "@/components/carousel-section";
import { createClient } from "@/lib/supabase";
import { mapDbRowToFacility } from "@/lib/mapFacility";
import type { Facility } from "@/types/facility";
import { features } from "../page";

const tagColors: Record<string, string> = {
  宿泊: "bg-blue-100 text-blue-700",
  カフェ: "bg-amber-100 text-amber-700",
  お出かけ: "bg-green-100 text-green-700",
  レストラン: "bg-rose-100 text-rose-700",
  ガイド: "bg-purple-100 text-purple-700",
  アウトドア: "bg-emerald-100 text-emerald-700",
  ドライブ: "bg-sky-100 text-sky-700",
};

export default function FeatureDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const feature = features.find((f) => f.id === id);

  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!feature) return;

    const supabase = createClient();

    async function fetchFacilities() {
      try {
        let query = supabase
          .from("facilities")
          .select("*, reviews(rating)")
          .eq("type", feature!.facilityType)
          .order("pet_friendly_score", { ascending: false })
          .limit(8);

        // Apply extra filters based on feature
        if (feature!.filterExtra === "cat_ok") {
          query = supabase
            .from("facilities")
            .select("*, reviews(rating)")
            .eq("cat_ok", true)
            .order("pet_friendly_score", { ascending: false })
            .limit(8);
        } else if (feature!.filterExtra === "large_dog") {
          query = supabase
            .from("facilities")
            .select("*, reviews(rating)")
            .contains("accepted_dog_sizes", ["large"])
            .order("pet_friendly_score", { ascending: false })
            .limit(8);
        }

        const { data } = await query;

        if (data && data.length > 0) {
          setFacilities(
            data.map((row: Record<string, unknown>) =>
              mapDbRowToFacility(row, row.reviews as { rating: number }[])
            )
          );
        }
      } catch (e) {
        console.log("[FeatureDetail] Supabase fetch failed:", e);
      } finally {
        setLoading(false);
      }
    }

    fetchFacilities();
  }, [feature]);

  if (!feature) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">
              記事が見つかりません
            </h1>
            <Link
              href="/features"
              className="mt-4 inline-block text-primary hover:underline"
            >
              特集一覧に戻る
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      {/* Hero Image */}
      <div className="relative w-full max-h-[400px] aspect-[16/9] overflow-hidden mt-16">
        <img
          src={feature.image}
          alt={feature.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
      </div>

      {/* Article Content */}
      <main className="flex-1 mx-auto max-w-3xl w-full px-4 sm:px-6 -mt-16 relative z-10">
        <article className="bg-white rounded-xl shadow-sm p-6 sm:p-10">
          {/* Breadcrumb */}
          <nav className="mb-4 text-sm text-gray-400">
            <Link href="/features" className="hover:text-primary transition-colors">
              特集
            </Link>
            <span className="mx-2">/</span>
            <span className="text-gray-600">{feature.title}</span>
          </nav>

          {/* Tag */}
          <span
            className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full ${tagColors[feature.tag] ?? "bg-gray-100 text-gray-700"}`}
          >
            {feature.tag}
          </span>

          {/* Title & Subtitle */}
          <h1 className="mt-3 text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
            {feature.title}
          </h1>
          <p className="mt-2 text-base sm:text-lg text-gray-500">
            {feature.subtitle}
          </p>

          {/* Divider */}
          <hr className="my-6 border-gray-200" />

          {/* Body */}
          <div className="prose prose-gray max-w-none text-base leading-relaxed text-gray-700 whitespace-pre-line">
            {feature.body}
          </div>
        </article>
      </main>

      {/* Related Facilities */}
      {(facilities.length > 0 || loading) && (
        <div className="mt-10">
          <CarouselSection
            title="関連施設"
            subtitle="この特集に関連するおすすめ施設"
            facilities={facilities}
            loading={loading}
          />
        </div>
      )}

      {/* Back Link */}
      <div className="mx-auto max-w-3xl w-full px-4 sm:px-6 py-8">
        <Link
          href="/features"
          className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline font-medium"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
          特集一覧に戻る
        </Link>
      </div>

      <Footer />
    </div>
  );
}
