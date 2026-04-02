"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useFavorites } from "@/hooks/useFavorites";
import { useSimilarFacilities } from "@/hooks/useRecommendations";
import { FavoriteButton } from "@/components/favorite-button";
import type { Facility } from "@/types/facility";

function StarRating({ rating, reviews }: { rating: number; reviews: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`h-4 w-4 ${star <= Math.round(rating) ? "text-amber-400" : "text-gray-200"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="ml-1 text-sm font-medium text-gray-700">{rating}</span>
      <span className="text-xs text-gray-400">({reviews})</span>
    </div>
  );
}

function SimilarCard({
  facility,
  isFavorite,
  onToggleFavorite,
  onLoginRequired,
  isLoggedIn,
}: {
  facility: Facility;
  isFavorite: boolean;
  onToggleFavorite: () => Promise<boolean>;
  onLoginRequired: () => void;
  isLoggedIn: boolean;
}) {
  return (
    <article className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer">
      <div className="relative h-40 overflow-hidden">
        <img
          src={facility.image}
          alt={facility.name}
          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <span className="absolute top-3 left-3 rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-medium text-primary">
          {facility.type}
        </span>
        <div className="absolute top-3 right-3">
          <FavoriteButton
            isFavorite={isFavorite}
            onToggle={onToggleFavorite}
            onLoginRequired={onLoginRequired}
            isLoggedIn={isLoggedIn}
          />
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-bold text-gray-900 line-clamp-1">{facility.name}</h3>
        <p className="mt-1 text-xs text-gray-500">{facility.area}</p>

        <div className="mt-2">
          <StarRating rating={facility.rating} reviews={facility.reviews} />
        </div>

        <div className="mt-2 flex flex-wrap gap-1">
          {facility.sizes.map((size) => (
            <span
              key={size}
              className="rounded bg-green-50 px-1.5 py-0.5 text-[10px] text-primary font-medium"
            >
              {size}
            </span>
          ))}
        </div>

        <div className="mt-3 flex items-end justify-between border-t border-gray-100 pt-3">
          <div>
            <span className="text-lg font-bold text-gray-900">
              ¥{facility.price.toLocaleString()}
            </span>
            <span className="text-xs text-gray-400">〜</span>
          </div>
          <span className="text-xs text-accent font-medium">詳細を見る →</span>
        </div>
      </div>
    </article>
  );
}

export function SimilarFacilities({
  facilityId,
  prefecture,
  type,
}: {
  facilityId: string;
  prefecture: string | null;
  type: string | null;
}) {
  const { user, signInWithGoogle } = useAuth();
  const { favoriteIds, toggle } = useFavorites(user);
  const { similar, loading } = useSimilarFacilities(facilityId, prefecture, type);

  if (loading) {
    return (
      <section className="mt-10">
        <h2 className="text-xl font-bold text-gray-900 mb-6">
          この施設を見た人はこちらも見ています
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl overflow-hidden shadow-sm animate-pulse">
              <div className="h-40 bg-gray-200" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
                <div className="h-3 bg-gray-200 rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (similar.length === 0) return null;

  return (
    <section className="mt-10">
      <h2 className="text-xl font-bold text-gray-900 mb-6">
        この施設を見た人はこちらも見ています
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {similar.map((facility) => (
          <Link key={facility.id} href={`/facility/${facility.id}`} className="block">
            <SimilarCard
              facility={facility}
              isFavorite={favoriteIds.has(facility.id)}
              onToggleFavorite={() => toggle(facility.id)}
              onLoginRequired={signInWithGoogle}
              isLoggedIn={!!user}
            />
          </Link>
        ))}
      </div>
    </section>
  );
}
