"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

interface AdminReservation {
  id: string;
  facility_name: string;
  user_email: string;
  check_in_date: string;
  check_out_date: string;
  guests: number;
  pets_info: string | null;
  total_price: number;
  status: "pending" | "confirmed" | "cancelled";
  created_at: string;
}

const STATUS_CONFIG = {
  pending: { label: "保留中", color: "bg-amber-50 text-amber-700" },
  confirmed: { label: "確認済み", color: "bg-green-50 text-green-700" },
  cancelled: { label: "キャンセル", color: "bg-gray-100 text-gray-500" },
};

export default function AdminReservations() {
  const { user } = useAuth();
  const [reservations, setReservations] = useState<AdminReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    fetchReservations();
  }, [user]);

  async function fetchReservations() {
    setLoading(true);
    const supabase = createClient();

    // 自分の施設IDを取得
    const { data: myFacilities } = await supabase
      .from("facilities")
      .select("id")
      .eq("owner_id", user!.id);

    const facilityIds = myFacilities?.map((f) => f.id) ?? [];

    if (facilityIds.length === 0) {
      setReservations([]);
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("reservations")
      .select("*, facilities(name)")
      .in("facility_id", facilityIds)
      .order("created_at", { ascending: false });

    if (data) {
      setReservations(
        data.map((r) => ({
          id: r.id,
          facility_name:
            (r.facilities as unknown as { name: string })?.name ?? "不明",
          user_email: r.user_id,
          check_in_date: r.check_in_date,
          check_out_date: r.check_out_date,
          guests: r.guests,
          pets_info: r.pets_info,
          total_price: r.total_price,
          status: r.status as AdminReservation["status"],
          created_at: r.created_at,
        }))
      );
    }
    setLoading(false);
  }

  async function updateStatus(
    id: string,
    newStatus: "confirmed" | "cancelled"
  ) {
    setUpdating(id);
    const supabase = createClient();
    await supabase
      .from("reservations")
      .update({ status: newStatus })
      .eq("id", id);

    setReservations((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
    );
    setUpdating(null);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">予約管理</h1>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-xl bg-white p-5 shadow-sm animate-pulse"
            >
              <div className="h-5 w-48 bg-gray-200 rounded mb-2" />
              <div className="h-4 w-32 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      ) : reservations.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl shadow-sm">
          <div className="text-5xl mb-4">📋</div>
          <p className="text-gray-500">まだ予約がありません</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  施設名
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  予約者
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  日程
                </th>
                <th className="text-center px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  人数
                </th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  金額
                </th>
                <th className="text-center px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ステータス
                </th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {reservations.map((r) => {
                const statusConf = STATUS_CONFIG[r.status];
                return (
                  <tr
                    key={r.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-5 py-4">
                      <p className="font-medium text-gray-900">
                        {r.facility_name}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(r.created_at).toLocaleDateString("ja-JP")}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600">
                      {r.user_email.slice(0, 8)}...
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm text-gray-900">
                        {r.check_in_date}
                      </p>
                      <p className="text-xs text-gray-400">
                        〜 {r.check_out_date}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-center text-sm text-gray-600">
                      {r.guests}名
                      {r.pets_info && (
                        <p className="text-xs text-gray-400">{r.pets_info}</p>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right font-bold text-gray-900">
                      ¥{r.total_price.toLocaleString()}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusConf.color}`}
                      >
                        {statusConf.label}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      {r.status === "pending" && (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => updateStatus(r.id, "confirmed")}
                            disabled={updating === r.id}
                            className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-light transition-colors disabled:opacity-50"
                          >
                            確認
                          </button>
                          <button
                            onClick={() => updateStatus(r.id, "cancelled")}
                            disabled={updating === r.id}
                            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
                          >
                            キャンセル
                          </button>
                        </div>
                      )}
                      {r.status === "confirmed" && (
                        <button
                          onClick={() => updateStatus(r.id, "cancelled")}
                          disabled={updating === r.id}
                          className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
                        >
                          キャンセル
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
