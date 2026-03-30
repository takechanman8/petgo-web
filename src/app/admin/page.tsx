"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

interface Stats {
  totalReservations: number;
  monthlyReservations: number;
  totalReviews: number;
  totalFavorites: number;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const supabase = createClient();

    async function fetchStats() {
      setLoading(true);

      // 自分の施設IDを取得
      const { data: myFacilities } = await supabase
        .from("facilities")
        .select("id")
        .eq("owner_id", user!.id);

      const facilityIds = myFacilities?.map((f) => f.id) ?? [];

      if (facilityIds.length === 0) {
        setStats({
          totalReservations: 0,
          monthlyReservations: 0,
          totalReviews: 0,
          totalFavorites: 0,
        });
        setLoading(false);
        return;
      }

      // 今月の初日
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString()
        .split("T")[0];

      const [resTotal, resMonth, revTotal, favTotal] = await Promise.all([
        supabase
          .from("reservations")
          .select("id", { count: "exact", head: true })
          .in("facility_id", facilityIds),
        supabase
          .from("reservations")
          .select("id", { count: "exact", head: true })
          .in("facility_id", facilityIds)
          .gte("created_at", monthStart),
        supabase
          .from("reviews")
          .select("id", { count: "exact", head: true })
          .in("facility_id", facilityIds),
        supabase
          .from("favorites")
          .select("id", { count: "exact", head: true })
          .in("facility_id", facilityIds),
      ]);

      setStats({
        totalReservations: resTotal.count ?? 0,
        monthlyReservations: resMonth.count ?? 0,
        totalReviews: revTotal.count ?? 0,
        totalFavorites: favTotal.count ?? 0,
      });
      setLoading(false);
    }

    fetchStats();
  }, [user]);

  const statCards = [
    {
      label: "総予約数",
      value: stats?.totalReservations ?? 0,
      icon: "📋",
      color: "bg-blue-50 text-blue-700",
    },
    {
      label: "今月の予約数",
      value: stats?.monthlyReservations ?? 0,
      icon: "📅",
      color: "bg-green-50 text-green-700",
    },
    {
      label: "レビュー数",
      value: stats?.totalReviews ?? 0,
      icon: "⭐",
      color: "bg-amber-50 text-amber-700",
    },
    {
      label: "お気に入り数",
      value: stats?.totalFavorites ?? 0,
      icon: "💚",
      color: "bg-pink-50 text-pink-700",
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">ダッシュボード</h1>

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
                {card.value.toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Quick links */}
      <div className="mt-8">
        <h2 className="text-lg font-bold text-gray-900 mb-4">クイックアクション</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <a
            href="/admin/facilities"
            className="rounded-xl bg-white p-5 shadow-sm hover:shadow-md transition-shadow group"
          >
            <span className="text-2xl">🏨</span>
            <h3 className="mt-2 font-bold text-gray-900 group-hover:text-primary transition-colors">
              施設を管理
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              施設の登録・編集を行います
            </p>
          </a>
          <a
            href="/admin/reservations"
            className="rounded-xl bg-white p-5 shadow-sm hover:shadow-md transition-shadow group"
          >
            <span className="text-2xl">📋</span>
            <h3 className="mt-2 font-bold text-gray-900 group-hover:text-primary transition-colors">
              予約を確認
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              予約のステータスを管理します
            </p>
          </a>
          <a
            href="/admin/reviews"
            className="rounded-xl bg-white p-5 shadow-sm hover:shadow-md transition-shadow group"
          >
            <span className="text-2xl">⭐</span>
            <h3 className="mt-2 font-bold text-gray-900 group-hover:text-primary transition-colors">
              レビューを確認
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              施設のレビューを閲覧します
            </p>
          </a>
        </div>
      </div>
    </div>
  );
}
