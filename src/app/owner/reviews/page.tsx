"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

interface Review {
  id: string;
  facility_name: string;
  user_name: string;
  pet_type: string | null;
  pet_breed: string | null;
  rating: number;
  comment: string | null;
  created_at: string;
}

export default function OwnerReviewsPage() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const supabase = createClient();

    async function fetchReviews() {
      setLoading(true);

      // Get owner's facility IDs
      const { data: facilities } = await supabase
        .from("facilities")
        .select("id, name")
        .eq("owner_id", user!.id);

      const facilityList = facilities ?? [];
      const facilityIds = facilityList.map((f) => f.id);

      if (facilityIds.length === 0) {
        setReviews([]);
        setLoading(false);
        return;
      }

      const facilityMap = Object.fromEntries(
        facilityList.map((f) => [f.id, f.name])
      );

      // Get reviews for those facilities
      const { data: rawReviews } = await supabase
        .from("reviews")
        .select("id, facility_id, user_name, pet_type, pet_breed, rating, comment, created_at")
        .in("facility_id", facilityIds)
        .order("created_at", { ascending: false });

      const mapped: Review[] = (rawReviews ?? []).map((r) => ({
        id: r.id,
        facility_name: facilityMap[r.facility_id] || "",
        user_name: r.user_name || "匿名ユーザー",
        pet_type: r.pet_type,
        pet_breed: r.pet_breed,
        rating: r.rating,
        comment: r.comment,
        created_at: r.created_at,
      }));

      setReviews(mapped);
      setLoading(false);
    }

    fetchReviews();
  }, [user]);

  const renderStars = (rating: number) => {
    const filled = Math.round(rating);
    return (
      <span className="text-amber-500">
        {"★".repeat(filled)}
        {"☆".repeat(5 - filled)}
      </span>
    );
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("ja-JP");
  };

  const truncate = (text: string | null, maxLen: number) => {
    if (!text) return "-";
    if (text.length <= maxLen) return text;
    return text.slice(0, maxLen) + "...";
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">レビュー</h1>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="rounded-xl bg-white p-5 shadow-sm animate-pulse"
            >
              <div className="flex items-center gap-4 mb-3">
                <div className="h-4 w-32 bg-gray-200 rounded" />
                <div className="h-4 w-24 bg-gray-200 rounded" />
                <div className="h-4 w-20 bg-gray-200 rounded ml-auto" />
              </div>
              <div className="h-3 w-48 bg-gray-200 rounded mb-2" />
              <div className="h-3 w-64 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="rounded-xl bg-white p-12 shadow-sm text-center">
          <div className="text-5xl mb-4">⭐</div>
          <p className="text-gray-500">まだレビューがありません</p>
        </div>
      ) : (
        <div className="rounded-xl bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-500">施設名</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">レビュアー</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">ペット情報</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">評価</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">コメント</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">日付</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((review) => (
                  <tr
                    key={review.id}
                    className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {review.facility_name}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {review.user_name}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {review.pet_type || review.pet_breed
                        ? [review.pet_type, review.pet_breed].filter(Boolean).join(" / ")
                        : "-"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {renderStars(review.rating)}
                    </td>
                    <td className="px-4 py-3 text-gray-600 max-w-[240px]">
                      {truncate(review.comment, 60)}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                      {formatDate(review.created_at)}
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
