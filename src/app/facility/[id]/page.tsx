"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { mapDbRowToFacility } from "@/lib/mapFacility";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import type { Facility } from "@/types/facility";

export default function FacilityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [facility, setFacility] = useState<Facility | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function fetchFacility() {
      try {
        console.log("[FacilityDetail] Fetching facility with id:", id);

        const { data, error } = await supabase
          .from("facilities")
          .select("*, reviews(rating)")
          .eq("id", id)
          .single();

        console.log("[FacilityDetail] Supabase response:", { data, error });

        if (error) throw error;
        if (data) {
          const mapped = mapDbRowToFacility(
            data as Record<string, unknown>,
            (data as Record<string, unknown>).reviews as { rating: number }[],
          );
          console.log("[FacilityDetail] Mapped facility:", mapped);
          setFacility(mapped);
        }
      } catch (e) {
        console.error("[FacilityDetail] Error fetching facility:", e);
        setFacility(null);
      } finally {
        setLoading(false);
      }
    }

    fetchFacility();
  }, [id]);

  return (
    <>
      <Header />
      <main className="flex-1 bg-gray-50">
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary mb-6"
          >
            &larr; 施設一覧に戻る
          </Link>

          {loading ? (
            <div className="animate-pulse space-y-6">
              <div className="h-64 rounded-xl bg-gray-200" />
              <div className="h-8 w-1/2 rounded bg-gray-200" />
              <div className="h-4 w-1/3 rounded bg-gray-200" />
              <div className="h-32 rounded bg-gray-200" />
            </div>
          ) : !facility ? (
            <div className="text-center py-20">
              <p className="text-gray-500 text-lg">施設が見つかりませんでした</p>
              <Link href="/" className="mt-4 inline-block text-primary hover:underline">
                トップに戻る
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="relative h-64 sm:h-80">
                <img
                  src={facility.image}
                  alt={facility.name}
                  className="h-full w-full object-cover"
                />
                <span className="absolute top-4 left-4 rounded-full bg-white/90 px-3 py-1 text-sm font-medium text-primary">
                  {facility.type}
                </span>
              </div>

              <div className="p-6 sm:p-8 space-y-6">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                    {facility.name}
                  </h1>
                  <p className="mt-1 text-gray-500">{facility.area}</p>
                </div>

                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg
                        key={star}
                        className={`h-5 w-5 ${star <= Math.round(facility.rating) ? "text-amber-400" : "text-gray-200"}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                    <span className="ml-1 font-medium text-gray-700">
                      {facility.rating}
                    </span>
                    <span className="text-sm text-gray-400">
                      ({facility.reviews}件のレビュー)
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span>🐾</span>
                    <div className="h-2 w-20 rounded-full bg-gray-100">
                      <div
                        className="h-2 rounded-full bg-primary"
                        style={{ width: `${facility.petScore}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-primary">
                      {facility.petScore}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {facility.sizes.map((size) => (
                    <span
                      key={size}
                      className="rounded-full bg-green-50 px-3 py-1 text-sm text-primary font-medium"
                    >
                      {size}
                    </span>
                  ))}
                </div>

                <div className="border-t border-gray-100 pt-6">
                  <div className="text-2xl font-bold text-gray-900">
                    ¥{facility.price.toLocaleString()}
                    <span className="text-base font-normal text-gray-400">〜</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
