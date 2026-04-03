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
          className="h-4 w-4"
          style={{ color: star <= Math.round(rating) ? "#F9A825" : "#E0E0E0" }}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="ml-1 text-sm font-bold text-text-heading">{rating}</span>
      <span className="text-xs text-text-muted">({reviews})</span>
    </div>
  );
}

function hasCoupon(facilityId: string): boolean {
  let hash = 0;
  for (let i = 0; i < facilityId.length; i++) {
    hash = ((hash << 5) - hash + facilityId.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % 3 === 0;
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
    <article className="card group min-w-[290px] max-w-[310px] shrink-0 cursor-pointer">
      <div className="relative h-48 overflow-hidden rounded-t-[16px]">
        <img
          src={facility.image}
          alt={facility.name}
          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <span className="absolute top-3 left-3 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-primary shadow-sm">
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
        {hasCoupon(facility.id) && (
          <span style={{
            position: 'absolute',
            top: '48px',
            right: '12px',
            backgroundColor: '#E53935',
            color: 'white',
            fontSize: '11px',
            padding: '2px 8px',
            borderRadius: '4px',
            fontWeight: 'bold',
            zIndex: '10',
          }}>
            クーポン対象
          </span>
        )}
      </div>

      <div className="p-5">
        <h3 className="text-[17px] font-bold text-text-heading line-clamp-1">{facility.name}</h3>
        <p className="mt-1 text-xs text-text-muted">{facility.area}</p>

        <div className="mt-2.5">
          <StarRating rating={facility.rating} reviews={facility.reviews} />
        </div>

        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {facility.sizes.map((size) => (
            <span
              key={size}
              className="rounded-md bg-primary/8 px-2 py-0.5 text-[11px] text-primary font-bold"
            >
              {size}
            </span>
          ))}
        </div>

        {/* Recommendation reason */}
        {facility.reason && (
          <div className="mt-3 flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-100 px-3 py-2">
            <svg className="h-4 w-4 text-accent shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" />
            </svg>
            <span className="text-xs text-amber-800 font-medium line-clamp-2">{facility.reason}</span>
          </div>
        )}

        <div className="mt-4 flex items-end justify-between border-t border-gray-100 pt-4">
          <div>
            <span className="text-xl font-black text-primary">
              ¥{facility.price.toLocaleString()}
            </span>
            <span className="text-sm text-text-muted ml-0.5">〜</span>
          </div>
          <span className="text-xs text-accent font-bold group-hover:translate-x-1 transition-transform">
            詳細を見る →
          </span>
        </div>
      </div>
    </article>
  );
}

function SkeletonCard() {
  return (
    <div className="min-w-[290px] max-w-[310px] shrink-0 card animate-pulse">
      <div className="h-48 bg-gray-200" />
      <div className="p-5 space-y-3">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
        <div className="h-3 bg-gray-200 rounded w-full" />
        <div className="h-8 bg-gray-200 rounded w-full" />
      </div>
    </div>
  );
}

export function RecommendationSection() {
  const { user, loading: authLoading, signInWithGoogle } = useAuth();
  const { favoriteIds, toggle } = useFavorites(user);
  const { recommendations, loading } = useRecommendations(user);

  if (authLoading) return null;

  if (!user) {
    return (
      <section className="py-20 px-4 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl bg-section-bg border border-primary/10 p-10 sm:p-14 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5">
              <span className="text-3xl">🐾</span>
            </div>
            <h2 className="text-h2 mb-3">
              あなたへのおすすめ
            </h2>
            <p className="text-text-body mb-8 max-w-md mx-auto">
              ログインすると、お気に入りやレビュー履歴からあなたにぴったりの施設をおすすめします
            </p>
            <button
              onClick={signInWithGoogle}
              className="btn-primary"
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

  if (loading) {
    return (
      <section className="py-20 px-4 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10">
            <h2 className="text-h2 section-heading">あなたへのおすすめ</h2>
            <p className="mt-5 text-text-body">あなたの好みに合った施設をピックアップ</p>
          </div>
          <div className="flex gap-5 overflow-hidden">
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
    <section className="py-20 px-4 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10">
          <h2 className="text-h2 section-heading">あなたへのおすすめ</h2>
          <p className="mt-5 text-text-body">あなたの好みに合った施設をピックアップ</p>
        </div>

        <div className="flex gap-5 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
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
