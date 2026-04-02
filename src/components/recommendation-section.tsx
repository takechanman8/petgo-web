"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useFavorites } from "@/hooks/useFavorites";
import { useRecommendations } from "@/hooks/useRecommendations";
import { FavoriteButton } from "@/components/favorite-button";
import type { RecommendedFacility } from "@/hooks/useRecommendations";

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

function RecommendedCard({
  facility,
  isFavorite,
  onToggleFavorite,
  onLoginRequired,
  isLoggedIn,
}: {
  facility: RecommendedFacility;
  isFavorite: boolean;
  onToggleFavorite: () => Promise<boolean>;
  onLoginRequired: () => void;
  isLoggedIn: boolean;
}) {
  return (
    <article className="group min-w-[280px] max-w-[300px] shrink-0 bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer">
      <div className="relative h-44 overflow-hidden">
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

        {/* おすすめ理由 */}
        <div className="mt-3 flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-1.5">
          <svg className="h-3.5 w-3.5 text-amber-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" />
          </svg>
          <span className="text-[11px] text-amber-700 line-clamp-1">{facility.reason}</span>
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

function SkeletonCard() {
  return (
    <div className="min-w-[280px] max-w-[300px] shrink-0 bg-white rounded-xl overflow-hidden shadow-sm animate-pulse">
      <div className="h-44 bg-gray-200" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
        <div className="h-3 bg-gray-200 rounded w-full" />
        <div className="h-6 bg-gray-200 rounded w-full" />
      </div>
    </div>
  );
}

export function RecommendationSection() {
  const { user, loading: authLoading, signInWithGoogle } = useAuth();
  const { favoriteIds, toggle } = useFavorites(user);
  const { recommendations, loading } = useRecommendations(user);

  // 認証ロード中は何も出さない
  if (authLoading) return null;

  // 未ログイン時
  if (!user) {
    return (
      <section className="py-12 px-4 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/10 p-8 sm:p-12 text-center">
            <div className="text-4xl mb-4">🐾</div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
              あなたへのおすすめ
            </h2>
            <p className="text-gray-500 mb-6">
              ログインすると、お気に入りやレビュー履歴からあなたにぴったりの施設をおすすめします
            </p>
            <button
              onClick={signInWithGoogle}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-bold text-white hover:bg-primary-light transition-colors"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
              </svg>
              ログインしておすすめを表示
            </button>
          </div>
        </div>
      </section>
    );
  }

  // ログイン済みだがデータロード中
  if (loading) {
    return (
      <section className="py-12 px-4 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
              あなたへのおすすめ
            </h2>
            <p className="mt-2 text-gray-500">あなたの好みに合った施設をピックアップ</p>
          </div>
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (recommendations.length === 0) return null;

  return (
    <section className="py-12 px-4 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
            あなたへのおすすめ
          </h2>
          <p className="mt-2 text-gray-500">あなたの好みに合った施設をピックアップ</p>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
          {recommendations.map((facility) => (
            <Link key={facility.id} href={`/facility/${facility.id}`} className="block">
              <RecommendedCard
                facility={facility}
                isFavorite={favoriteIds.has(facility.id)}
                onToggleFavorite={() => toggle(facility.id)}
                onLoginRequired={signInWithGoogle}
                isLoggedIn={true}
              />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
