"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase";
import { addReviewPoints } from "@/hooks/usePoints";
import type { User } from "@supabase/supabase-js";

interface ReviewModalProps {
  facilityId: string;
  user: User;
  isPassMember?: boolean;
  onClose: () => void;
  onSubmitted: () => void;
}

export function ReviewModal({
  facilityId,
  user,
  isPassMember = false,
  onClose,
  onSubmitted,
}: ReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [petType, setPetType] = useState<"犬" | "猫">("犬");
  const [petBreed, setPetBreed] = useState("");
  const [petSize, setPetSize] = useState<"small" | "medium" | "large">("small");
  const [comment, setComment] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [earnedPoints, setEarnedPoints] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("画像は5MB以下にしてください");
      return;
    }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setError("星評価を選択してください");
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      const supabase = createClient();
      let photoUrl: string | null = null;

      if (photoFile) {
        const ext = photoFile.name.split(".").pop();
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("review-photos")
          .upload(path, photoFile);
        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("review-photos").getPublicUrl(path);
        photoUrl = publicUrl;
      }

      const userName =
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email?.split("@")[0] ||
        "匿名ユーザー";

      const { error: insertError } = await supabase.from("reviews").insert({
        facility_id: facilityId,
        user_id: user.id,
        user_name: userName,
        pet_type: petType,
        pet_breed: petBreed || null,
        pet_size: petSize,
        rating,
        comment: comment || null,
        photo_url: photoUrl,
      });

      if (insertError) throw insertError;

      // ポイント付与
      const { points } = await addReviewPoints(user.id, isPassMember, facilityId);
      setEarnedPoints(points);

      onSubmitted();
    } catch (err: unknown) {
      console.error("Review submission error:", err);
      const message =
        err instanceof Error
          ? err.message
          : typeof err === "object" && err !== null && "message" in err
            ? String((err as { message: unknown }).message)
            : "不明なエラー";
      setError(`投稿に失敗しました: ${message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const displayRating = hoverRating || rating;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-lg font-bold text-gray-900">レビューを書く</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          {/* 星評価 */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              評価 <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-0.5"
                >
                  <svg
                    className={`h-8 w-8 transition-colors ${
                      star <= displayRating ? "text-amber-400" : "text-gray-200"
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </button>
              ))}
            </div>
          </div>

          {/* ペット情報 */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">ペット情報</label>
            <div className="flex gap-3">
              {(["犬", "猫"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setPetType(type)}
                  className={`flex-1 rounded-lg border-2 py-2 text-sm font-medium transition-colors ${
                    petType === type
                      ? "border-primary bg-green-50 text-primary"
                      : "border-gray-200 text-gray-500 hover:border-gray-300"
                  }`}
                >
                  {type === "犬" ? "🐶" : "🐱"} {type}
                </button>
              ))}
            </div>

            <input
              type="text"
              placeholder={petType === "犬" ? "犬種（例：トイプードル）" : "猫種（例：スコティッシュフォールド）"}
              value={petBreed}
              onChange={(e) => setPetBreed(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />

            <div className="flex gap-2">
              {([
                ["small", "小型"],
                ["medium", "中型"],
                ["large", "大型"],
              ] as const).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setPetSize(value)}
                  className={`flex-1 rounded-lg border-2 py-2 text-sm font-medium transition-colors ${
                    petSize === value
                      ? "border-primary bg-green-50 text-primary"
                      : "border-gray-200 text-gray-500 hover:border-gray-300"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* コメント */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">コメント</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="施設の感想を書いてください..."
              rows={4}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
          </div>

          {/* 写真アップロード */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">写真</label>
            {photoPreview ? (
              <div className="relative">
                <img
                  src={photoPreview}
                  alt="プレビュー"
                  className="h-40 w-full rounded-lg object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    setPhotoFile(null);
                    setPhotoPreview(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="absolute top-2 right-2 rounded-full bg-black/50 p-1 text-white hover:bg-black/70"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-200 py-8 text-sm text-gray-400 hover:border-gray-300 hover:text-gray-500"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                写真を追加
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          {earnedPoints > 0 && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-center">
              <p className="text-sm font-bold text-amber-700">
                🎉 +{earnedPoints}ポイント獲得！
                {isPassMember && (
                  <span className="ml-1 text-xs font-normal text-amber-600">（PASS会員2倍）</span>
                )}
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || rating === 0 || earnedPoints > 0}
            className="w-full rounded-lg bg-primary py-3 text-sm font-bold text-white transition-colors hover:bg-primary-light disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "投稿中..." : earnedPoints > 0 ? "投稿完了" : "投稿する"}
          </button>
        </form>
      </div>
    </div>
  );
}
