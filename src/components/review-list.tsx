"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";

interface Review {
  id: string;
  user_name: string;
  pet_type: string;
  pet_breed: string | null;
  pet_size: string | null;
  rating: number;
  comment: string | null;
  photo_url: string | null;
  created_at: string;
}

interface ReviewListProps {
  facilityId: string;
  refreshKey: number;
}

const SIZE_LABELS: Record<string, string> = {
  small: "小型",
  medium: "中型",
  large: "大型",
};

export function ReviewList({ facilityId, refreshKey }: ReviewListProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function fetchReviews() {
      setLoading(true);
      const { data, error } = await supabase
        .from("reviews")
        .select("id, user_name, pet_type, pet_breed, pet_size, rating, comment, photo_url, created_at")
        .eq("facility_id", facilityId)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setReviews(data);
      }
      setLoading(false);
    }

    fetchReviews();
  }, [facilityId, refreshKey]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="animate-pulse rounded-lg bg-gray-100 p-4">
            <div className="h-4 w-1/3 rounded bg-gray-200" />
            <div className="mt-3 h-3 w-full rounded bg-gray-200" />
            <div className="mt-2 h-3 w-2/3 rounded bg-gray-200" />
          </div>
        ))}
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-gray-400">
        まだレビューがありません。最初のレビューを書いてみましょう！
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <div key={review.id} className="rounded-lg border border-gray-100 bg-gray-50 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900">{review.user_name}</span>
                <span className="text-xs text-gray-400">
                  {new Date(review.created_at).toLocaleDateString("ja-JP")}
                </span>
              </div>
              <div className="mt-1 flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    className={`h-4 w-4 ${star <= review.rating ? "text-amber-400" : "text-gray-200"}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
            </div>
            <span className="shrink-0 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-primary">
              {review.pet_type === "犬" ? "🐶" : "🐱"}{" "}
              {review.pet_breed || review.pet_type}
              {review.pet_size ? `・${SIZE_LABELS[review.pet_size] || review.pet_size}` : ""}
            </span>
          </div>

          {review.comment && (
            <p className="mt-3 text-sm text-gray-700 leading-relaxed">{review.comment}</p>
          )}

          {review.photo_url && (
            <img
              src={review.photo_url}
              alt="レビュー写真"
              className="mt-3 h-40 w-full rounded-lg object-cover"
            />
          )}
        </div>
      ))}
    </div>
  );
}
