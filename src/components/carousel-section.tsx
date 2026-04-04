"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useFavorites } from "@/hooks/useFavorites";
import { CompactFacilityCard, CompactSkeletonCard } from "@/components/compact-facility-card";
import type { Facility } from "@/types/facility";

export function CarouselSection({
  title,
  subtitle,
  facilities,
  loading,
  showRank,
  bgClass,
}: {
  title: string;
  subtitle: string;
  facilities: Facility[];
  loading: boolean;
  showRank?: boolean;
  bgClass?: string;
}) {
  const { user, signInWithGoogle } = useAuth();
  const { favoriteIds, toggle } = useFavorites(user);
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
  }, [updateArrows, loading, facilities]);

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = el.clientWidth / 4.5;
    const scrollAmount = direction === "right" ? cardWidth * 2 : -(cardWidth * 2);
    el.scrollBy({ left: scrollAmount, behavior: "smooth" });
  };

  const cardWidthStyle = "calc((100% - 48px) / 4.5)";

  return (
    <section className={`py-12 px-4 sm:px-6 ${bgClass || ""}`}>
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h2 style={{ fontSize: "22px", fontWeight: "bold" }} className="text-text-heading">
            {title}
          </h2>
          <div
            className="mt-2"
            style={{ width: "40px", height: "3px", backgroundColor: "#F97316", borderRadius: "2px" }}
          />
          <p className="mt-3" style={{ fontSize: "14px", color: "#888" }}>
            {subtitle}
          </p>
        </div>

        <div className="relative">
          {loading ? (
            <div className="flex gap-4 overflow-hidden">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex-shrink-0" style={{ width: cardWidthStyle }}>
                  <CompactSkeletonCard />
                </div>
              ))}
            </div>
          ) : facilities.length === 0 ? null : (
            <>
              <div
                ref={scrollRef}
                onScroll={updateArrows}
                className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory scrollbar-hide pb-4"
              >
                {facilities.map((facility, index) => (
                  <div
                    key={facility.id}
                    className="snap-start flex-shrink-0"
                    style={{ width: cardWidthStyle }}
                  >
                    <Link href={`/facility/${facility.id}`} className="block">
                      <CompactFacilityCard
                        facility={facility}
                        rank={showRank ? index + 1 : undefined}
                        isFavorite={favoriteIds.has(facility.id)}
                        onToggleFavorite={() => toggle(facility.id)}
                        onLoginRequired={signInWithGoogle}
                        isLoggedIn={!!user}
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
            </>
          )}
        </div>
      </div>
    </section>
  );
}
