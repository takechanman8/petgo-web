"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { mapDbRowToFacility } from "@/lib/mapFacility";
import type { Facility } from "@/types/facility";
import type { User } from "@supabase/supabase-js";

export type RecommendedFacility = Facility & {
  reason: string;
};

type UserProfile = {
  favoriteTypes: Record<string, number>;
  favoriteAreas: Record<string, number>;
  favoriteSizes: Record<string, number>;
  reviewedFacilityIds: Set<string>;
  favoriteFacilityIds: Set<string>;
  petSize: string | null;
  petType: string | null;
};

function buildUserProfile(
  favorites: { facility_id: string; type: string; prefecture: string; accepted_dog_sizes: string[]; cat_ok: boolean }[],
  reviews: { facility_id: string; rating: number; pet_size: string | null; pet_type: string | null }[],
): UserProfile {
  const profile: UserProfile = {
    favoriteTypes: {},
    favoriteAreas: {},
    favoriteSizes: {},
    reviewedFacilityIds: new Set(),
    favoriteFacilityIds: new Set(),
    petSize: null,
    petType: null,
  };

  // お気に入りからタイプ・エリア・サイズの傾向を分析
  for (const fav of favorites) {
    profile.favoriteFacilityIds.add(fav.facility_id);
    profile.favoriteTypes[fav.type] = (profile.favoriteTypes[fav.type] || 0) + 1;
    profile.favoriteAreas[fav.prefecture] = (profile.favoriteAreas[fav.prefecture] || 0) + 1;
    for (const size of fav.accepted_dog_sizes ?? []) {
      profile.favoriteSizes[size] = (profile.favoriteSizes[size] || 0) + 1;
    }
  }

  // レビューから高評価施設の傾向とペット情報を分析
  for (const review of reviews) {
    profile.reviewedFacilityIds.add(review.facility_id);
    if (review.pet_size) profile.petSize = review.pet_size;
    if (review.pet_type) profile.petType = review.pet_type;
  }

  return profile;
}

function scoreFacility(
  row: Record<string, unknown>,
  profile: UserProfile,
): { score: number; reason: string } {
  const type = row.type as string;
  const prefecture = row.prefecture as string;
  const sizes = (row.accepted_dog_sizes as string[]) ?? [];
  const petScore = row.pet_friendly_score as number;

  let score = 0;
  const reasons: string[] = [];

  // タイプの一致
  if (profile.favoriteTypes[type]) {
    score += profile.favoriteTypes[type] * 3;
    reasons.push(`${type}をよくお気に入り登録しています`);
  }

  // エリアの一致
  if (profile.favoriteAreas[prefecture]) {
    score += profile.favoriteAreas[prefecture] * 2;
    reasons.push(`${prefecture}の施設をよく閲覧しています`);
  }

  // ペットサイズの一致
  if (profile.petSize && sizes.includes(profile.petSize)) {
    const sizeLabel =
      profile.petSize === "large" ? "大型犬" :
      profile.petSize === "medium" ? "中型犬" : "小型犬";
    score += 2;
    reasons.push(`${sizeLabel}OKの施設です！`);
  }

  // ペットフレンドリースコアが高い施設にボーナス
  if (petScore >= 90) {
    score += 1;
  }

  const reason = reasons.length > 0 ? reasons[0] : "人気の施設です";
  return { score, reason };
}

/**
 * パーソナライズされたおすすめ施設を取得する
 */
