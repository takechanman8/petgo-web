"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

export interface PointHistory {
  id: string;
  points: number;
  type: "earned" | "used";
  reason: "reservation" | "review" | "referral" | "coupon_used";
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

const POINT_RULES = {
  reservation: 100,
  review: 50,
} as const;

export async function addPoints(
  userId: string,
  reason: "reservation" | "review",
  isPassMember: boolean,
  referenceId?: string,
): Promise<{ points: number; error: string | null }> {
  const basePoints = POINT_RULES[reason];
  const points = isPassMember ? basePoints * 2 : basePoints;

  const supabase = createClient();

  // ポイント履歴を追加
  const { error: historyError } = await supabase.from("point_history").insert({
    user_id: userId,
    points,
    type: "earned",
    reason,
    reference_id: referenceId ?? null,
  });

  if (historyError) {
    return { points: 0, error: historyError.message };
  }

  // user_points を upsert（存在しなければ作成、あれば加算）
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

export async function usePointsForCoupon(
  userId: string,
  pointsToUse: number,
): Promise<{ error: string | null }> {
  const supabase = createClient();

  const { data } = await supabase
    .from("user_points")
    .select("total_points")
    .eq("user_id", userId)
    .maybeSingle();

  if (!data || data.total_points < pointsToUse) {
    return { error: "ポイントが不足しています" };
  }

  const { error: historyError } = await supabase.from("point_history").insert({
    user_id: userId,
    points: pointsToUse,
    type: "used",
    reason: "coupon_used",
  });

  if (historyError) return { error: historyError.message };

  const { error } = await supabase
    .from("user_points")
    .update({ total_points: data.total_points - pointsToUse })
    .eq("user_id", userId);

  if (error) return { error: error.message };

  return { error: null };
}
