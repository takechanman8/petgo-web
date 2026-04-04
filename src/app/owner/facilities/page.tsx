"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";

interface Facility {
  id: string;
  name: string;
  type: string;
  status: string;
  photo_url: string | null;
  pet_friendly_score: number | null;
  price_range: number | null;
}

export default function OwnerFacilitiesPage() {
  const { user } = useAuth();
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const supabase = createClient();

    async function fetchFacilities() {
      setLoading(true);
      const { data } = await supabase
        .from("facilities")
        .select("id, name, type, status, photo_url, pet_friendly_score, price_range")
        .eq("owner_id", user!.id)
        .order("created_at", { ascending: false });

      setFacilities(data ?? []);
      setLoading(false);
    }

    fetchFacilities();
  }, [user]);

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

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">施設管理</h1>
        <Link
          href="/owner/facilities/new/edit"
          className="rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-white hover:bg-primary-light transition-colors"
        >
          新規施設を登録
        </Link>
      </div>

      {/* Table */}
      {loading ? (
        <div className="rounded-xl bg-white shadow-sm p-6 space-y-4 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="h-10 w-10 bg-gray-200 rounded-lg" />
              <div className="h-4 w-40 bg-gray-200 rounded" />
              <div className="h-4 w-20 bg-gray-200 rounded" />
              <div className="h-4 w-16 bg-gray-200 rounded" />
              <div className="h-4 w-12 bg-gray-200 rounded ml-auto" />
            </div>
          ))}
        </div>
      ) : facilities.length === 0 ? (
        <div className="rounded-xl bg-white p-12 shadow-sm text-center">
          <div className="text-5xl mb-4">🏨</div>
          <p className="text-gray-500 mb-4">まだ施設が登録されていません</p>
          <Link
            href="/owner/facilities/new/edit"
            className="text-primary font-medium hover:underline"
          >
            最初の施設を登録する
          </Link>
        </div>
      ) : (
        <div className="rounded-xl bg-white shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-500">写真</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">施設名</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">タイプ</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">ステータス</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">PFスコア</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">料金帯</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">操作</th>
              </tr>
            </thead>
            <tbody>
              {facilities.map((facility) => (
                <tr
                  key={facility.id}
                  className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-3">
                    {facility.photo_url ? (
                      <img
                        src={facility.photo_url}
                        alt={facility.name}
                        className="h-10 w-10 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
                        No
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {facility.name}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{facility.type}</td>
                  <td className="px-4 py-3">{statusBadge(facility.status)}</td>
                  <td className="px-4 py-3 text-right text-gray-600">
                    {facility.pet_friendly_score !== null ? facility.pet_friendly_score : "-"}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600">
                    {facility.price_range !== null
                      ? `¥${facility.price_range.toLocaleString()}`
                      : "-"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/owner/facilities/${facility.id}/edit`}
                      className="text-primary font-medium hover:underline text-sm"
                    >
                      編集
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
