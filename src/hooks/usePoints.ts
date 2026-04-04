"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

export type PointReason =
  | "registration_bonus"
  | "referral_bonus"
  | "referral_welcome"
  | "booking_bonus"
  | "review_bonus"
  | "birthday_bonus"
  | "coupon_used"
  | "cancel_refund"
  // legacy reasons (for existing data)
  | "reservation"
  | "review"
  | "referral"
  | "coupon_used";

export interface PointHistory {
  id: string;
  points: number;
  type: "earned" | "used";
  reason: PointReason;
  reference_id: string | null;
  created_at: string;
}

export function usePoints(user: User | null) {
  const [totalPoints, setTotalPoints] = useState(0);
  const [history, setHistory] = useState<PointHistory[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPoints = useCallback(async () => {
    if (!user) {
      setTotalPoints(0);
      setHistory([]);
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const [pointsResult, historyResult] = await Promise.all([
      supabase
        .from("user_points")
        .select("total_points")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("point_history")
        .select("id, points, type, reason, reference_id, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
    ]);

    setTotalPoints(pointsResult.data?.total_points ?? 0);
    setHistory((historyResult.data as PointHistory[]) ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchPoints();
  }, [fetchPoints]);

  return { totalPoints, history, loading, refetch: fetchPoints };
}

// --- ポイント加算ヘルパー（共通） ---
async function grantPoints(
  userId: string,
  points: number,
  reason: PointReason,
  referenceId?: string,
): Promise<{ points: number; error: string | null }> {
  const supabase = createClient();

  const { error: historyError } = await supabase.from("point_history").insert({
    user_id: userId,
    points,
    type: "earned",
    reason,
    reference_id: referenceId ?? null,
  });

  if (historyError) return { points: 0, error: historyError.message };

  const { data: existing } = await supabase
    .from("user_points")
    .select("total_points")
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("user_points")
      .update({ total_points: existing.total_points + points })
      .eq("user_id", userId);
    if (error) return { points: 0, error: error.message };
  } else {
    const { error } = await supabase.from("user_points").insert({
      user_id: userId,
      total_points: points,
    });
    if (error) return { points: 0, error: error.message };
  }

  return { points, error: null };
}

// --- 1. 新規会員登録ボーナス: +200pt ---
export async function grantRegistrationBonus(
  userId: string,
): Promise<{ points: number; error: string | null }> {
  const supabase = createClient();
  // 重複チェック
  const { data: existing } = await supabase
    .from("point_history")
    .select("id")
    .eq("user_id", userId)
    .eq("reason", "registration_bonus")
    .maybeSingle();
  if (existing) return { points: 0, error: null };
  return grantPoints(userId, 200, "registration_bonus", `reg_${userId}`);
}

// --- 2. 友達紹介ボーナス: 紹介者+200pt, 紹介された側+100pt ---
export async function grantReferralBonus(
  referrerId: string,
  newUserId: string,
): Promise<{ error: string | null }> {
  const refId = `ref_${referrerId}_${newUserId}`;
  const [r1, r2] = await Promise.all([
    grantPoints(referrerId, 200, "referral_bonus", refId),
    grantPoints(newUserId, 100, "referral_welcome", refId),
  ]);
  return { error: r1.error || r2.error };
}

// --- 3. 予約完了ボーナス: 予約金額の1% ---
export async function addBookingPoints(
  userId: string,
  totalPrice: number,
  isPassMember: boolean,
  referenceId?: string,
): Promise<{ points: number; error: string | null }> {
  const basePoints = Math.max(1, Math.round(totalPrice * 0.01));
  const points = isPassMember ? basePoints * 2 : basePoints;
  return grantPoints(userId, points, "booking_bonus", referenceId);
}

// --- 4. レビュー投稿ボーナス: +50pt ---
export async function addReviewPoints(
  userId: string,
  isPassMember: boolean,
  referenceId?: string,
): Promise<{ points: number; error: string | null }> {
  const points = isPassMember ? 100 : 50;
  return grantPoints(userId, points, "review_bonus", referenceId);
}

// --- 5. 予約キャンセル時ポイント返還 ---
export async function refundPoints(
  userId: string,
  pointsToRefund: number,
  reservationId: string,
): Promise<{ error: string | null }> {
  if (pointsToRefund <= 0) return { error: null };
  const { error } = await grantPoints(userId, pointsToRefund, "cancel_refund", `refund_${reservationId}`);
  return { error };
}

// --- クーポン交換（ポイント消費） ---
export async function usePointsForCoupon(
  userId: string,
  pointsToUse: number,
): Promise<{ error: string | null }> {
  const supabase = createClient();

  // Fetch latest balance
  const { data } = await supabase
    .from("user_points")
    .select("total_points")
    .eq("user_id", userId)
    .maybeSingle();

  if (!data || data.total_points < pointsToUse) {
    return { error: "ポイントが不足しています" };
  }

  // Update with gte guard to prevent negative balance (race condition safe)
  const { data: updated, error: updateError } = await supabase
    .from("user_points")
    .update({ total_points: data.total_points - pointsToUse })
    .eq("user_id", userId)
    .gte("total_points", pointsToUse)
    .select("user_id")
    .maybeSingle();

  if (updateError) return { error: updateError.message };
  if (!updated) return { error: "ポイントが不足しています" };

  // Only insert history after successful balance update
  const { error: historyError } = await supabase.from("point_history").insert({
    user_id: userId,
    points: pointsToUse,
    type: "used",
    reason: "coupon_used",
  });

  if (historyError) {
    // Rollback: restore balance
    await supabase
      .from("user_points")
      .update({ total_points: data.total_points })
      .eq("user_id", userId);
    return { error: historyError.message };
  }

  return { error: null };
}

// Legacy compatibility - keep addPoints for existing call sites during migration
export async function addPoints(
  userId: string,
  reason: "reservation" | "review",
  isPassMember: boolean,
  referenceId?: string,
): Promise<{ points: number; error: string | null }> {
  if (reason === "reservation") {
    // Default to 100pt for legacy calls without price
    return addBookingPoints(userId, 10000, isPassMember, referenceId);
  }
  return addReviewPoints(userId, isPassMember, referenceId);
}
