"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useFavorites } from "@/hooks/useFavorites";
import { useRecommendations } from "@/hooks/useRecommendations";
import { FavoriteButton } from "@/components/favorite-button";
import { CompactSkeletonCard } from "@/components/compact-facility-card";
import type { RecommendedFacility } from "@/hooks/useRecommendations";

function StarRating({ rating, reviews }: { rating: number; reviews: number }) {
  return (
    <div className="flex items-center gap-0">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className="h-3.5 w-3.5"
          style={{ color: star <= Math.round(rating) ? "#F9A825" : "#E0E0E0" }}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="ml-1 text-xs font-bold text-text-heading">{rating}</span>
      <span className="text-[10px] text-text-muted">({reviews})</span>
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
    <article className="card group w-full cursor-pointer">
      <div className="relative aspect-[3/2] overflow-hidden rounded-t-[12px]">
        <img
          src={facility.image}
          alt={facility.name}
          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <span className="absolute top-2 left-2 rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-bold text-primary shadow-sm">
          {facility.type}
        </span>
        <div className="absolute top-2 right-2">
          <FavoriteButton
            isFavorite={isFavorite}
            onToggle={onToggleFavorite}
            onLoginRequired={onLoginRequired}
            isLoggedIn={isLoggedIn}
          />
        </div>
        {hasCoupon(facility.id) && (
          <span style={{
            position: "absolute",
            bottom: "8px",
            left: "6px",
            backgroundColor: "#E53935",
            color: "white",
            fontSize: "10px",
            padding: "1px 6px",
            borderRadius: "3px",
            fontWeight: "bold",
            zIndex: 10,
          }}>
            クーポン対象
          </span>
        )}
      </div>

      <div className="p-3">
        <h3 className="text-sm font-bold text-text-heading line-clamp-1">{facility.name}</h3>
        <p className="mt-0.5 text-[10px] text-text-muted">{facility.area}</p>

        <div className="mt-1.5">
          <StarRating rating={facility.rating} reviews={facility.reviews} />
        </div>

        <div className="mt-1.5 flex flex-wrap gap-1">
          {facility.sizes.map((size) => (
            <span
              key={size}
              className="rounded-md bg-primary/8 px-1.5 py-0.5 text-[10px] text-primary font-bold"
            >
              {size}
            </span>
          ))}
        </div>

        {facility.reason && (
          <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-amber-50 border border-amber-100 px-2 py-1.5">
            <span className="shrink-0" style={{ fontSize: "14px", lineHeight: 1 }}>🐾</span>
            <span className="text-[10px] text-amber-800 font-medium line-clamp-2">{facility.reason}</span>
          </div>
        )}

        <div className="mt-2 flex items-end justify-between border-t border-gray-100 pt-2">
          <div>
            <span className="text-lg font-black text-primary">
              ¥{facility.price.toLocaleString()}
            </span>
            <span className="text-xs text-text-muted ml-0.5">〜</span>
          </div>
          <span className="text-[10px] text-accent font-bold group-hover:translate-x-1 transition-transform">
            詳細 →
          </span>
        </div>
      </div>
    </article>
  );
}

export function RecommendationSection() {
  const { user, loading: authLoading, signInWithGoogle } = useAuth();
  const { favoriteIds, toggle } = useFavorites(user);
  const { recommendations, loading } = useRecommendations(user);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(true);

  const updateArrows = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setShowLeft(el.scrollLeft > 0);
    setShowRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateArrows();
    el.addEventListener("scroll", updateArrows, { passive: true });
    const onResize = () => updateArrows();
    window.addEventListener("resize", onResize);
    return () => {
      el.removeEventListener("scroll", updateArrows);
      window.removeEventListener("resize", onResize);
    };
  }, [updateArrows, loading, recommendations]);

  if (authLoading) return null;

  if (!user) {
    return (
      <section className="py-12 px-4 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl bg-section-bg border border-primary/10 p-8 sm:p-10 text-center">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🐾</span>
            </div>
            <h2 style={{ fontSize: "22px", fontWeight: "bold" }} className="text-text-heading mb-2">
              あなたへのおすすめ
            </h2>
            <div
              className="mx-auto mb-3"
              style={{ width: "40px", height: "3px", backgroundColor: "#F97316", borderRadius: "2px" }}
            />
            <p style={{ fontSize: "14px", color: "#888" }} className="mb-6 max-w-md mx-auto">
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

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = el.clientWidth / 4.5;
    const scrollAmount = direction === "right" ? cardWidth * 2 : -(cardWidth * 2);
    el.scrollBy({ left: scrollAmount, behavior: "smooth" });
  };

  const cardWidthStyle = "calc((100% - 48px) / 4.5)";

  const sectionHeader = (
    <div className="mb-8">
      <h2 style={{ fontSize: "22px", fontWeight: "bold" }} className="text-text-heading">
        あなたへのおすすめ
      </h2>
      <div
        className="mt-2"
        style={{ width: "40px", height: "3px", backgroundColor: "#F97316", borderRadius: "2px" }}
      />
      <p className="mt-3" style={{ fontSize: "14px", color: "#888" }}>
        あなたの好みに合った施設をピックアップ
      </p>
    </div>
  );

  if (loading) {
    return (
      <section className="py-12 px-4 sm:px-6">
        <div className="mx-auto max-w-7xl">
          {sectionHeader}
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex-shrink-0" style={{ width: cardWidthStyle }}>
                <CompactSkeletonCard />
              </div>
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
        {sectionHeader}

        <div className="relative">
          <div
            ref={scrollRef}
            onScroll={updateArrows}
            className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory scrollbar-hide pb-4"
          >
            {recommendations.map((facility) => (
              <div key={facility.id} className="snap-start flex-shrink-0" style={{ width: cardWidthStyle }}>
                <Link href={`/facility/${facility.id}`} className="block">
                  <RecommendedCard
                    facility={facility}
                    isFavorite={favoriteIds.has(facility.id)}
                    onToggleFavorite={() => toggle(facility.id)}
                    onLoginRequired={signInWithGoogle}
                    isLoggedIn={true}
                  />
                </Link>
              </div>
            ))}
          </div>

          {showLeft && (
            <button
              onClick={() => scroll("left")}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white rounded-full flex items-center justify-center hover:scale-110 transition-transform"
              style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}
              aria-label="左にスクロール"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M12.5 15L7.5 10L12.5 5" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}

          {showRight && (
            <button
              onClick={() => scroll("right")}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white rounded-full flex items-center justify-center hover:scale-110 transition-transform"
              style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}
              aria-label="右にスクロール"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M7.5 5L12.5 10L7.5 15" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
