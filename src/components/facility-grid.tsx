"use client";

import Link from "next/link";
import { useFacilities } from "@/hooks/useFacilities";
import { useFavorites } from "@/hooks/useFavorites";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { FavoriteButton } from "@/components/favorite-button";
import type { Facility } from "@/types/facility";

function StarRating({ rating, reviews }: { rating: number; reviews: number }) {
  return (
    <div className="flex items-center gap-0">
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

export function FacilityGrid() {
  const { facilities, loading } = useFacilities();
  const { user, signInWithGoogle } = useAuth();
  const { favoriteIds, toggle } = useFavorites(user);
  const { isPassMember } = useSubscription(user);

  return (
    <section className="py-20 px-4 sm:px-6 bg-section-bg">
      <div className="mx-auto max-w-7xl">
        <div className="text-center mb-12">
          <h2 className="text-h2 section-heading section-heading-center">
            人気の施設
          </h2>
          <p className="mt-5 text-text-body">
            ペットオーナーに選ばれている施設をチェック
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="card animate-pulse">
                <div className="aspect-[4/3] bg-gray-200" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                  <div className="h-3 bg-gray-200 rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {facilities.map((facility, index) => (
              <Link key={facility.id} href={`/facility/${facility.id}`} className="block">
                <FacilityCard
                  facility={facility}
                  rank={index + 1}
                  isPassMember={isPassMember}
                  isFavorite={favoriteIds.has(facility.id)}
                  onToggleFavorite={() => toggle(facility.id)}
                  onLoginRequired={signInWithGoogle}
                  isLoggedIn={!!user}
                />
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function FacilityCard({
  facility,
  rank,
  isPassMember,
  isFavorite,
  onToggleFavorite,
  onLoginRequired,
  isLoggedIn,
}: {
  facility: Facility;
  rank: number;
  isPassMember: boolean;
  isFavorite: boolean;
  onToggleFavorite: () => Promise<boolean>;
  onLoginRequired: () => void;
  isLoggedIn: boolean;
}) {
  const basePoints = Math.floor(facility.price * 0.01);
  const earnedPoints = isPassMember ? basePoints * 2 : basePoints;

  return (
    <article className="card group cursor-pointer h-full flex flex-col" style={{ position: 'relative', overflow: 'visible' }}>
      {/* リボン型ランキングバッジ - 画像の外に配置 */}
      {(() => {
        const badgeColor = rank === 1 ? '#EAB308' : rank === 2 ? '#9CA3AF' : rank === 3 ? '#B45309' : '#1E1B4B';
        return (
          <div style={{ position: 'absolute', top: -4, left: 12, zIndex: 10, width: 30, height: 44 }}>
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
        );
      })()}

      <div className="relative aspect-[4/3] overflow-hidden rounded-t-[16px]">
        <div className="absolute inset-0 overflow-hidden rounded-t-[16px]">
          <img
            src={facility.image}
            alt={facility.name}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
        {hasCoupon(facility.id) && (
          <span style={{
            position: 'absolute',
            bottom: '12px',
            left: '8px',
            backgroundColor: '#E53935',
            color: 'white',
            fontSize: '11px',
            padding: '2px 8px',
            borderRadius: '4px',
            fontWeight: 'bold',
            zIndex: 10,
          }}>
            クーポン対象
          </span>
        )}
        <div className="absolute top-3 right-3">
          <FavoriteButton
            isFavorite={isFavorite}
            onToggle={onToggleFavorite}
            onLoginRequired={onLoginRequired}
            isLoggedIn={isLoggedIn}
          />
        </div>
      </div>

      <div className="p-4 flex flex-col flex-1">
        <div>
          <h3 className="text-h3 text-[17px] line-clamp-1">
            {facility.name}
          </h3>
          <p className="mt-1 text-xs text-text-muted">{facility.area}</p>
        </div>

        <div className="mt-3">
          <StarRating rating={facility.rating} reviews={facility.reviews} />
        </div>

        <div className="mt-3 pb-2 flex flex-wrap gap-1.5">
          {facility.sizes.map((size) => (
            <span
              key={size}
              className="rounded-md bg-primary/8 px-2 py-0.5 text-[11px] text-primary font-bold"
            >
              {size}
            </span>
          ))}
        </div>

        <div className="mt-auto pt-4 border-t border-gray-100">
          <div className="flex items-end justify-between">
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
          <p className="mt-1.5 text-xs font-bold text-amber-600">
            +{earnedPoints.toLocaleString()}pt 獲得{isPassMember && "（PASS 2倍）"}
          </p>
        </div>
      </div>
    </article>
  );
}
