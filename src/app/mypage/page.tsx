"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { mapDbRowToFacility } from "@/lib/mapFacility";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { FavoriteButton } from "@/components/favorite-button";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { usePoints, usePointsForCoupon } from "@/hooks/usePoints";
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

interface Pet {
  id: string;
  name: string;
  type: "犬" | "猫";
  breed: string;
  birth_year: number | null;
  birth_month: number | null;
  size: "small" | "medium" | "large" | null;
  photo_url: string | null;
  vet_name: string | null;
  microchip_number: string | null;
  insurance_company: string | null;
  insurance_policy_number: string | null;
  doc_registration_url: string | null;
  doc_passport_url: string | null;
  doc_rabies_url: string | null;
  doc_vaccine_url: string | null;
}

const DOC_FIELDS = [
  { key: "doc_registration", label: "犬の登録証" },
  { key: "doc_passport", label: "ペットパスポート" },
  { key: "doc_rabies", label: "狂犬病予防接種証明書" },
  { key: "doc_vaccine", label: "ワクチン接種記録" },
] as const;

type DocKey = (typeof DOC_FIELDS)[number]["key"];

type PetFormData = Omit<Pet, "id"> & {
  id?: string;
  photoFile?: File | null;
  docFiles: Record<DocKey, File | null>;
};

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 30 }, (_, i) => CURRENT_YEAR - i);
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

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
  const [activeTab, setActiveTab] = useState<"favorites" | "reviews" | "reservations" | "pets">("favorites");

  // Pet state
  const [pets, setPets] = useState<Pet[]>([]);
  const [loadingPets, setLoadingPets] = useState(true);
  const [editingPet, setEditingPet] = useState<PetFormData | null>(null);
  const [savingPet, setSavingPet] = useState(false);

  const fetchPets = useCallback(async () => {
    if (!user) return;
    setLoadingPets(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("pets")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });
    if (data) {
      setPets(data as Pet[]);
    }
    setLoadingPets(false);
  }, [user]);

  useEffect(() => {
    if (!user) {
      setLoadingData(false);
      setLoadingPets(false);
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
    fetchPets();
  }, [user, fetchPets]);

  const handleSavePet = async () => {
    if (!user || !editingPet || !editingPet.name.trim()) return;
    setSavingPet(true);
    const supabase = createClient();

    let photoUrl = editingPet.photo_url;
    if (editingPet.photoFile) {
      const ext = editingPet.photoFile.name.split(".").pop();
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("pet-photos")
        .upload(path, editingPet.photoFile);
      if (!uploadError) {
        const { data: urlData } = supabase.storage.from("pet-photos").getPublicUrl(path);
        photoUrl = urlData.publicUrl;
      }
    }

    // Upload document files
    const docUrls: Record<string, string | null> = {
      doc_registration_url: editingPet.doc_registration_url,
      doc_passport_url: editingPet.doc_passport_url,
      doc_rabies_url: editingPet.doc_rabies_url,
      doc_vaccine_url: editingPet.doc_vaccine_url,
    };
    for (const { key } of DOC_FIELDS) {
      const file = editingPet.docFiles[key];
      if (file) {
        const ext = file.name.split(".").pop();
        const path = `${user.id}/${key}_${crypto.randomUUID()}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from("pet-documents")
          .upload(path, file);
        if (!uploadErr) {
          const { data: urlData } = supabase.storage.from("pet-documents").getPublicUrl(path);
          docUrls[`${key}_url`] = urlData.publicUrl;
        }
      }
    }

    const payload = {
      user_id: user.id,
      name: editingPet.name.trim(),
      type: editingPet.type,
      breed: editingPet.breed.trim() || null,
      birth_year: editingPet.birth_year,
      birth_month: editingPet.birth_month,
      size: editingPet.type === "犬" ? editingPet.size : null,
      photo_url: photoUrl,
      vet_name: editingPet.vet_name?.trim() || null,
      microchip_number: editingPet.microchip_number?.trim() || null,
      insurance_company: editingPet.insurance_company?.trim() || null,
      insurance_policy_number: editingPet.insurance_policy_number?.trim() || null,
      doc_registration_url: docUrls.doc_registration_url,
      doc_passport_url: docUrls.doc_passport_url,
      doc_rabies_url: docUrls.doc_rabies_url,
      doc_vaccine_url: docUrls.doc_vaccine_url,
    };

    if (editingPet.id) {
      await supabase.from("pets").update(payload).eq("id", editingPet.id);
    } else {
      await supabase.from("pets").insert(payload);
    }

    setEditingPet(null);
    setSavingPet(false);
    fetchPets();
  };

  const handleDeletePet = async (petId: string) => {
    if (!confirm("このペット情報を削除しますか？")) return;
    const supabase = createClient();
    await supabase.from("pets").delete().eq("id", petId);
    fetchPets();
  };

  const emptyDocFiles = (): Record<DocKey, File | null> => ({
    doc_registration: null,
    doc_passport: null,
    doc_rabies: null,
    doc_vaccine: null,
  });

  const newPetForm = (): PetFormData => ({
    name: "",
    type: "犬",
    breed: "",
    birth_year: null,
    birth_month: null,
    size: "small",
    photo_url: null,
    photoFile: null,
    vet_name: null,
    microchip_number: null,
    insurance_company: null,
    insurance_policy_number: null,
    doc_registration_url: null,
    doc_passport_url: null,
    doc_rabies_url: null,
    doc_vaccine_url: null,
    docFiles: emptyDocFiles(),
  });

  // Redirect to login
  if (!authLoading && !user) {
    return (
      <>
        <Header />
        <main className="flex-1 bg-gray-50 pt-16">
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

  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "ユーザー";

  const today = new Date().toISOString().split("T")[0];
  const upcomingReservations = reservations.filter(
    (r) => r.check_in_date >= today && r.status !== "cancelled",
  );
  const pastReservations = reservations.filter(
    (r) => r.check_in_date < today || r.status === "cancelled",
  );

  return (
    <>
      <Header />
      <main className="flex-1 bg-gray-50 pt-16">
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
          {/* Profile Section */}
          {authLoading ? (
            <div className="animate-pulse space-y-2 mb-8">
              <div className="h-5 w-32 rounded bg-gray-200" />
              <div className="h-4 w-48 rounded bg-gray-200" />
            </div>
          ) : (
            <div className="mb-8">
              <h1 className="text-xl font-bold text-gray-900">{displayName}</h1>
              <p className="text-sm text-gray-500 mt-0.5">{user?.email}</p>
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
          <div className="flex gap-1 border-b border-gray-200 mb-6 overflow-x-auto">
            {([
              { key: "favorites" as const, label: "お気に入り", count: facilities.length },
              { key: "pets" as const, label: "ペット情報", count: pets.length },
              { key: "reservations" as const, label: "予約履歴", count: reservations.length },
              { key: "reviews" as const, label: "レビュー", count: reviews.length },
            ]).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`shrink-0 px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                  activeTab === tab.key
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className="ml-1.5 rounded-full bg-green-50 px-2 py-0.5 text-xs text-primary">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
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
            /* ===== お気に入り ===== */
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
          ) : activeTab === "pets" ? (
            /* ===== ペット情報 ===== */
            <div>
              {/* ペット一覧 */}
              {loadingPets ? (
                <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="bg-white rounded-xl p-5 shadow-sm animate-pulse">
                      <div className="flex gap-4">
                        <div className="h-16 w-16 rounded-full bg-gray-200" />
                        <div className="space-y-2 flex-1">
                          <div className="h-4 w-24 rounded bg-gray-200" />
                          <div className="h-3 w-32 rounded bg-gray-200" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  {pets.length === 0 && !editingPet && (
                    <div className="text-center py-16">
                      <div className="text-5xl mb-4">🐾</div>
                      <p className="text-gray-500 mb-4">ペット情報が登録されていません</p>
                      <button
                        onClick={() => setEditingPet(newPetForm())}
                        className="rounded-lg bg-primary px-6 py-2.5 text-sm font-bold text-white hover:bg-primary-light transition-colors"
                      >
                        ペットを登録する
                      </button>
                    </div>
                  )}

                  {pets.length > 0 && (
                    <div className="space-y-4 mb-6">
                      {pets.map((pet) => (
                        <div key={pet.id} className="rounded-xl bg-white p-5 shadow-sm border border-gray-100">
                          <div className="flex items-center gap-4">
                            {pet.photo_url ? (
                              <img src={pet.photo_url} alt={pet.name} className="h-16 w-16 rounded-full object-cover" />
                            ) : (
                              <div className="h-16 w-16 rounded-full bg-green-50 flex items-center justify-center text-2xl">
                                {pet.type === "犬" ? "🐶" : "🐱"}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-gray-900">{pet.name}</h3>
                              <p className="text-sm text-gray-500">
                                {pet.type}
                                {pet.breed && ` / ${pet.breed}`}
                                {pet.type === "犬" && pet.size && ` / ${pet.size === "small" ? "小型" : pet.size === "medium" ? "中型" : "大型"}`}
                              </p>
                              {pet.birth_year && (
                                <p className="text-xs text-gray-400">
                                  {pet.birth_year}年{pet.birth_month ? `${pet.birth_month}月` : ""}生まれ
                                </p>
                              )}
                              {(pet.vet_name || pet.microchip_number) && (
                                <div className="flex flex-wrap gap-2 mt-1">
                                  {pet.vet_name && (
                                    <span className="inline-flex items-center rounded bg-blue-50 px-1.5 py-0.5 text-[10px] text-blue-600">獣医: {pet.vet_name}</span>
                                  )}
                                  {pet.microchip_number && (
                                    <span className="inline-flex items-center rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500">MC: {pet.microchip_number}</span>
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="flex gap-2 shrink-0">
                              <button
                                onClick={() =>
                                  setEditingPet({
                                    id: pet.id,
                                    name: pet.name,
                                    type: pet.type,
                                    breed: pet.breed || "",
                                    birth_year: pet.birth_year,
                                    birth_month: pet.birth_month,
                                    size: pet.size,
                                    photo_url: pet.photo_url,
                                    photoFile: null,
                                    vet_name: pet.vet_name,
                                    microchip_number: pet.microchip_number,
                                    insurance_company: pet.insurance_company,
                                    insurance_policy_number: pet.insurance_policy_number,
                                    doc_registration_url: pet.doc_registration_url,
                                    doc_passport_url: pet.doc_passport_url,
                                    doc_rabies_url: pet.doc_rabies_url,
                                    doc_vaccine_url: pet.doc_vaccine_url,
                                    docFiles: emptyDocFiles(),
                                  })
                                }
                                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
                              >
                                編集
                              </button>
                              <button
                                onClick={() => handleDeletePet(pet.id)}
                                className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50"
                              >
                                削除
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 登録/編集フォーム */}
                  {editingPet && (
                    <div className="rounded-xl bg-white p-6 shadow-sm border border-primary/20 mb-6">
                      <h3 className="font-bold text-gray-900 mb-4">
                        {editingPet.id ? "ペット情報を編集" : "新しいペットを登録"}
                      </h3>
                      <div className="space-y-4">
                        {/* 名前 */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            ペットの名前 <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={editingPet.name}
                            onChange={(e) => setEditingPet({ ...editingPet, name: e.target.value })}
                            placeholder="例: ポチ"
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </div>

                        {/* タイプ */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">タイプ</label>
                          <select
                            value={editingPet.type}
                            onChange={(e) =>
                              setEditingPet({
                                ...editingPet,
                                type: e.target.value as "犬" | "猫",
                                size: e.target.value === "猫" ? null : editingPet.size || "small",
                              })
                            }
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                          >
                            <option value="犬">犬</option>
                            <option value="猫">猫</option>
                          </select>
                        </div>

                        {/* 品種 */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">品種（任意）</label>
                          <input
                            type="text"
                            value={editingPet.breed}
                            onChange={(e) => setEditingPet({ ...editingPet, breed: e.target.value })}
                            placeholder="例: トイプードル"
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </div>

                        {/* 生年月日 */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">生年月日（任意）</label>
                          <div className="flex gap-3">
                            <select
                              value={editingPet.birth_year ?? ""}
                              onChange={(e) =>
                                setEditingPet({
                                  ...editingPet,
                                  birth_year: e.target.value ? Number(e.target.value) : null,
                                })
                              }
                              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                            >
                              <option value="">年</option>
                              {YEARS.map((y) => (
                                <option key={y} value={y}>{y}年</option>
                              ))}
                            </select>
                            <select
                              value={editingPet.birth_month ?? ""}
                              onChange={(e) =>
                                setEditingPet({
                                  ...editingPet,
                                  birth_month: e.target.value ? Number(e.target.value) : null,
                                })
                              }
                              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                            >
                              <option value="">月</option>
                              {MONTHS.map((m) => (
                                <option key={m} value={m}>{m}月</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* サイズ（犬のみ） */}
                        {editingPet.type === "犬" && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">サイズ</label>
                            <select
                              value={editingPet.size ?? "small"}
                              onChange={(e) =>
                                setEditingPet({
                                  ...editingPet,
                                  size: e.target.value as "small" | "medium" | "large",
                                })
                              }
                              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                            >
                              <option value="small">小型犬</option>
                              <option value="medium">中型犬</option>
                              <option value="large">大型犬</option>
                            </select>
                          </div>
                        )}

                        {/* 写真 */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">写真（任意）</label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0] ?? null;
                              setEditingPet({ ...editingPet, photoFile: file });
                            }}
                            className="w-full text-sm text-gray-500 file:mr-3 file:rounded-lg file:border-0 file:bg-primary/10 file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary hover:file:bg-primary/20"
                          />
                          {editingPet.photo_url && !editingPet.photoFile && (
                            <img src={editingPet.photo_url} alt="現在の写真" className="mt-2 h-20 w-20 rounded-lg object-cover" />
                          )}
                        </div>

                        {/* 獣医記録セクション */}
                        <div className="border-t border-gray-200 pt-5 mt-5">
                          <h4 className="text-sm font-bold text-gray-900 mb-1">獣医記録</h4>
                          <p className="text-xs text-gray-400 mb-4">任意</p>

                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">獣医師名</label>
                              <input
                                type="text"
                                value={editingPet.vet_name ?? ""}
                                onChange={(e) => setEditingPet({ ...editingPet, vet_name: e.target.value })}
                                placeholder="例: 田中動物病院 田中太郎"
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">マイクロチップ番号</label>
                              <input
                                type="text"
                                value={editingPet.microchip_number ?? ""}
                                onChange={(e) => setEditingPet({ ...editingPet, microchip_number: e.target.value })}
                                placeholder="例: 392141234567890"
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">保険会社名</label>
                              <input
                                type="text"
                                value={editingPet.insurance_company ?? ""}
                                onChange={(e) => setEditingPet({ ...editingPet, insurance_company: e.target.value })}
                                placeholder="例: アニコム損保"
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">保険証券番号</label>
                              <input
                                type="text"
                                value={editingPet.insurance_policy_number ?? ""}
                                onChange={(e) => setEditingPet({ ...editingPet, insurance_policy_number: e.target.value })}
                                placeholder="例: P-12345678"
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                              />
                            </div>
                          </div>
                        </div>

                        {/* 書類アップロード */}
                        <div className="border-t border-gray-200 pt-5 mt-5">
                          <h4 className="text-sm font-bold text-gray-900 mb-1">書類</h4>
                          <p className="text-xs text-gray-400 mb-4">画像またはPDFをアップロードできます（任意）</p>

                          <div className="space-y-3">
                            {DOC_FIELDS.map(({ key, label }) => {
                              const urlKey = `${key}_url` as keyof Pet;
                              const existingUrl = editingPet[urlKey] as string | null;
                              const selectedFile = editingPet.docFiles[key];
                              const inputId = `doc-${key}`;

                              return (
                                <div key={key} className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3">
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium text-gray-700">{label}</p>
                                    {selectedFile ? (
                                      <p className="text-xs text-primary truncate mt-0.5">{selectedFile.name}</p>
                                    ) : existingUrl ? (
                                      <p className="text-xs text-green-600 mt-0.5">アップロード済み</p>
                                    ) : null}
                                  </div>
                                  <div>
                                    <input
                                      id={inputId}
                                      type="file"
                                      accept="image/*,.pdf"
                                      className="hidden"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0] ?? null;
                                        setEditingPet({
                                          ...editingPet,
                                          docFiles: { ...editingPet.docFiles, [key]: file },
                                        });
                                      }}
                                    />
                                    <label
                                      htmlFor={inputId}
                                      className="cursor-pointer text-xs font-medium text-primary hover:text-primary-light transition-colors"
                                    >
                                      {existingUrl || selectedFile ? "変更する" : "画像またはPDFを追加"}
                                    </label>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* ボタン */}
                        <div className="flex gap-3 pt-2">
                          <button
                            onClick={handleSavePet}
                            disabled={savingPet || !editingPet.name.trim()}
                            className="rounded-lg bg-primary px-6 py-2.5 text-sm font-bold text-white hover:bg-primary-light transition-colors disabled:opacity-50"
                          >
                            {savingPet ? "保存中..." : editingPet.id ? "更新する" : "登録する"}
                          </button>
                          <button
                            onClick={() => setEditingPet(null)}
                            className="rounded-lg border border-gray-200 px-6 py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-50"
                          >
                            キャンセル
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ペット追加ボタン */}
                  {pets.length > 0 && !editingPet && (
                    <button
                      onClick={() => setEditingPet(newPetForm())}
                      className="w-full rounded-xl border-2 border-dashed border-gray-300 py-4 text-sm font-medium text-gray-500 hover:border-primary hover:text-primary transition-colors"
                    >
                      + ペットを追加
                    </button>
                  )}
                </>
              )}
            </div>
          ) : activeTab === "reviews" ? (
            /* ===== レビュー ===== */
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
          ) : (
            /* ===== 予約履歴 ===== */
            <div>
              {/* 今後の予約 */}
              <div className="mb-8">
                <h3 className="text-sm font-bold text-gray-900 mb-3">今後の予約</h3>
                {upcomingReservations.length === 0 ? (
                  <div className="rounded-xl bg-white p-8 shadow-sm text-center">
                    <p className="text-gray-400 text-sm">今後の予約はありません</p>
                    <Link href="/" className="mt-2 inline-block text-sm text-primary hover:underline">
                      施設を探して予約する →
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {upcomingReservations.map((reservation) => {
                      const statusLabel =
                        reservation.status === "confirmed" ? "確定" : "保留中";
                      const statusColor =
                        reservation.status === "confirmed"
                          ? "bg-green-50 text-green-700"
                          : "bg-amber-50 text-amber-700";

                      return (
                        <div
                          key={reservation.id}
                          className="rounded-xl bg-white p-5 shadow-sm border-l-4 border-primary"
                        >
                          <Link href={`/facility/${reservation.facility_id}`} className="block">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <h4 className="font-bold text-gray-900">
                                  {reservation.facility_name}
                                </h4>
                                <p className="mt-1 text-sm text-gray-700">
                                  {reservation.check_in_date} 〜 {reservation.check_out_date}
                                </p>
                                <p className="mt-1 text-xs text-gray-500">
                                  {reservation.guests}名
                                  {reservation.pets_info && ` / ${reservation.pets_info}`}
                                </p>
                              </div>
                              <div className="text-right shrink-0">
                                <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor}`}>
                                  {statusLabel}
                                </span>
                                <p className="mt-2 text-lg font-bold text-gray-900">
                                  ¥{reservation.total_price.toLocaleString()}
                                </p>
                              </div>
                            </div>
                          </Link>
                          <div className="mt-3 pt-3 border-t border-gray-100 flex justify-end">
                            <button
                              onClick={async () => {
                                if (!confirm("この予約をキャンセルしますか？")) return;
                                const supabase = createClient();
                                await supabase
                                  .from("reservations")
                                  .update({ status: "cancelled" })
                                  .eq("id", reservation.id);
                                window.location.reload();
                              }}
                              className="rounded-lg border border-red-200 px-4 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 transition-colors"
                            >
                              キャンセルする
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 過去の予約 */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-3">過去の予約</h3>
                {pastReservations.length === 0 ? (
                  <div className="rounded-xl bg-gray-50 p-8 text-center">
                    <p className="text-gray-400 text-sm">過去の予約はありません</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pastReservations.map((reservation) => {
                      const statusLabel =
                        reservation.status === "confirmed"
                          ? "利用済み"
                          : reservation.status === "cancelled"
                            ? "キャンセル済"
                            : "保留中";

                      return (
                        <Link
                          key={reservation.id}
                          href={`/facility/${reservation.facility_id}`}
                          className="block rounded-xl bg-gray-50 p-4 hover:bg-gray-100 transition-colors opacity-70"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h4 className="font-medium text-gray-600 text-sm">
                                {reservation.facility_name}
                              </h4>
                              <p className="mt-0.5 text-xs text-gray-400">
                                {reservation.check_in_date} 〜 {reservation.check_out_date}
                                {" / "}{reservation.guests}名
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="inline-block rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-500">
                                {statusLabel}
                              </span>
                              <p className="mt-1 text-sm font-medium text-gray-500">
                                ¥{reservation.total_price.toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
