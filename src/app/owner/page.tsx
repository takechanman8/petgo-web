"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";

interface Facility {
  id: string;
  name: string;
  type: string;
  status: string;
  reservation_count: number;
  avg_rating: number | null;
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  facility_name: string;
  reviewer_name: string;
}

interface Stats {
  facilityCount: number;
  monthlyReservations: number;
  monthlyRevenue: number;
  reviewCount: number;
}

export default function OwnerDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const supabase = createClient();

    async function fetchData() {
      setLoading(true);

      // Fetch owner's facilities with reviews for avg rating
      const { data: rawFacilities } = await supabase
        .from("facilities")
        .select("id, name, type, status, reviews(rating)")
        .eq("owner_id", user!.id);

      const myFacilities = rawFacilities ?? [];
      const facilityIds = myFacilities.map((f) => f.id);

      if (facilityIds.length === 0) {
        setStats({
          facilityCount: 0,
          monthlyReservations: 0,
          monthlyRevenue: 0,
          reviewCount: 0,
        });
        setFacilities([]);
        setReviews([]);
        setLoading(false);
        return;
      }

      // Month start for filtering
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString()
        .split("T")[0];

      // Fetch reservations & reviews in parallel
      const [resMonth, revAll, resForFacilities] = await Promise.all([
        // Monthly reservations with total_price for revenue
        supabase
          .from("reservations")
          .select("id, total_price")
          .in("facility_id", facilityIds)
          .gte("created_at", monthStart),
        // Latest 5 reviews across all facilities
        supabase
          .from("reviews")
          .select("id, rating, comment, created_at, facility_id, user_id, profiles:user_id(display_name)")
          .in("facility_id", facilityIds)
          .order("created_at", { ascending: false })
          .limit(5),
        // Reservation counts per facility
        supabase
          .from("reservations")
          .select("facility_id")
          .in("facility_id", facilityIds),
      ]);

      // Calculate reservation counts per facility
      const resCounts: Record<string, number> = {};
      (resForFacilities.data ?? []).forEach((r) => {
        resCounts[r.facility_id] = (resCounts[r.facility_id] || 0) + 1;
      });

      // Build facility list
      const facilityList: Facility[] = myFacilities.map((f) => {
        const ratings = (f.reviews as { rating: number }[]) ?? [];
        const avg =
          ratings.length > 0
            ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
            : null;
        return {
          id: f.id,
          name: f.name,
          type: f.type,
          status: f.status,
          reservation_count: resCounts[f.id] || 0,
          avg_rating: avg,
        };
      });

      // Calculate total review count
      const totalReviewCount = myFacilities.reduce(
        (sum, f) => sum + ((f.reviews as { rating: number }[])?.length ?? 0),
        0
      );

      // Monthly revenue
      const monthlyRevenue = (resMonth.data ?? []).reduce(
        (sum, r) => sum + (r.total_price ?? 0),
        0
      );

      // Build review list with facility names
      const facilityMap = Object.fromEntries(myFacilities.map((f) => [f.id, f.name]));
      const reviewList: Review[] = (revAll.data ?? []).map((r: Record<string, unknown>) => ({
        id: r.id as string,
        rating: r.rating as number,
        comment: r.comment as string,
        created_at: r.created_at as string,
        facility_name: facilityMap[r.facility_id as string] || "",
        reviewer_name:
          (r.profiles as { display_name?: string })?.display_name || "匿名ユーザー",
      }));

      setStats({
        facilityCount: myFacilities.length,
        monthlyReservations: resMonth.data?.length ?? 0,
        monthlyRevenue,
        reviewCount: totalReviewCount,
      });
      setFacilities(facilityList);
      setReviews(reviewList);
      setLoading(false);
    }

    fetchData();
  }, [user]);

  const statCards = [
    {
      label: "登録施設数",
      value: stats?.facilityCount ?? 0,
      format: "number",
      icon: "🏨",
      color: "bg-blue-50 text-blue-700",
    },
    {
      label: "今月の予約数",
      value: stats?.monthlyReservations ?? 0,
      format: "number",
      icon: "📋",
      color: "bg-green-50 text-green-700",
    },
    {
      label: "今月の売上",
      value: stats?.monthlyRevenue ?? 0,
      format: "currency",
      icon: "💰",
      color: "bg-amber-50 text-amber-700",
    },
    {
      label: "レビュー件数",
      value: stats?.reviewCount ?? 0,
      format: "number",
      icon: "⭐",
      color: "bg-pink-50 text-pink-700",
    },
  ];

  const statusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
            公開中
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
            審査中
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
            差し戻し
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
            {status}
          </span>
        );
    }
  };

  const renderStars = (rating: number) => {
    return "★".repeat(Math.round(rating)) + "☆".repeat(5 - Math.round(rating));
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">ダッシュボード</h1>

      {/* Stats Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="rounded-xl bg-white p-6 shadow-sm animate-pulse"
            >
              <div className="h-4 w-20 bg-gray-200 rounded mb-3" />
              <div className="h-8 w-16 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card) => (
            <div
              key={card.label}
              className="rounded-xl bg-white p-6 shadow-sm"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-500">
                  {card.label}
                </span>
                <span
                  className={`h-10 w-10 rounded-lg flex items-center justify-center text-lg ${card.color}`}
                >
                  {card.icon}
                </span>
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {card.format === "currency"
                  ? `¥${card.value.toLocaleString()}`
                  : card.value.toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Facilities Table */}
      <div className="mt-8">
        <h2 className="text-lg font-bold text-gray-900 mb-4">施設一覧</h2>
        {loading ? (
          <div className="rounded-xl bg-white shadow-sm animate-pulse p-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4 mb-4">
                <div className="h-4 w-32 bg-gray-200 rounded" />
                <div className="h-4 w-20 bg-gray-200 rounded" />
                <div className="h-4 w-16 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        ) : facilities.length === 0 ? (
          <div className="rounded-xl bg-white p-8 shadow-sm text-center">
            <p className="text-gray-500 mb-4">まだ施設が登録されていません</p>
            <Link
              href="/owner/facilities"
              className="text-primary font-medium hover:underline"
            >
              施設を登録する
            </Link>
          </div>
        ) : (
          <div className="rounded-xl bg-white shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-500">
                    施設名
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">
                    タイプ
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">
                    ステータス
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">
                    予約数
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">
                    評価
                  </th>
                </tr>
              </thead>
              <tbody>
                {facilities.map((facility) => (
                  <tr
                    key={facility.id}
                    className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/owner/facilities/${facility.id}/edit`}
                        className="font-medium text-gray-900 hover:text-primary transition-colors"
                      >
                        {facility.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{facility.type}</td>
                    <td className="px-4 py-3">{statusBadge(facility.status)}</td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      {facility.reservation_count.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {facility.avg_rating !== null ? (
                        <span className="text-amber-500">
                          {facility.avg_rating.toFixed(1)}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Latest Reviews */}
      <div className="mt-8">
        <h2 className="text-lg font-bold text-gray-900 mb-4">最新レビュー</h2>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-xl bg-white p-5 shadow-sm animate-pulse"
              >
                <div className="h-4 w-40 bg-gray-200 rounded mb-2" />
                <div className="h-3 w-60 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <div className="rounded-xl bg-white p-8 shadow-sm text-center">
            <p className="text-gray-500">まだレビューがありません</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="rounded-xl bg-white p-5 shadow-sm"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-gray-900">
                      {review.reviewer_name}
                    </span>
                    <span className="text-xs text-gray-400">
                      {review.facility_name}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(review.created_at).toLocaleDateString("ja-JP")}
                  </span>
                </div>
                <div className="text-amber-500 text-sm mb-1">
                  {renderStars(review.rating)}
                </div>
                {review.comment && (
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {review.comment}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
