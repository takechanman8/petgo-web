"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

interface AdminReview {
  id: string;
  facility_name: string;
  user_name: string;
  pet_type: string;
  pet_breed: string | null;
  rating: number;
  comment: string | null;
  photo_url: string | null;
  created_at: string;
}

export default function AdminReviews() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchReviews();
  }, [user]);

  async function fetchReviews() {
    setLoading(true);
    const supabase = createClient();

    // 自分の施設IDを取得
    const { data: myFacilities } = await supabase
      .from("facilities")
      .select("id")
      .eq("owner_id", user!.id);

    const facilityIds = myFacilities?.map((f) => f.id) ?? [];

    if (facilityIds.length === 0) {
      setReviews([]);
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("reviews")
      .select("*, facilities(name)")
      .in("facility_id", facilityIds)
      .order("created_at", { ascending: false });

    if (data) {
      setReviews(
        data.map((r) => ({
          id: r.id,
          facility_name:
            (r.facilities as unknown as { name: string })?.name ?? "不明",
          user_name: r.user_name,
          pet_type: r.pet_type,
          pet_breed: r.pet_breed,
          rating: r.rating,
          comment: r.comment,
          photo_url: r.photo_url,
          created_at: r.created_at,
        }))
      );
    }
    setLoading(false);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">レビュー管理</h1>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-xl bg-white p-5 shadow-sm animate-pulse"
            >
              <div className="h-5 w-48 bg-gray-200 rounded mb-2" />
              <div className="h-4 w-64 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl shadow-sm">
          <div className="text-5xl mb-4">⭐</div>
          <p className="text-gray-500">まだレビューがありません</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  施設名
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  投稿者
                </th>
                <th className="text-center px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  評価
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  コメント
                </th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  投稿日
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {reviews.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4">
                    <p className="font-medium text-gray-900">
                      {r.facility_name}
                    </p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-sm text-gray-900">{r.user_name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {r.pet_type === "犬" ? "🐶" : "🐱"}{" "}
                      {r.pet_breed || r.pet_type}
                    </p>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <div className="flex items-center justify-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg
                          key={star}
                          className={`h-4 w-4 ${
                            star <= r.rating
                              ? "text-amber-400"
                              : "text-gray-200"
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    {r.comment ? (
                      <p className="text-sm text-gray-700 line-clamp-2 max-w-xs">
                        {r.comment}
                      </p>
                    ) : (
                      <span className="text-xs text-gray-400">
                        コメントなし
                      </span>
                    )}
                    {r.photo_url && (
                      <img
                        src={r.photo_url}
                        alt="レビュー写真"
                        className="mt-2 h-12 w-12 rounded-lg object-cover"
                      />
                    )}
                  </td>
                  <td className="px-5 py-4 text-right text-sm text-gray-500">
                    {new Date(r.created_at).toLocaleDateString("ja-JP")}
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
