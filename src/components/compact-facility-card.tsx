"use client";

import { FavoriteButton } from "@/components/favorite-button";
import type { Facility } from "@/types/facility";

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

export function CompactFacilityCard({
  facility,
  rank,
  isFavorite,
  onToggleFavorite,
  onLoginRequired,
  isLoggedIn,
}: {
  facility: Facility;
  rank?: number;
  isFavorite: boolean;
  onToggleFavorite: () => Promise<boolean>;
  onLoginRequired: () => void;
  isLoggedIn: boolean;
}) {
  const badgeColor = rank === 1 ? "#EAB308" : rank === 2 ? "#9CA3AF" : rank === 3 ? "#B45309" : "#1E1B4B";

  return (
    <article
      className="card group w-full cursor-pointer"
      style={{ position: "relative", overflow: "visible", marginTop: rank != null ? 8 : 0 }}
    >
      <div className="relative w-full aspect-[3/2] overflow-visible">
        <div className="w-full h-full overflow-hidden rounded-t-[12px]">
          <img
            src={facility.image}
            alt={facility.name}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
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
        <div className="absolute top-2 right-2">
          <FavoriteButton
            isFavorite={isFavorite}
            onToggle={onToggleFavorite}
            onLoginRequired={onLoginRequired}
            isLoggedIn={isLoggedIn}
          />
        </div>

        {rank != null && (
          <div style={{ position: 'absolute', top: -5, left: 12, zIndex: 10, width: 30, height: 44 }}>
            <svg width="30" height="44" viewBox="0 0 30 44" style={{ position: 'absolute', top: 0, left: 0, display: 'block' }}>
              <path d="M0 0 H30 V36 L15 44 L0 36 Z" fill={badgeColor} />
            </svg>
            <span style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              marginTop: '-4px',
              color: 'white',
              fontWeight: 'bold',
              fontSize: 14,
            }}>{rank}</span>
          </div>
        )}
      </div>

      <div className="p-3 flex flex-col flex-1">
        <h3 className="text-sm font-bold text-text-heading line-clamp-1">
          {facility.name}
        </h3>
        <p className="mt-0.5 text-[10px] text-text-muted">{facility.area}</p>

        <div className="mt-1.5">
          <StarRating rating={facility.rating} reviews={facility.reviews} />
        </div>

        <div className="mt-1.5 flex flex-wrap gap-1 pb-3">
          {facility.sizes.map((size) => (
            <span
              key={size}
              className="rounded-md bg-primary/8 px-1.5 py-0.5 text-[10px] text-primary font-bold"
            >
              {size}
            </span>
          ))}
        </div>

        <div className="mt-auto pt-2 border-t border-gray-100">
          <div className="flex items-end justify-between">
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
      </div>
    </article>
  );
}

export function CompactSkeletonCard() {
  return (
    <div className="w-full card animate-pulse">
      <div className="aspect-[3/2] bg-gray-200 rounded-t-[12px]" />
      <div className="p-3 space-y-2">
        <div className="h-3.5 bg-gray-200 rounded w-3/4" />
        <div className="h-2.5 bg-gray-200 rounded w-1/2" />
        <div className="h-2.5 bg-gray-200 rounded w-full" />
      </div>
    </div>
  );
}
