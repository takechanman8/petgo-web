"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { addPoints } from "@/hooks/usePoints";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

export default function ReservationSuccessPage() {
  return (
    <Suspense
      fallback={
        <>
          <Header />
          <main className="flex-1 bg-gray-50">
            <div className="mx-auto max-w-2xl px-4 py-20 text-center">
              <div className="space-y-4">
                <div className="mx-auto h-16 w-16 rounded-full bg-gray-200 animate-pulse" />
                <p className="text-gray-500">読み込み中...</p>
              </div>
            </div>
          </main>
          <Footer />
        </>
      }
    >
      <ReservationSuccessContent />
    </Suspense>
  );
}

function ReservationSuccessContent() {
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { isPassMember, loading: subLoading } = useSubscription(user);
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const savedRef = useRef(false);

  const sessionId = searchParams.get("session_id");
  const facilityId = searchParams.get("facility_id");
  const checkIn = searchParams.get("check_in");
  const checkOut = searchParams.get("check_out");
  const guests = searchParams.get("guests");
  const petsInfo = searchParams.get("pets_info");
  const totalPrice = searchParams.get("total_price");

  useEffect(() => {
    if (authLoading || subLoading || !user || savedRef.current) return;
    if (!sessionId || !facilityId || !checkIn || !checkOut || !totalPrice) {
      setStatus("error");
      setErrorMsg("予約情報が不足しています");
      return;
    }

    savedRef.current = true;

    async function saveReservation() {
      const supabase = createClient();

      // 重複チェック（同じstripe_session_idが既に存在しないか）
      const { data: existing } = await supabase
        .from("reservations")
        .select("id")
        .eq("stripe_session_id", sessionId)
        .maybeSingle();

      if (existing) {
        setStatus("success");
        return;
      }

      const { error } = await supabase.from("reservations").insert({
        facility_id: facilityId,
        user_id: user!.id,
        check_in_date: checkIn,
        check_out_date: checkOut,
        guests: Number(guests) || 1,
        pets_info: petsInfo || "",
        total_price: Number(totalPrice),
        status: "confirmed",
        stripe_session_id: sessionId,
      });

      if (error) {
        console.error("[reservation] Save error:", error);
        setStatus("error");
        setErrorMsg("予約の保存に失敗しました。お問い合わせください。");
      } else {
        // ポイント付与
        const { points } = await addPoints(user!.id, "reservation", isPassMember, facilityId!);
        setEarnedPoints(points);
        setStatus("success");
      }
    }

    saveReservation();
  }, [user, authLoading, subLoading, isPassMember, sessionId, facilityId, checkIn, checkOut, guests, petsInfo, totalPrice]);

  return (
    <>
      <Header />
      <main className="flex-1 bg-gray-50">
        <div className="mx-auto max-w-2xl px-4 py-20 text-center">
          {status === "loading" ? (
            <div className="space-y-4">
              <div className="mx-auto h-16 w-16 rounded-full bg-gray-200 animate-pulse" />
              <p className="text-gray-500">予約を確定しています...</p>
            </div>
          ) : status === "success" ? (
            <div className="space-y-6">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
                <svg
                  className="h-10 w-10 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <div>
                <h1 className="text-2xl font-bold text-gray-900">予約が完了しました</h1>
                <p className="mt-2 text-gray-500">
                  お支払いが確認されました。ご予約ありがとうございます。
                </p>
              </div>

              <div className="rounded-xl bg-white p-6 shadow-sm text-left space-y-3">
                <h2 className="font-bold text-gray-900">予約詳細</h2>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500">チェックイン</p>
                    <p className="font-medium text-gray-900">{checkIn}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">チェックアウト</p>
                    <p className="font-medium text-gray-900">{checkOut}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">人数</p>
                    <p className="font-medium text-gray-900">{guests}名</p>
                  </div>
                  <div>
                    <p className="text-gray-500">ペット</p>
                    <p className="font-medium text-gray-900">{petsInfo}</p>
                  </div>
                </div>
                <div className="border-t border-gray-100 pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">合計金額</span>
                    <span className="text-lg font-bold text-primary">
                      ¥{Number(totalPrice).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {earnedPoints > 0 && (
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
                  <p className="text-sm font-bold text-amber-700">
                    🎉 +{earnedPoints}ポイント獲得！
                    {isPassMember && (
                      <span className="ml-2 text-xs font-normal text-amber-600">（PASS会員2倍ボーナス）</span>
                    )}
                  </p>
                </div>
              )}

              <div className="flex gap-3 justify-center">
                <Link
                  href="/mypage"
                  className="rounded-lg bg-primary px-6 py-3 text-sm font-bold text-white hover:bg-primary-light transition-colors"
                >
                  マイページで確認
                </Link>
                <Link
                  href="/"
                  className="rounded-lg border border-gray-200 px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  トップに戻る
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
                <svg
                  className="h-10 w-10 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">エラーが発生しました</h1>
                <p className="mt-2 text-gray-500">{errorMsg}</p>
              </div>
              <Link
                href="/"
                className="inline-block rounded-lg bg-primary px-6 py-3 text-sm font-bold text-white hover:bg-primary-light transition-colors"
              >
                トップに戻る
              </Link>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
