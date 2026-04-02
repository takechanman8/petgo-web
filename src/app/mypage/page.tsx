"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { mapDbRowToFacility } from "@/lib/mapFacility";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { FavoriteButton } from "@/components/favorite-button";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { usePoints, usePointsForCoupon } from "@/hooks/usePoints";
import type { PointHistory } from "@/hooks/usePoints";
import { useFavorites } from "@/hooks/useFavorites";
import type { Facility } from "@/types/facility";

interface UserReview {
  id: string;
  facility_id: string;
  facility_name: string;
  rating: number;
  pet_type: string;
  pet_breed: string | null;
  comment: string | null;
  photo_url: string | null;
  created_at: string;
}

interface Reservation {
  id: string;
  facility_id: string;
  facility_name: string;
  check_in_date: string;
  check_out_date: string;
  guests: number;
  pets_info: string | null;
  total_price: number;
  status: "pending" | "confirmed" | "cancelled";
  created_at: string;
}

const SIZE_LABELS: Record<string, string> = {
  small: "小型",
  medium: "中型",
  large: "大型",
};

export default function MyPage() {
  const { user, loading: authLoading, signInWithGoogle } = useAuth();
  const { subscription, isPassMember, loading: subLoading } = useSubscription(user);
  const { totalPoints, history: pointHistory, loading: pointsLoading, refetch: refetchPoints } = usePoints(user);
  const { favoriteIds, toggle } = useFavorites(user);
  const [cancellingPass, setCancellingPass] = useState(false);
  const [exchangingCoupon, setExchangingCoupon] = useState(false);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [reviews, setReviews] = useState<UserReview[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [activeTab, setActiveTab] = useState<"favorites" | "reviews" | "reservations">("favorites");

  useEffect(() => {
    if (!user) {
      setLoadingData(false);
      return;
    }

    const supabase = createClient();

    async function fetchData() {
      setLoadingData(true);

      const [favResult, reviewResult, reservationResult] = await Promise.all([
        supabase
          .from("favorites")
          .select("facility_id, facilities(*, reviews(rating))")
          .eq("user_id", user!.id),
        supabase
          .from("reviews")
          .select("id, facility_id, rating, pet_type, pet_breed, comment, photo_url, created_at, facilities(name)")
          .eq("user_id", user!.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("reservations")
          .select("id, facility_id, check_in_date, check_out_date, guests, pets_info, total_price, status, created_at, facilities(name)")
          .eq("user_id", user!.id)
          .order("created_at", { ascending: false }),
      ]);

      if (favResult.data) {
        const mapped = favResult.data
          .filter((r) => r.facilities)
          .map((r) => {
            const fac = r.facilities as unknown as Record<string, unknown>;
            const revs = (fac.reviews as { rating: number }[]) ?? [];
            return mapDbRowToFacility(fac, revs);
          });
        setFacilities(mapped);
      }

      if (reviewResult.data) {
        const mapped = reviewResult.data.map((r) => ({
          id: r.id,
          facility_id: r.facility_id,
          facility_name: (r.facilities as unknown as { name: string })?.name ?? "不明な施設",
          rating: r.rating,
          pet_type: r.pet_type,
          pet_breed: r.pet_breed,
          comment: r.comment,
          photo_url: r.photo_url,
          created_at: r.created_at,
        }));
        setReviews(mapped);
      }

      if (reservationResult.data) {
        const mapped = reservationResult.data.map((r) => ({
          id: r.id,
          facility_id: r.facility_id,
          facility_name: (r.facilities as unknown as { name: string })?.name ?? "不明な施設",
          check_in_date: r.check_in_date,
          check_out_date: r.check_out_date,
          guests: r.guests,
          pets_info: r.pets_info,
          total_price: r.total_price,
          status: r.status as Reservation["status"],
          created_at: r.created_at,
        }));
        setReservations(mapped);
      }

      setLoadingData(false);
    }

    fetchData();
  }, [user]);

  // Redirect to login
  if (!authLoading && !user) {
    return (
      <>
        <Header />
        <main className="flex-1 bg-gray-50">
          <div className="mx-auto max-w-4xl px-4 py-20 text-center">
            <div className="text-6xl mb-6">🐾</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">
              ログインが必要です
            </h1>
            <p className="text-gray-500 mb-8">
              マイページを利用するにはログインしてください
            </p>
            <button
              onClick={signInWithGoogle}
              className="rounded-full bg-primary px-8 py-3 text-sm font-bold text-white hover:bg-primary-light transition-colors"
            >
              Googleでログイン
            </button>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const avatarUrl = user?.user_metadata?.avatar_url;
  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "ユーザー";

  return (
    <>
      <Header />
      <main className="flex-1 bg-gray-50">
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
          {/* Profile Section */}
          {authLoading ? (
            <div className="animate-pulse flex items-center gap-4 mb-8">
              <div className="h-16 w-16 rounded-full bg-gray-200" />
              <div className="space-y-2">
                <div className="h-5 w-32 rounded bg-gray-200" />
                <div className="h-4 w-48 rounded bg-gray-200" />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4 mb-8">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="アバター"
                  className="h-16 w-16 rounded-full object-cover border-2 border-primary"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center text-white text-xl font-bold">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h1 className="text-xl font-bold text-gray-900">{displayName}</h1>
                <p className="text-sm text-gray-500">{user?.email}</p>
              </div>
            </div>
          )}

          {/* PetGo PASS Section */}
          <div className="mb-8 rounded-xl bg-white p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-50 text-xl">👑</span>
                <div>
                  <h2 className="font-bold text-gray-900">PetGo PASS</h2>
                  {subLoading ? (
                    <div className="mt-1 h-4 w-32 rounded bg-gray-200 animate-pulse" />
                  ) : isPassMember && subscription ? (
                    <p className="text-sm text-gray-500">
                      <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 px-2 py-0.5 text-xs font-bold text-white mr-2">
                        PASS
                      </span>
                      次回更新日: {new Date(subscription.current_period_end).toLocaleDateString("ja-JP")}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-500">未加入</p>
                  )}
                </div>
              </div>
              <div>
                {subLoading ? null : isPassMember ? (
                  <button
                    onClick={async () => {
                      if (!confirm("PetGo PASSを解約しますか？現在の請求期間が終了するまで特典はご利用いただけます。")) return;
                      setCancellingPass(true);
                      const supabase = createClient();
                      await supabase
                        .from("subscriptions")
                        .update({ status: "cancelled" })
                        .eq("id", subscription!.id);
                      window.location.reload();
                    }}
                    disabled={cancellingPass}
                    className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-medium text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    {cancellingPass ? "処理中..." : "解約する"}
                  </button>
                ) : (
                  <Link
                    href="/pass"
                    className="rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2 text-xs font-bold text-white hover:shadow-md transition-all"
                  >
                    加入する
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Points Section */}
          <div className="mb-8 rounded-xl bg-white p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-50 text-xl">🪙</span>
              <h2 className="font-bold text-gray-900">ポイント</h2>
            </div>

            {pointsLoading ? (
              <div className="animate-pulse space-y-3">
                <div className="h-10 w-32 rounded bg-gray-200" />
                <div className="h-4 w-48 rounded bg-gray-200" />
              </div>
            ) : (
              <>
                <div className="flex items-end justify-between mb-4">
                  <div>
                    <p className="text-4xl font-bold text-primary">{totalPoints.toLocaleString()}<span className="text-lg font-normal text-gray-500 ml-1">pt</span></p>
                    {isPassMember && (
                      <p className="text-xs text-amber-600 mt-1">PASS会員: ポイント2倍ボーナス適用中</p>
                    )}
                  </div>
                  <button
                    onClick={async () => {
                      if (totalPoints < 500) return;
                      if (!confirm("500ポイントを500円OFFクーポンに交換しますか？")) return;
                      setExchangingCoupon(true);
                      const { error } = await usePointsForCoupon(user!.id, 500);
                      if (error) {
                        alert(`エラー: ${error}`);
                      } else {
                        alert("500円OFFクーポンを獲得しました！次回予約時に自動適用されます。");
                        refetchPoints();
                      }
                      setExchangingCoupon(false);
                    }}
                    disabled={totalPoints < 500 || exchangingCoupon}
                    className={`rounded-lg px-4 py-2 text-xs font-bold transition-all ${
                      totalPoints >= 500
                        ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:shadow-md"
                        : "bg-gray-100 text-gray-400 cursor-not-allowed"
                    } disabled:opacity-50`}
                  >
                    {exchangingCoupon ? "交換中..." : "クーポンに交換（500pt）"}
                  </button>
                </div>

                {/* ポイント履歴 */}
                {pointHistory.length > 0 && (
                  <div className="border-t border-gray-100 pt-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">ポイント履歴</h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {pointHistory.map((entry) => (
                        <div key={entry.id} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span className={`inline-block h-2 w-2 rounded-full ${entry.type === "earned" ? "bg-green-400" : "bg-red-400"}`} />
                            <span className="text-gray-700">
                              {entry.reason === "reservation" && "予約完了"}
                              {entry.reason === "review" && "レビュー投稿"}
                              {entry.reason === "referral" && "紹介ボーナス"}
                              {entry.reason === "coupon_used" && "クーポン交換"}
                            </span>
                            <span className="text-xs text-gray-400">
                              {new Date(entry.created_at).toLocaleDateString("ja-JP")}
                            </span>
                          </div>
                          <span className={`font-medium ${entry.type === "earned" ? "text-green-600" : "text-red-500"}`}>
                            {entry.type === "earned" ? "+" : "-"}{entry.points}pt
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 border-b border-gray-200 mb-6">
            <button
              onClick={() => setActiveTab("favorites")}
              className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === "favorites"
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              お気に入り施設
              {facilities.length > 0 && (
                <span className="ml-1.5 rounded-full bg-green-50 px-2 py-0.5 text-xs text-primary">
                  {facilities.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("reviews")}
              className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === "reviews"
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              投稿したレビュー
              {reviews.length > 0 && (
                <span className="ml-1.5 rounded-full bg-green-50 px-2 py-0.5 text-xs text-primary">
                  {reviews.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("reservations")}
              className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === "reservations"
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              予約履歴
              {reservations.length > 0 && (
                <span className="ml-1.5 rounded-full bg-green-50 px-2 py-0.5 text-xs text-primary">
                  {reservations.length}
                </span>
              )}
            </button>
          </div>

          {loadingData ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-xl overflow-hidden shadow-sm animate-pulse">
                  <div className="h-40 bg-gray-200" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : activeTab === "favorites" ? (
            facilities.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-5xl mb-4">💚</div>
                <p className="text-gray-500 mb-2">お気に入りの施設がまだありません</p>
                <Link href="/" className="text-sm text-primary hover:underline">
                  施設を探す →
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {facilities.map((facility) => (
                  <Link
                    key={facility.id}
                    href={`/facility/${facility.id}`}
                    className="group block bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all"
                  >
                    <div className="relative h-40 overflow-hidden">
                      <img
                        src={facility.image}
                        alt={facility.name}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <span className="absolute top-3 left-3 rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-medium text-primary">
                        {facility.type}
                      </span>
                      <div className="absolute top-3 right-3">
                        <FavoriteButton
                          isFavorite={favoriteIds.has(facility.id)}
                          onToggle={() => toggle(facility.id)}
                          isLoggedIn={true}
                        />
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-gray-900">{facility.name}</h3>
                      <p className="mt-1 text-xs text-gray-500">{facility.area}</p>
                      <div className="mt-2 flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg
                            key={star}
                            className={`h-4 w-4 ${star <= Math.round(facility.rating) ? "text-amber-400" : "text-gray-200"}`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                        <span className="ml-1 text-sm text-gray-700">{facility.rating}</span>
                        <span className="text-xs text-gray-400">({facility.reviews})</span>
                      </div>
                      <div className="mt-2 flex items-end justify-between">
                        <span className="text-lg font-bold text-gray-900">
                          ¥{facility.price.toLocaleString()}
                          <span className="text-xs font-normal text-gray-400">〜</span>
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )
          ) : activeTab === "reviews" ? (
            reviews.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-5xl mb-4">📝</div>
                <p className="text-gray-500 mb-2">まだレビューを投稿していません</p>
                <Link href="/" className="text-sm text-primary hover:underline">
                  施設を探してレビューを書く →
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <Link
                    key={review.id}
                    href={`/facility/${review.facility_id}`}
                    className="block rounded-xl bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-bold text-gray-900">{review.facility_name}</h3>
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
                      <div className="text-right shrink-0">
                        <span className="rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-primary">
                          {review.pet_type === "犬" ? "🐶" : "🐱"}{" "}
                          {review.pet_breed || review.pet_type}
                        </span>
                        <p className="mt-1 text-xs text-gray-400">
                          {new Date(review.created_at).toLocaleDateString("ja-JP")}
                        </p>
                      </div>
                    </div>
                    {review.comment && (
                      <p className="mt-3 text-sm text-gray-700 line-clamp-2">{review.comment}</p>
                    )}
                    {review.photo_url && (
                      <img
                        src={review.photo_url}
                        alt="レビュー写真"
                        className="mt-3 h-32 w-full rounded-lg object-cover"
                      />
                    )}
                  </Link>
                ))}
              </div>
            )
          ) : reservations.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">📋</div>
              <p className="text-gray-500 mb-2">予約履歴がありません</p>
              <Link href="/" className="text-sm text-primary hover:underline">
                施設を探して予約する →
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {reservations.map((reservation) => {
                const statusLabel =
                  reservation.status === "confirmed"
                    ? "確定"
                    : reservation.status === "cancelled"
                      ? "キャンセル済"
                      : "保留中";
                const statusColor =
                  reservation.status === "confirmed"
                    ? "bg-green-50 text-primary"
                    : reservation.status === "cancelled"
                      ? "bg-gray-100 text-gray-500"
                      : "bg-amber-50 text-amber-700";

                return (
                  <Link
                    key={reservation.id}
                    href={`/facility/${reservation.facility_id}`}
                    className="block rounded-xl bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-bold text-gray-900">
                          {reservation.facility_name}
                        </h3>
                        <p className="mt-1 text-sm text-gray-600">
                          {reservation.check_in_date} 〜 {reservation.check_out_date}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          {reservation.guests}名
                          {reservation.pets_info && ` / ${reservation.pets_info}`}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor}`}
                        >
                          {statusLabel}
                        </span>
                        <p className="mt-2 text-lg font-bold text-gray-900">
                          ¥{reservation.total_price.toLocaleString()}
                        </p>
                        <p className="mt-1 text-xs text-gray-400">
                          {new Date(reservation.created_at).toLocaleDateString("ja-JP")}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
