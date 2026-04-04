"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { usePoints, usePointsForCoupon } from "@/hooks/usePoints";
import { petChan } from "@/lib/petName";
import type { Facility } from "@/types/facility";

interface PetEntry {
  type: "犬" | "猫";
  size: "small" | "medium" | "large";
  count: number;
  name?: string;
}

const SIZE_LABELS: Record<string, string> = {
  small: "小型",
  medium: "中型",
  large: "大型",
};

interface ReservationFormProps {
  facility: Facility;
  acceptedSizes?: string[];
  catOk?: boolean;
  maxPets?: number;
  userPets?: { id: string; name: string; type: "犬" | "猫"; size: "small" | "medium" | "large" | null }[];
}

export function ReservationForm({
  facility,
  acceptedSizes = ["small", "medium", "large"],
  catOk = true,
  maxPets = 5,
  userPets = [],
}: ReservationFormProps) {
  const { user, signInWithGoogle } = useAuth();
  const { isPassMember } = useSubscription(user);
  const { totalPoints, refetch: refetchPoints } = usePoints(user);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(1);
  const [pets, setPets] = useState<PetEntry[]>([
    { type: "犬", size: acceptedSizes[0] as PetEntry["size"] || "small", count: 1 },
  ]);
  const [usePointDiscount, setUsePointDiscount] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Auto-fill from user's registered pets on first load
  useEffect(() => {
    if (userPets.length > 0) {
      const entries: PetEntry[] = userPets.slice(0, 5).map((p) => ({
        type: p.type,
        size: p.size || "small",
        count: 1,
        name: p.name,
      }));
      setPets(entries);
    }
  }, [userPets]);

  const today = new Date().toISOString().split("T")[0];

  const nights =
    checkIn && checkOut
      ? Math.max(0, Math.floor((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)))
      : 0;

  const totalPetCount = pets.reduce((sum, p) => sum + p.count, 0);
  const overLimit = totalPetCount > maxPets;

  const availableCoupons = Math.floor(totalPoints / 500);
  const basePrice = facility.price * Math.max(nights, 1) * guests;
  const pointDiscount = usePointDiscount ? Math.min(availableCoupons * 500, basePrice) : 0;
  const totalPrice = basePrice - pointDiscount;

  const petsInfoText = pets
    .map((p) => `${p.type}（${SIZE_LABELS[p.size]}）× ${p.count}頭`)
    .join("、");

  function addPet() {
    if (pets.length >= 5) return;
    setPets([...pets, { type: "犬", size: acceptedSizes[0] as PetEntry["size"] || "small", count: 1 }]);
  }

  function removePet(index: number) {
    setPets(pets.filter((_, i) => i !== index));
  }

  function updatePet(index: number, update: Partial<PetEntry>) {
    setPets(pets.map((p, i) => (i === index ? { ...p, ...update } : p)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!user) {
      signInWithGoogle();
      return;
    }
    if (!checkIn || !checkOut) {
      setError("チェックイン・チェックアウト日を選択してください");
      return;
    }
    if (nights <= 0) {
      setError("チェックアウト日はチェックイン日より後にしてください");
      return;
    }
    if (overLimit) {
      setError(`この施設は${maxPets}頭までです`);
      return;
    }

    setLoading(true);
    try {
      if (usePointDiscount && pointDiscount > 0) {
        const pointsToUse = Math.ceil(pointDiscount / 500) * 500;
        const { error: pointError } = await usePointsForCoupon(user.id, pointsToUse);
        if (pointError) {
          setError(`ポイント利用エラー: ${pointError}`);
          setLoading(false);
          return;
        }
        refetchPoints();
      }

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          facilityId: facility.id,
          facilityName: facility.name,
          checkIn,
          checkOut,
          guests,
          petsInfo: petsInfoText,
          totalPrice,
          nights,
          pointsUsed: pointDiscount,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "予約処理に失敗しました");
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "予約処理に失敗しました");
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl bg-white shadow-sm border border-gray-100 p-6">
      <h2 className="text-lg font-bold text-gray-900 mb-4">予約する</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 日程 */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">チェックイン</label>
            <input
              type="date"
              value={checkIn}
              min={today}
              onChange={(e) => {
                setCheckIn(e.target.value);
                if (checkOut && e.target.value >= checkOut) setCheckOut("");
              }}
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">チェックアウト</label>
            <input
              type="date"
              value={checkOut}
              min={checkIn || today}
              onChange={(e) => setCheckOut(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              required
            />
          </div>
        </div>

        {nights > 0 && <p className="text-xs text-gray-500 -mt-2">{nights}泊</p>}

        {/* 人数 */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">人数</label>
          <select
            value={guests}
            onChange={(e) => setGuests(Number(e.target.value))}
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>{n}名</option>
            ))}
          </select>
        </div>

        {/* ペット情報（複数対応） */}
        <div className="space-y-3">
          <p className="text-xs font-medium text-gray-600">ペット情報</p>

          {pets.map((pet, idx) => (
            <div key={idx} className="relative">
              {pet.name && (
                <p className="text-[10px] text-primary font-medium mb-1">{petChan(pet.name)}</p>
              )}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">種類</label>
                  <select
                    value={pet.type}
                    onChange={(e) => updatePet(idx, { type: e.target.value as "犬" | "猫" })}
                    className="w-full rounded-lg border border-gray-200 px-2 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="犬">犬</option>
                    {catOk && <option value="猫">猫</option>}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">サイズ</label>
                  <select
                    value={pet.size}
                    onChange={(e) => updatePet(idx, { size: e.target.value as PetEntry["size"] })}
                    className="w-full rounded-lg border border-gray-200 px-2 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    disabled={pet.type === "猫"}
                  >
                    {(["small", "medium", "large"] as const).map((s) => {
                      const allowed = acceptedSizes.includes(s);
                      return (
                        <option key={s} value={s} disabled={!allowed}>
                          {SIZE_LABELS[s]}{!allowed ? "（不可）" : ""}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">頭数</label>
                  <div className="flex gap-1">
                    <select
                      value={pet.count}
                      onChange={(e) => updatePet(idx, { count: Number(e.target.value) })}
                      className="w-full rounded-lg border border-gray-200 px-2 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      {[1, 2, 3, 4, 5].map((n) => (
                        <option key={n} value={n}>{n}頭</option>
                      ))}
                    </select>
                    {pets.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePet(idx)}
                        className="shrink-0 h-9 w-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-200 transition-colors"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {overLimit && (
            <p className="text-xs font-bold text-red-500">この施設は{maxPets}頭までです（現在{totalPetCount}頭選択中）</p>
          )}

          {pets.length < 5 && (
            <button
              type="button"
              onClick={addPet}
              className="w-full rounded-lg border border-dashed border-gray-300 py-2 text-xs font-medium text-gray-500 hover:border-primary hover:text-primary transition-colors"
            >
              + ペットを追加
            </button>
          )}
        </div>

        {/* ポイント利用 */}
        {user && availableCoupons > 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={usePointDiscount}
                onChange={(e) => setUsePointDiscount(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span className="text-sm font-medium text-amber-800">
                ポイントを使う（{totalPoints.toLocaleString()}pt保有）
              </span>
            </label>
            {usePointDiscount && (
              <p className="mt-2 text-xs text-amber-700">
                {Math.ceil(pointDiscount / 500) * 500}pt利用 → ¥{pointDiscount.toLocaleString()}OFF
              </p>
            )}
          </div>
        )}

        {/* 料金 */}
        <div className="rounded-lg bg-green-50 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">合計金額</span>
            <span className="text-xl font-bold text-primary">¥{totalPrice.toLocaleString()}</span>
          </div>
          {nights > 0 && (
            <p className="mt-1 text-xs text-gray-500 text-right">
              ¥{facility.price.toLocaleString()} × {nights}泊 × {guests}名
              {pointDiscount > 0 && ` - ¥${pointDiscount.toLocaleString()}（ポイント割引）`}
            </p>
          )}
          {isPassMember && (
            <p className="mt-1 text-xs text-amber-600 text-right">
              PASS会員: 予約完了で+200pt獲得予定
            </p>
          )}
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</p>
        )}

        {/* 予約ボタン */}
        <button
          type="submit"
          disabled={loading || overLimit}
          className="w-full rounded-lg bg-accent py-3 text-sm font-bold text-white transition-colors hover:bg-accent-dark disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" className="opacity-75" />
              </svg>
              処理中...
            </span>
          ) : !user ? (
            "ログインして予約する"
          ) : (
            "予約する"
          )}
        </button>
      </form>
    </div>
  );
}