export function useRecommendations(user: User | null) {
  const [recommendations, setRecommendations] = useState<RecommendedFacility[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRecommendations([]);
      setLoading(false);
      return;
    }

    const supabase = createClient();

    async function fetchRecommendations() {
      try {
        // ユーザーのお気に入りと施設情報を取得
        const { data: favData } = await supabase
          .from("favorites")
          .select("facility_id, facilities(type, prefecture, accepted_dog_sizes, cat_ok)")
          .eq("user_id", user!.id);

        // ユーザーのレビュー履歴を取得
        const { data: reviewData } = await supabase
          .from("reviews")
          .select("facility_id, rating, pet_size, pet_type")
          .eq("user_id", user!.id);

        const favorites = (favData ?? []).map((f) => {
          const fac = f.facilities as unknown as { type: string; prefecture: string; accepted_dog_sizes: string[]; cat_ok: boolean } | null;
          return {
            facility_id: f.facility_id as string,
            type: fac?.type ?? "",
            prefecture: fac?.prefecture ?? "",
            accepted_dog_sizes: fac?.accepted_dog_sizes ?? [],
            cat_ok: fac?.cat_ok ?? false,
          };
        });

        const reviews = (reviewData ?? []).map((r) => ({
          facility_id: r.facility_id as string,
          rating: r.rating as number,
          pet_size: r.pet_size as string | null,
          pet_type: r.pet_type as string | null,
        }));

        const profile = buildUserProfile(favorites, reviews);

        // データが少ない場合は人気施設をフォールバック
        const hasEnoughData =
          Object.keys(profile.favoriteTypes).length > 0 ||
          reviews.length > 0;

        if (!hasEnoughData) {
          const { data: popularData } = await supabase
            .from("facilities")
            .select("*, reviews(rating)")
            .order("pet_friendly_score", { ascending: false })
            .limit(4);

          if (popularData) {
            setRecommendations(
              popularData.map((row: Record<string, unknown>) => ({
                ...mapDbRowToFacility(row, row.reviews as { rating: number }[]),
                reason: "人気の施設です",
              })),
            );
          }
          setLoading(false);
          return;
        }

        // 全施設を取得してスコアリング
        const visitedIds = new Set([
          ...profile.favoriteFacilityIds,
          ...profile.reviewedFacilityIds,
        ]);

        const { data: allFacilities } = await supabase
          .from("facilities")
          .select("*, reviews(rating)");

        if (!allFacilities) {
          setLoading(false);
          return;
        }

        // まだ訪問していない施設をスコアリング
        const scored = allFacilities
          .filter((row: Record<string, unknown>) => !visitedIds.has(row.id as string))
          .map((row: Record<string, unknown>) => {
            const { score, reason } = scoreFacility(row, profile);
            return {
              ...mapDbRowToFacility(row, row.reviews as { rating: number }[]),
              score,
              reason,
            };
          })
          .sort((a, b) => b.score - a.score)
          .slice(0, 4);

        // スコアが0のものしかなければ人気施設にフォールバック
        if (scored.length === 0 || scored.every((s) => s.score === 0)) {
          const { data: popularData } = await supabase
            .from("facilities")
            .select("*, reviews(rating)")
            .order("pet_friendly_score", { ascending: false })
            .limit(4);

          if (popularData) {
            setRecommendations(
              popularData.map((row: Record<string, unknown>) => ({
                ...mapDbRowToFacility(row, row.reviews as { rating: number }[]),
                reason: "人気の施設です",
              })),
            );
          }
        } else {
          setRecommendations(scored);
        }
      } catch (e) {
        console.error("[useRecommendations] Error:", e);
      } finally {
        setLoading(false);
      }
    }

    fetchRecommendations();
  }, [user]);

  return { recommendations, loading };
}

/**
 * 今週末のおすすめ施設（ランダムな高評価施設）を取得する
 */
export function useWeekendPicks() {
  const [picks, setPicks] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function fetchPicks() {
      try {
        const { data } = await supabase
          .from("facilities")
          .select("*, reviews(rating)")
          .gte("pet_friendly_score", 80);

        if (data && data.length > 0) {
          // シャッフルしてランダムに4件選ぶ
          const shuffled = [...data].sort(() => Math.random() - 0.5);
          const selected = shuffled.slice(0, 4);
          setPicks(
            selected.map((row: Record<string, unknown>) =>
              mapDbRowToFacility(row, row.reviews as { rating: number }[]),
            ),
          );
        }
      } catch (e) {
        console.error("[useWeekendPicks] Error:", e);
      } finally {
        setLoading(false);
      }
    }

    fetchPicks();
  }, []);

  return { picks, loading };
}

/**
 * 類似施設を取得する（同エリア・同タイプ）
 */
export function useSimilarFacilities(
  facilityId: string,
  prefecture: string | null,
  type: string | null,
) {
  const [similar, setSimilar] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!prefecture || !type) {
      setLoading(false);
      return;
    }

    const supabase = createClient();

    async function fetchSimilar() {
      try {
        // 同エリア・同タイプの施設を取得（現在の施設は除外）
        const { data } = await supabase
          .from("facilities")
          .select("*, reviews(rating)")
          .eq("prefecture", prefecture)
          .eq("type", type)
          .neq("id", facilityId)
          .order("pet_friendly_score", { ascending: false })
          .limit(4);

        if (data && data.length > 0) {
          setSimilar(
            data.map((row: Record<string, unknown>) =>
              mapDbRowToFacility(row, row.reviews as { rating: number }[]),
            ),
          );
        } else {
          // 同エリアだけで再検索
          const { data: areaData } = await supabase
            .from("facilities")
            .select("*, reviews(rating)")
            .eq("prefecture", prefecture)
            .neq("id", facilityId)
            .order("pet_friendly_score", { ascending: false })
            .limit(4);

          if (areaData && areaData.length > 0) {
            setSimilar(
              areaData.map((row: Record<string, unknown>) =>
                mapDbRowToFacility(row, row.reviews as { rating: number }[]),
              ),
            );
          }
        }
      } catch (e) {
        console.error("[useSimilarFacilities] Error:", e);
      } finally {
        setLoading(false);
      }
    }

    fetchSimilar();
  }, [facilityId, prefecture, type]);

  return { similar, loading };
}
