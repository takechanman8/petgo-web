"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

interface Reservation {
  id: string;
  facility_name: string;
  user_id: string;
  check_in: string;
  check_out: string;
  guests: number;
  total_price: number;
  status: string;
  created_at: string;
}

export default function OwnerReservationsPage() {
  const { user } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const supabase = createClient();

    async function fetchReservations() {
      setLoading(true);

      // Get owner's facility IDs
      const { data: facilities } = await supabase
        .from("facilities")
        .select("id, name")
        .eq("owner_id", user!.id);

      const facilityList = facilities ?? [];
      const facilityIds = facilityList.map((f) => f.id);

      if (facilityIds.length === 0) {
        setReservations([]);
        setLoading(false);
        return;
      }

      const facilityMap = Object.fromEntries(
        facilityList.map((f) => [f.id, f.name])
      );

      // Get reservations for those facilities
      const { data: rawReservations } = await supabase
        .from("reservations")
        .select("id, facility_id, user_id, check_in, check_out, guests, total_price, status, created_at")
        .in("facility_id", facilityIds)
        .order("created_at", { ascending: false });

      const mapped: Reservation[] = (rawReservations ?? []).map((r) => ({
        id: r.id,
        facility_name: facilityMap[r.facility_id] || "",
        user_id: r.user_id,
        check_in: r.check_in,
        check_out: r.check_out,
        guests: r.guests,
        total_price: r.total_price,
        status: r.status,
        created_at: r.created_at,
      }));

      setReservations(mapped);
      setLoading(false);
    }

    fetchReservations();
  }, [user]);

  const statusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return (
          <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
            確定
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
            保留中
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">
            キャンセル
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

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("ja-JP");
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">予約一覧</h1>

      {loading ? (
        <div className="rounded-xl bg-white shadow-sm p-6 space-y-4 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="h-4 w-32 bg-gray-200 rounded" />
              <div className="h-4 w-40 bg-gray-200 rounded" />
              <div className="h-4 w-24 bg-gray-200 rounded" />
              <div className="h-4 w-24 bg-gray-200 rounded" />
              <div className="h-4 w-16 bg-gray-200 rounded ml-auto" />
            </div>
          ))}
        </div>
      ) : reservations.length === 0 ? (
        <div className="rounded-xl bg-white p-12 shadow-sm text-center">
          <div className="text-5xl mb-4">📋</div>
          <p className="text-gray-500">まだ予約がありません</p>
        </div>
      ) : (
        <div className="rounded-xl bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-500">施設名</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">ゲスト</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">チェックイン</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">チェックアウト</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">人数</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">合計金額</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">ステータス</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">予約日</th>
                </tr>
              </thead>
              <tbody>
                {reservations.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {r.facility_name}
                    </td>
                    <td className="px-4 py-3 text-gray-600 truncate max-w-[160px]">
                      {r.user_id}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(r.check_in)}</td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(r.check_out)}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{r.guests}</td>
                    <td className="px-4 py-3 text-right text-gray-900 font-medium">
                      ¥{r.total_price?.toLocaleString() ?? "-"}
                    </td>
                    <td className="px-4 py-3">{statusBadge(r.status)}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {formatDate(r.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
